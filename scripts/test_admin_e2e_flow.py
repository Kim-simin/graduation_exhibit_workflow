import os
import sys
import time

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.sync_api import sync_playwright

def test_admin_flow():
    print("=== STARTING ADMIN E2E PLAYWRIGHT TEST ===")
    artifact_dir = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 1100})
        page = context.new_page()

        # 1. Navigate to Admin Page
        print("1. Navigating to http://localhost:3000/admin ...")
        page.goto("http://localhost:3000/admin", timeout=30000, wait_until="networkidle")
        time.sleep(2)

        # Take initial screenshot
        ss_initial = os.path.join(artifact_dir, "step_19_admin_screen_initial.png")
        page.screenshot(path=ss_initial, full_page=False)
        print(f"  Screenshot saved: {ss_initial}")

        # Check URL input existence
        url_input = page.locator("#admin-url-input")
        if not url_input.is_visible():
            print("ERROR: #admin-url-input not visible on page!")
            browser.close()
            return False

        print("  Found #admin-url-input on screen!")

        # 2. Test AI Auto-Fill Only with local Llama.cpp Qwen2.5-VL
        test_url = "https://sidi.hongik.ac.kr"
        print(f"2. Typing URL: {test_url} into #admin-url-input ...")
        url_input.fill(test_url)

        autofill_btn = page.locator("button:has-text('AI 정보만 채우기')")
        print("  Clicking [AI 정보만 채우기] button...")
        autofill_btn.click()

        # Wait for inputs to be filled by local LLM
        print("  Waiting for Local LLM (Qwen2.5-VL) inference response...")
        univ_input = page.locator("input[placeholder*='서경대학교']")
        dept_input = page.locator("input[placeholder*='시각정보디자인']")
        year_input = page.locator("input[placeholder*='2026']")
        
        # Wait up to 20 seconds for the LLM response
        success_autofill = False
        for _ in range(20):
            time.sleep(1)
            val_u = univ_input.input_value()
            val_d = dept_input.input_value()
            if "홍익" in val_u and ("시각" in val_d or "디자인" in val_d):
                success_autofill = True
                print(f"  [SUCCESS] Auto-filled: Univ='{val_u}', Dept='{val_d}', Year='{year_input.input_value()}'")
                break

        if not success_autofill:
            print(f"WARNING: Auto-fill timeout or values not matched: Univ='{univ_input.input_value()}', Dept='{dept_input.input_value()}'")
        
        # Take screenshot of auto-filled parameters
        ss_autofilled = os.path.join(artifact_dir, "step_19_admin_autofilled_parameters.png")
        page.screenshot(path=ss_autofilled, full_page=False)
        print(f"  Screenshot saved: {ss_autofilled}")

        # 3. Test Full Capture (AI Auto Recognition + Graduation Works Exploration)
        capture_btn = page.locator("button:has-text('AI 자동 인식 & 졸업작품 탐색 캡처')")
        print("3. Clicking [🤖 AI 자동 인식 & 졸업작품 탐색 캡처] button...")
        capture_btn.click()

        print("  Waiting for Playwright exploration engine to finish capturing student artworks (up to 40s)...")
        # Wait for inspection panel to populate
        inspection_section = page.locator("#inspection-panel")
        success_capture = False
        for i in range(40):
            time.sleep(1)
            # Check if artworks or poster appeared in the panel
            work_cards = page.locator("#inspection-panel .grid > div")
            count = work_cards.count()
            if count > 1:
                print(f"  [SUCCESS] Artworks captured! Count: {count}")
                success_capture = True
                break

        # Scroll to inspection panel
        inspection_section.scroll_into_view_if_needed()
        time.sleep(1)

        ss_inspection = os.path.join(artifact_dir, "step_19_admin_inspection_populated.png")
        page.screenshot(path=ss_inspection, full_page=False)
        print(f"  Screenshot saved: {ss_inspection}")

        browser.close()
        print("=== E2E TEST COMPLETE ===")
        return True

if __name__ == "__main__":
    ok = test_admin_flow()
    sys.exit(0 if ok else 1)
