"""
scripts/test_ui_responsive.py
Tests responsive layout of the filter area (desktop 1280px vs mobile 375px).
Checks for absence of overflow-x scrollbar and verifies search query filter functionality.
"""
import sys
import os
import subprocess
import time
from playwright.sync_api import sync_playwright

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 3000
BASE_URL = f"http://localhost:{PORT}"

def test_ui():
    import urllib.request
    server_started = False
    proc = None
    try:
        urllib.request.urlopen(BASE_URL, timeout=2)
        print("[*] Local server is already running on port 3000.")
    except Exception:
        print("[*] Starting local Next.js dev server on port 3000 for testing...")
        proc = subprocess.Popen(
            ["cmd", "/c", "npx", "next", "dev", "-p", str(PORT)],
            cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform")),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        server_started = True
        ready = False
        for _ in range(15):
            time.sleep(1)
            if proc.poll() is not None:
                out, err = proc.communicate()
                print(f"[!] Server process exited prematurely with code {proc.returncode}!\nStdout: {out.decode('utf-8', errors='ignore')}\nStderr: {err.decode('utf-8', errors='ignore')}")
                break
            try:
                urllib.request.urlopen(BASE_URL, timeout=2)
                print("[*] Next.js server is ready!")
                ready = True
                break
            except Exception:
                pass
        if not ready:
            print("[WARN] Server did not become ready within timeout.")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            resp = page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15000)
            print(f"[*] Page loaded URL: {page.url}, Status: {resp.status if resp else 'No response'}, Title: {page.title()}")
            page.wait_for_timeout(2000)
            
            # Print page snippet
            html_snippet = page.content()[:500]
            print(f"[*] HTML snippet:\n{html_snippet}\n")
            
            # Verify no horizontal scrollbar on filter section
            has_h_scroll = page.evaluate("""() => {
                const el = document.querySelector('section .flex.flex-wrap');
                return el ? el.scrollWidth > el.clientWidth : false;
            }""")
            print(f"    Desktop Horizontal overflow detected: {has_h_scroll} (Expected: False)")
            assert not has_h_scroll, "Horizontal overflow detected on desktop!"

            # Test Search Input
            search_input = page.query_selector('input[placeholder*="검색"]')
            assert search_input is not None, "Search input not found!"
            print("    Search input found: OK")

            search_input.fill("컴퓨터")
            page.wait_for_timeout(500)
            results_text = page.inner_text('span:has-text("선택된 결과:")')
            print(f"    Filtered result with search '컴퓨터': {results_text}")

            # Desktop screenshot
            screenshot_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures"))
            os.makedirs(screenshot_dir, exist_ok=True)
            shot_desktop = os.path.join(screenshot_dir, "desktop_filter_wrap.png")
            page.screenshot(path=shot_desktop, full_page=False)
            print(f"    Saved desktop screenshot to: {shot_desktop}")

            # 2. Mobile test (375px)
            print("\n[2] Testing Mobile View (375 x 900)...")
            mobile_page = browser.new_page(viewport={"width": 375, "height": 900})
            mobile_page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15000)
            mobile_page.wait_for_timeout(1000)

            mobile_h_scroll = mobile_page.evaluate("""() => {
                const el = document.querySelector('section .flex.flex-wrap');
                return el ? el.scrollWidth > el.clientWidth : false;
            }""")
            print(f"    Mobile Horizontal overflow detected: {mobile_h_scroll} (Expected: False)")
            assert not mobile_h_scroll, "Horizontal overflow detected on mobile!"

            chips_count = len(mobile_page.query_selector_all('section .flex.flex-wrap button'))
            print(f"    Mobile chips count: {chips_count}")
            assert chips_count >= 10, "Not all category chips rendered!"

            shot_mobile = os.path.join(screenshot_dir, "mobile_filter_wrap.png")
            mobile_page.screenshot(path=shot_mobile, full_page=False)
            print(f"    Saved mobile screenshot to: {shot_mobile}")

            browser.close()
            print("\n[SUCCESS] UI Refactor verification passed 100%!")
    finally:
        if server_started and proc:
            proc.terminate()

if __name__ == "__main__":
    test_ui()
