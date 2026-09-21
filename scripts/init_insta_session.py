import os
import sys
import asyncio
from playwright.async_api import async_playwright

# Windows 환경 콘솔 UTF-8 출력 보정
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

async def main():
    print("=" * 65)
    print("🔑 [*] 인스타그램 최초 로그인 세션 생성기를 실행합니다...")
    print(f"- 프로필 디렉터리: {PROFILE_DIR}")
    print("=" * 65)

    clean_profile_locks(PROFILE_DIR)
    os.makedirs(AUTH_DIR, exist_ok=True)

    async with async_playwright() as p:
        context = await p.chromium.launch_persistent_context(
            user_data_dir=PROFILE_DIR,
            headless=False,
            viewport={"width": 1280, "height": 850},
            user_agent=DEFAULT_USER_AGENT,
            locale="ko-KR",
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
        )

        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        page = context.pages[0] if context.pages else await context.new_page()

        print("\n🌐 인스타그램 메인 페이지로 이동 중...")
        try:
            await page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=45000)
        except Exception as e:
            print(f"페이지 이동 경고: {e}")

        print("\n" + "=" * 60)
        print("1. 새로 열린 브라우저 창에서 인스타그램 로그인을 진행하세요.")
        print("2. 2단계 인증 및 '로그인 정보 저장'을 완료하고 메인 피드가 뜨면,")
        print("3. 이 터미널로 돌아와 [Enter] 키를 누르세요.")
        print("=" * 60 + "\n")

        # 비동기 인풋 대기 (또는 백그라운드 세션 자동 감지)
        loop = asyncio.get_event_loop()
        
        async def wait_for_enter():
            await loop.run_in_executor(None, input, ">> 로그인을 완료했으면 엔터(Enter)를 누르세요: ")

        async def auto_detect_login():
            """피드 진입 또는 세션 쿠키 발급 시 자동 감지 안내"""
            while True:
                await asyncio.sleep(2)
                try:
                    cookies = await context.cookies()
                    has_session = any(c.get("name") in ["sessionid", "ds_user_id"] for c in cookies)
                    curr_url = page.url
                    if has_session and ("accounts/login" not in curr_url) and ("instagram.com" in curr_url):
                        print("\n🎉 [감지됨] 인스타그램 로그인 인증 세션이 성공적으로 감지되었습니다!")
                        print("👉 터미널에서 [Enter] 키를 누르면 저장이 완료됩니다.")
                        break
                except Exception:
                    break

        detect_task = asyncio.create_task(auto_detect_login())
        enter_task = asyncio.create_task(wait_for_enter())

        await enter_task
        detect_task.cancel()

        # storage_state 영구 백업 저장
        try:
            await context.storage_state(path=STORAGE_STATE_PATH)
            print(f"💾 storage_state 백업 파일 저장 완료 -> {STORAGE_STATE_PATH}")
        except Exception as se:
            print(f"storage_state 저장 경고: {se}")

        # 세션 정상 플러시 및 닫기
        await context.close()
        print(f"\n[SUCCESS] 🎉 인스타그램 로그인 세션이 '{PROFILE_DIR}'에 안전하게 영구 저장되었습니다!")
        print("=" * 65)

if __name__ == "__main__":
    asyncio.run(main())
