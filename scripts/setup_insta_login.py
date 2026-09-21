import os
import sys
import time
from playwright.sync_api import sync_playwright

# Windows 콘솔 UTF-8 출력 보정
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PROFILE_DIR = os.path.join(ROOT_DIR, "data", "chrome_insta_profile")
AUTH_DIR = os.path.join(ROOT_DIR, "data", "auth")
STORAGE_STATE_PATH = os.path.join(AUTH_DIR, "instagram_auth.json")

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

def clean_profile_locks(profile_dir):
    """프로필 점유 충돌 방지: SingletonLock 제거"""
    if not os.path.exists(profile_dir):
        os.makedirs(profile_dir, exist_ok=True)
        return
    for lf in ["SingletonLock", "SingletonCookie", "SingletonSocket"]:
        p = os.path.join(profile_dir, lf)
        if os.path.exists(p):
            try:
                os.remove(p)
                print(f"🧹 고아 잠금 파일 제거 완료: {lf}")
            except Exception:
                pass

def main():
    print("=" * 65)
    print("🚀 [인스타그램 로그인 설정 브라우저 구동기]")
    print(f"- 프로필 디렉터리: {PROFILE_DIR}")
    print("=" * 65)

    clean_profile_locks(PROFILE_DIR)
    os.makedirs(AUTH_DIR, exist_ok=True)

    with sync_playwright() as p:
        print("\n🌐 실제 정식 Google Chrome 브라우저를 화면에 띄웁니다...")
        sys.stdout.flush()
        context = p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            channel="chrome",  # 정식 구글 크롬 실행
            headless=False,
            viewport={"width": 1280, "height": 850},
            user_agent=DEFAULT_USER_AGENT,
            locale="ko-KR",
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--start-maximized"
            ]
        )

        context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        page = context.pages[0] if context.pages else context.new_page()

        print("👉 인스타그램(https://www.instagram.com/)으로 이동합니다.")
        try:
            page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print(f"페이지 이동 경고: {e}")

        # 쿠키 동의 팝업 자동 닫기 시도
        for btn_txt in ["Allow all cookies", "모두 허용", "필수 쿠키만 허용", "Accept", "허용"]:
            try:
                btn = page.locator(f"button:has-text('{btn_txt}')").first
                if btn.is_visible(timeout=1000):
                    btn.click()
                    time.sleep(0.5)
            except Exception:
                pass

        print("\n" + "=" * 65)
        print("📌 [안내] 열린 브라우저 창에서 직접 로그인을 진행해주세요!")
        print("1. 아이디/비밀번호 및 2단계 인증을 완료하세요.")
        print("2. '로그인 정보 저장' 팝업에서 [정보 저장] 또는 [나중에 하기]를 선택하세요.")
        print("3. 메인 피드가 뜨면 세션이 자동으로 감지되어 안전하게 영구 저장됩니다.")
        print("   (최대 5분 동안 로그인을 자동 대기합니다)")
        print("=" * 65 + "\n")

        saved = False
        start_time = time.time()
        timeout_seconds = 300  # 5분 대기

        while time.time() - start_time < timeout_seconds:
            time.sleep(2)
            try:
                current_url = page.url
                cookies = context.cookies()
                has_session_cookie = any(c.get("name") in ["sessionid", "ds_user_id"] for c in cookies)

                # 엄격한 로그인 감지: 실제 인증 세션 쿠키(sessionid 또는 ds_user_id) 필수
                if has_session_cookie:
                    print("\n🎉 [성공] 인스타그램 로그인 세션이 성공적으로 감지되었습니다!")
                    print(f"- 현재 URL: {current_url}")
                    
                    time.sleep(2)
                    # 정보 저장 및 알림 팝업 닫기 시도
                    for pop_txt in ["나중에 하기", "Not Now", "정보 저장", "Save Info"]:
                        try:
                            pop_btn = page.locator(f"button:has-text('{pop_txt}')").first
                            if pop_btn.is_visible(timeout=1000):
                                pop_btn.click()
                                time.sleep(0.5)
                        except Exception:
                            pass

                    # storage_state 영구 백업
                    context.storage_state(path=STORAGE_STATE_PATH)
                    print(f"💾 storage_state 저장 완료 -> {STORAGE_STATE_PATH}")
                    print(f"💾 Chrome 영구 프로필 저장 완료 -> {PROFILE_DIR}")
                    print("\n" + "=" * 65)
                    print("✅ 로그인이 완료되었습니다! 3초 후 브라우저 창을 정상 종료합니다.")
                    print("=" * 65)
                    saved = True
                    time.sleep(3)
                    break
            except Exception as loop_err:
                if "Target page, context or browser has been closed" in str(loop_err):
                    print("\n⚠️ 사용자가 브라우저 창을 닫았습니다.")
                    break
                continue

        if not saved:
            try:
                cookies = context.cookies()
                if len(cookies) > 0:
                    context.storage_state(path=STORAGE_STATE_PATH)
                    print(f"💾 현재 쿠키({len(cookies)}개)로 storage_state 저장 완료")
            except Exception:
                pass

        try:
            context.close()
        except Exception:
            pass

        print("🏁 브라우저가 안전하게 종료되었습니다.")

if __name__ == "__main__":
    main()
