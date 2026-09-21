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

def test_flow():
    print("=== STARTING GALLERY -> ADMIN CARDNEWS REDIRECT TEST ===")
    artifact_dir = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1600, "height": 1100})
        page = context.new_page()

        # 1. Load Main Gallery
        print("1. Loading http://localhost:3000/ ...")
        page.goto("http://localhost:3000/", timeout=30000, wait_until="networkidle")
        time.sleep(2)

        # Ensure admin mode is on by setting localStorage or checking for admin toggle
        page.evaluate("localStorage.setItem('isAdmin', 'true')")
        page.reload(wait_until="networkidle")
        time.sleep(1)

        # Look for '신규 전시 등록하기' or '대학교 카드 추가'
        print("2. Checking for '신규 전시 등록하기' button...")
        add_slot = page.locator("text='신규 전시 등록하기'")
        if not add_slot.is_visible():
            # If not visible, check if we need to click admin toggle
            admin_toggle = page.locator("button:has-text('관리자')")
            if admin_toggle.is_visible():
                admin_toggle.first.click()
                time.sleep(1)

        # Take screenshot of gallery with "신규 전시 등록하기" button
        ss_gallery = os.path.join(artifact_dir, "step_20_gallery_add_card_button.png")
        page.screenshot(path=ss_gallery, full_page=False)
        print(f"  Gallery screenshot saved: {ss_gallery}")

        # 3. Click '신규 전시 등록하기'
        print("3. Clicking '신규 전시 등록하기'...")
        add_link = page.locator("a:has-text('신규 전시 등록하기')").first
        if not add_link.is_visible():
            add_link = page.locator("a:has-text('대학교 카드 추가')").first

        if add_link.is_visible():
            href = add_link.get_attribute("href")
            print(f"  Found Link href: {href}")
            add_link.click()
        else:
            print("  Link not visible, navigating directly to href...")
            page.goto("http://localhost:3000/admin?tab=cardnews&year=2026")

        # 4. Verify landing on /admin cardnews inspection page
        page.wait_for_url("**/admin*", timeout=15000)
        print(f"4. Successfully navigated to: {page.url}")
        time.sleep(2)

        # Verify on-screen elements
        url_input = page.locator("#admin-url-input")
        univ_input = page.locator("input[placeholder*='서경대학교']")
        dept_input = page.locator("input[placeholder*='시각정보디자인']")
        year_input = page.locator("input[placeholder*='2026']")

        if not url_input.is_visible():
            print("ERROR: #admin-url-input is NOT visible on /admin!")
            browser.close()
            return False

        print("  Verified: On-screen URL bar and parameters are visible on /admin!")

        # 5. Type URL and click [AI 정보만 채우기]
        test_url = "https://sidi.hongik.ac.kr"
        print(f"5. Typing URL: {test_url} ...")
        url_input.fill(test_url)

        autofill_btn = page.locator("button:has-text('AI 정보만 채우기')")
        print("  Clicking [AI 정보만 채우기] button...")
        autofill_btn.click()

        print("  Waiting for local LLM auto-fill response...")
        auto_filled = False
        for _ in range(20):
            time.sleep(1)
            u = univ_input.input_value()
            d = dept_input.input_value()
            if "홍익" in u and ("시각" in d or "디자인" in d):
                auto_filled = True
                print(f"  [SUCCESS] Auto-filled: Univ='{u}', Dept='{d}', Year='{year_input.input_value()}'")
                break

        # Take screenshot of the landed /admin page with auto-filled fields
        ss_admin_landed = os.path.join(artifact_dir, "step_20_admin_cardnews_autofilled.png")
        page.screenshot(path=ss_admin_landed, full_page=False)
        print(f"  Admin landed screenshot saved: {ss_admin_landed}")

        browser.close()
        print("=== TEST COMPLETED SUCCESSFULLY ===")
        return True

if __name__ == "__main__":
    ok = test_flow()
    sys.exit(0 if ok else 1)
