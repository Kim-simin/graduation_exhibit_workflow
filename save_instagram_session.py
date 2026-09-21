import os
import sys
import time
from playwright.sync_api import sync_playwright

# Windows 환경 콘솔 UTF-8 출력 보정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

AUTH_DIR = os.path.join("data", "auth")
STORAGE_STATE_PATH = os.path.join(AUTH_DIR, "instagram_auth.json")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

def run_interactive_instagram_login():
    os.makedirs(AUTH_DIR, exist_ok=True)

    print("=" * 65)
    print("🔑 [Instagram 1회성 브라우저 로그인 세션 생성기]")
    print("=" * 65)
    print("1. 실제 크로미움 브라우저가 실행됩니다.")
    print("2. 인스타그램 창에서 로그인을 완료해주세요.")
    print("3. 피드에 진입하거나 sessionid 쿠키가 발급되면 자동으로 세션이 저장됩니다.")
    print("=" * 65)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=False,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--start-maximized"
            ]
        )
        
        context = browser.new_context(
            viewport=None,
            user_agent=DEFAULT_USER_AGENT,
            locale="ko-KR"
        )

        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        page = context.new_page()

        print("\n🌐 인스타그램 로그인 페이지로 이동 중...")
        try:
            page.goto("https://www.instagram.com/accounts/login/", wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print(f"페이지 이동 경고: {e}")

        # 쿠키 동의 팝업 자동 닫기 시도
        for btn_txt in ["Allow all cookies", "모두 허용", "필수 쿠키만 허용", "Accept", "허용"]:
            try:
                btn = page.locator(f"button:has-text('{btn_txt}')").first
                if btn.is_visible():
                    btn.click()
                    page.wait_for_timeout(500)
            except Exception:
                pass

        print("\n👉 [안내] 브라우저 화면에서 직접 로그인을 진행해주세요. (감지 대기 중...)")

        saved = False
        start_time = time.time()
        timeout_seconds = 180  # 넉넉하게 3분 대기

        while time.time() - start_time < timeout_seconds:
            time.sleep(2)
            try:
                current_url = page.url
                cookies = context.cookies()
                has_session_cookie = any(c.get("name") in ["sessionid", "ds_user_id"] for c in cookies)

                # 조건 1: sessionid 또는 ds_user_id 인증 쿠키가 생성된 경우
                # 조건 2: URL이 login 페이지를 벗어나서 instagram.com 메인이나 다른 피드 페이지인 경우
                is_logged_in_url = ("accounts/login" not in current_url) and ("instagram.com" in current_url) and (current_url != "about:blank")

                if has_session_cookie or (is_logged_in_url and len(cookies) >= 5):
                    print("\n🎉 [성공] 인스타그램 로그인 세션이 성공적으로 감지되었습니다!")
                    print(f"- 현재 URL: {current_url}")
                    print(f"- 인증 쿠키 발견: {[c.get('name') for c in cookies if c.get('name') in ['sessionid', 'ds_user_id']]}")
                    
                    time.sleep(2)
                    # 정보 저장 / 알림 팝업 닫기 시도
                    for pop_txt in ["나중에 하기", "Not Now", "정보 저장", "Save Info"]:
                        try:
                            btn = page.locator(f"button:has-text('{pop_txt}')").first
                            if btn.is_visible():
                                btn.click()
                                time.sleep(0.5)
                        except Exception:
                            pass

                    # storage_state 영구 저장
                    context.storage_state(path=STORAGE_STATE_PATH)
                    print(f"💾 인증 상태(storage_state) 영구 저장 완료 -> {STORAGE_STATE_PATH}")
                    print("=" * 65)
                    print("✅ 이제 브라우저 창을 닫아도 세션이 영구적으로 유지됩니다.")
                    print("=" * 65)
                    saved = True
                    time.sleep(2)
                    break
            except Exception as loop_err:
                # 사용자가 브라우저 창을 닫았을 때
                if "Target page, context or browser has been closed" in str(loop_err):
                    print("\n⚠️ 사용자가 브라우저 창을 닫았습니다.")
                    break
                continue

        if not saved:
            try:
                cookies = context.cookies()
                if len(cookies) > 0:
                    context.storage_state(path=STORAGE_STATE_PATH)
                    print(f"💾 현재 쿠키({len(cookies)}개)로 storage_state 저장 완료 -> {STORAGE_STATE_PATH}")
            except Exception:
                pass

        try:
            browser.close()
        except Exception:
            pass

if __name__ == "__main__":
    run_interactive_instagram_login()
