import os
import sys
import asyncio
from playwright.async_api import async_playwright

# Windows 콘솔 UTF-8 출력 보정
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

async def verify():
    profile_path = os.path.abspath("data/chrome_insta_profile")
    for lf in ["SingletonLock", "SingletonCookie", "SingletonSocket"]:
        lock_file = os.path.join(profile_path, lf)
        if os.path.exists(lock_file):
            try:
                os.remove(lock_file)
            except Exception:
                pass

    print("[*] 인스타그램 로그인 세션 유효성 검사 시작...")
    print(f"- 프로필 경로: {profile_path}")

    async with async_playwright() as p:
        try:
            context = await p.chromium.launch_persistent_context(
                user_data_dir=profile_path,
                channel="chrome",
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled"
                ]
            )
            page = context.pages[0] if context.pages else await context.new_page()
            await page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(3000)

            current_url = page.url
            cookies = await context.cookies()
            has_session_cookie = any(c.get("name") in ["sessionid", "ds_user_id"] for c in cookies)
            has_login_form = await page.locator("input[name='username'], input[name='password']").count() > 0

            # 피드 및 내비게이션 요소 탐색
            feed_elements_count = await page.locator(
                'svg[aria-label="만들기"], svg[aria-label="새로운 게시물"], svg[aria-label="New post"], svg[aria-label="Create"], svg[aria-label="홈"], svg[aria-label="Home"], svg[aria-label="직접 메시지"], a[href="/direct/inbox/"]'
            ).count()

            print(f"- 접속 URL: {current_url}")
            print(f"- 세션 쿠키(sessionid/ds_user_id) 보유 여부: {'YES' if has_session_cookie else 'NO'}")
            print(f"- 피드/네비게이션 요소 감지: {feed_elements_count}개")

            if "accounts/login" in current_url or has_login_form or not has_session_cookie:
                print("\n[RESULT: FAIL] 인스타그램 세션이 저장되지 않았거나 만료되었습니다. 로그인이 필요합니다.")
            elif feed_elements_count > 0 or ("instagram.com" in current_url and not has_login_form):
                print("\n[RESULT: SUCCESS] 인스타그램 로그인 세션이 정상 유지되고 있습니다! 피드 자동 발행이 가능합니다. ✅")
            else:
                print(f"\n[RESULT: UNCERTAIN] 현재 URL: {current_url} (피드 요소를 찾지 못함)")

            await context.close()
        except Exception as e:
            print(f"\n[RESULT: ERROR] 브라우저 구동 중 에러 발생: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
