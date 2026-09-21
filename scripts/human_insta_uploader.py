import asyncio
import os
import sys
import json
import time
import random
import argparse
import base64
import io
import requests
from datetime import datetime
from PIL import Image
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
QUEUE_FILE = os.path.join(ROOT_DIR, "data", "university_queue.json")
COOLDOWN_FILE = os.path.join(ROOT_DIR, "temp", "insta_cooldown.json")

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

def format_date_hashtag(date_str, year="2025"):
    """날짜 문자열을 공백 없는 해시태그 포맷으로 변환"""
    if not date_str or "일정 공지 대기" in date_str or "미정" in date_str:
        clean_y = "".join(c for c in str(year) if c.isdigit()) or "2025"
        return f"#{clean_y}년졸업전시"
    nums = "".join(c for c in date_str if c.isdigit())
    if len(nums) == 12:
        return f"#{nums[:8]}_{nums[8:]}"
    if len(nums) == 16:
        return f"#{nums[:8]}_{nums[12:]}"
    if len(nums) >= 8:
        return f"#{nums[:12]}"
    clean_d = "".join(c for c in date_str if c.isalnum() or c == "_")
    return f"#{clean_d}" if clean_d else f"#{year}년졸업전시"

def generate_instagram_caption_py(item):
    """리서치 단계 수집 정보 100% 반영 인스타그램 캡션 생성기"""
    univ = (item.get("university") or "대학교").strip()
    dept = (item.get("department") or "디자인학과").strip()
    title = (item.get("exhibition_title") or item.get("exhibit_title") or f"[{univ}] {dept} 졸업전시회").strip()
    slogan = (item.get("slogan") or item.get("exhibit_slogan") or item.get("card_news", {}).get("card_headline") or "").strip()
    schedule = (item.get("exhibition_period") or "").strip()
    venue = (item.get("exhibition_venue") or "").strip()
    target_url = (item.get("target_url") or item.get("scraped_url") or item.get("official_url") or item.get("website") or "").strip()
    desc = (item.get("raw_description") or item.get("curation_summary", {}).get("curation_intro") or item.get("card_news", {}).get("card_intro") or "").strip()

    subtitle_str = f"\n✨ 전시 슬로건: {slogan}" if slogan else ""
    sched_str = f"\n📅 전시 기간: {schedule}" if schedule else ""
    venue_str = f"\n🏛️ 전시 장소: {venue}" if venue else ""
    url_str = f"\n🔗 공식 아카이브 웹사이트:\n{target_url}" if target_url else ""

    # 출품 작가 전원 리스트업 (- 작가명: 작품명)
    artworks = item.get("artworks", [])
    if artworks:
        work_lines = []
        for w in artworks:
            author = (w.get("student_name") or w.get("author") or f"{univ} 작가").strip().strip("-: ")
            work_title = (w.get("title") or "출품작").strip().strip("-: ")
            work_lines.append(f"- {author}: {work_title}")
        works_list = "\n".join(work_lines)
    else:
        works_list = "- 전공 출품작 전원 수록"

    # 엄격한 4개 해시태그
    date_tag = format_date_hashtag(schedule, item.get("year", "2025"))
    univ_tag = f"#{univ.replace(' ', '')}"
    dept_tag = f"#{dept.replace(' ', '')}"
    default_tag = "#졸업전시"
    hashtags = f"{date_tag} {univ_tag} {dept_tag} {default_tag}"

    url_header = f"🔗 공식 아카이브 웹사이트:\n{target_url}\n\n" if target_url else ""

    return f"""{url_header}{univ} {dept}
'{title}'{subtitle_str}{sched_str}{venue_str}

{desc + chr(10) if desc else ''}━━━━━━━━━━━━━━━━━━━━
📌 출품작 및 작가 명단 (전원):
{works_list}
━━━━━━━━━━━━━━━━━━━━

{hashtags}""".strip()

def clean_profile_locks(profile_dir):
    """프로필 점유 충돌 방지: SingletonLock, SingletonCookie, SingletonSocket 제거"""
    if not os.path.exists(profile_dir):
        os.makedirs(profile_dir, exist_ok=True)
        return
    
    lock_files = ["SingletonLock", "SingletonCookie", "SingletonSocket"]
    for lf in lock_files:
        p = os.path.join(profile_dir, lf)
        if os.path.exists(p):
            try:
                os.remove(p)
                print(f"🧹 고아 잠금 파일 제거 완료: {lf}")
            except Exception as e:
                print(f"⚠️ 잠금 파일 제거 실패 ({lf}): {e}")

def update_status(status_file, job_id, status, step, total_steps, progress, message, extra=None):
    """비동기 상태 파일 갱신"""
    os.makedirs(os.path.dirname(status_file), exist_ok=True)
    payload = {
        "jobId": job_id,
        "status": status,
        "step": step,
        "totalSteps": total_steps,
        "progress": progress,
        "message": message,
        "updatedAt": datetime.now().isoformat()
    }
    if extra:
        payload.update(extra)
    try:
        with open(status_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"상태 파일 저장 실패: {e}")

def update_progress(job_id: str, progress: int, message: str, status: str = "processing"):
    """진행률 상태 단축 업데이트"""
    status_file = os.path.join(ROOT_DIR, "temp", "insta_tasks", f"{job_id}_status.json")
    step = 4 if progress >= 70 else (3 if progress >= 50 else (2 if progress >= 20 else 1))
    if status == "completed":
        step = 5
    elif status == "error":
        step = 0
    update_status(status_file, job_id, status, step, 5, progress, message)

def resolve_image_path(raw_path):
    """상대/절대 경로 이미지를 실제 파일시스템 경로로 해석"""
    if not raw_path:
        return None
    
    clean_p = raw_path.replace("\\", "/").lstrip("/")
    candidates = [
        os.path.join(ROOT_DIR, "data", "downloads", clean_p),
        os.path.join(ROOT_DIR, "my-exhibit-platform", "public", clean_p),
        os.path.join(ROOT_DIR, "data", clean_p),
        os.path.join(ROOT_DIR, clean_p),
        raw_path
    ]

    for c in candidates:
        if os.path.exists(c) and os.path.isfile(c):
            return os.path.abspath(c)
    
    return None

def prepare_1080x1080_canvas(input_path, output_path):
    """
    1080x1080 정사각형 규격 캔버스 리사이즈 및 패딩
    - 비율 유지 축소 (LANCZOS)
    - 밝은 그레이(#FAFAFA) 배경 캔버스 중앙 배치
    """
    with Image.open(input_path) as img:
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        w, h = img.size
        ratio = min(1080.0 / w, 1080.0 / h)
        new_w = max(1, int(round(w * ratio)))
        new_h = max(1, int(round(h * ratio)))

        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (1080, 1080), (250, 250, 250))
        paste_x = (1080 - new_w) // 2
        paste_y = (1080 - new_h) // 2
        canvas.paste(resized, (paste_x, paste_y))

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        canvas.save(output_path, "JPEG", quality=95, optimize=True)
        return output_path

async def dismiss_popups(page):
    """피드 및 로그인 후 표시되는 모든 방해 팝업 및 프로필 선택 화면을 순차적으로 안전하게 닫음"""
    # 0. 프로필 원클릭 로그인(Continue/계속하기) 화면 감지 시 즉시 클릭
    continue_selectors = [
        'button:has-text("Continue")',
        'button:has-text("계속")',
        'button:has-text("계속하기")',
        'div[role="button"]:has-text("Continue")',
        'div[role="button"]:has-text("계속")'
    ]
    for c_sel in continue_selectors:
        try:
            c_btn = page.locator(c_sel).first
            if await c_btn.is_visible(timeout=1000):
                print(f"  🔑 프로필 원클릭 로그인 감지: [{c_sel}] 클릭하여 피드로 진입합니다...")
                await c_btn.click(force=True)
                await page.wait_for_timeout(3000)
                break
        except Exception:
            pass

    dismiss_buttons = [
        'button:has-text("나중에 하기")',
        'button:has-text("Not Now")',
        'button:has-text("정보 저장")',
        'button:has-text("Save Info")',
        'button:has-text("취소")',
        'button:has-text("Cancel")',
        'button:has-text("닫기")',
        'button:has-text("Close")',
        'button:has-text("Allow all cookies")',
        'button:has-text("모두 허용")',
        'button:has-text("필수 쿠키만 허용")',
        'button:has-text("Accept")',
        'button:has-text("허용")'
    ]
    for _ in range(2):
        for sel in dismiss_buttons:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=1000):
                    await btn.click()
                    await page.wait_for_timeout(800)
            except Exception:
                pass

async def ask_qwen_vl_locate_button(page, target_description: str, server_url: str = "http://127.0.0.1:8080"):
    """
    Qwen2.5-VL Vision-Language 모델에게 현재 브라우저 스크린샷을 전송하여,
    클릭해야 할 버튼/아이콘의 시각적 위치(X, Y 좌표)를 추출받는 자율 Vision Agent 함수
    """
    try:
        # 1. 현재 브라우저 뷰포트 캡처
        png_bytes = await page.screenshot()
        b64_img = base64.b64encode(png_bytes).decode("utf-8")
        viewport = page.viewport_size or {"width": 1440, "height": 900}
        vw, vh = viewport["width"], viewport["height"]

        # 2. Qwen2.5-VL Vision 프롬프트
        prompt = (
            f"You are a GUI Vision Navigation Agent. The screen resolution is {vw}x{vh}.\n"
            f"Locate the exact UI element: '{target_description}' on this Instagram screen.\n"
            f"Respond with the bounding box in format: {{\"point\": [y, x]}} or {{\"box_2d\": [ymin, xmin, ymax, xmax]}}.\n"
            f"Coordinates should be either absolute pixel values or normalized to 0~1000.\n"
            f"Output STRICT JSON only."
        )

        payload = {
            "model": "qwen2.5-vl",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_img}"}}
                    ]
                }
            ],
            "temperature": 0.05,
            "max_tokens": 512
        }

        endpoint = f"{server_url.rstrip('/')}/v1/chat/completions"
        res = requests.post(endpoint, json=payload, timeout=12)
        if res.status_code != 200:
            return None

        content = res.json()["choices"][0]["message"]["content"]
        # JSON 블록 및 좌표 추출
        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL)
        m = re.search(r"(\{[\s\S]*\})", content)
        if not m:
            return None

        data = json.loads(m.group(1))
        
        # 1) Point [y, x] 형식
        if "point" in data and len(data["point"]) == 2:
            py, px = data["point"]
            if px <= 1000 and py <= 1000:
                px = int(px * vw / 1000)
                py = int(py * vh / 1000)
            return (px, py)

        # 2) Bounding Box [ymin, xmin, ymax, xmax] 형식
        box = data.get("box_2d") or data.get("bbox") or data.get("bbox_2d")
        if box and len(box) == 4:
            ymin, xmin, ymax, xmax = box
            if xmax <= 1000 and ymax <= 1000:
                xmin = int(xmin * vw / 1000)
                xmax = int(xmax * vw / 1000)
                ymin = int(ymin * vh / 1000)
                ymax = int(ymax * vh / 1000)
            cx = (xmin + xmax) // 2
            cy = (ymin + ymax) // 2
            return (cx, cy)

    except Exception as e:
        print(f"  [Qwen2.5-VL Vision Agent 패스: {e}]")
    return None

async def vision_find_and_click(page, target_description: str) -> bool:
    """Qwen2.5-VL에게 스크린샷을 보여주고 마우스로 시각적 좌표를 직접 클릭"""
    coords = await ask_qwen_vl_locate_button(page, target_description)
    if coords:
        x, y = coords
        print(f"  👁️ [Qwen2.5-VL Vision Agent] '{target_description}' 시각 발견! 좌표: (X={x}, Y={y}) 클릭...")
        await page.mouse.click(x, y)
        await page.wait_for_timeout(1500)
        return True
    return False

async def click_next_button(page):
    """다이얼로그 우측 상단 [다음 / Next] 버튼 클릭"""
    next_selectors = [
        'div[role="dialog"] div[role="button"]:has-text("다음")',
        'div[role="dialog"] button:has-text("다음")',
        'div[role="dialog"] div[role="button"]:has-text("Next")',
        'div[role="dialog"] button:has-text("Next")',
        'div[role="dialog"] header div:last-child div[role="button"]',
        'div[role="dialog"] header div:last-child button',
        'div[role="dialog"] header div[role="button"]:last-child'
    ]
    for sel in next_selectors:
        try:
            el = page.locator(sel).first
            if await el.is_visible(timeout=2000):
                await el.click(force=True)
                print(f"  ✓ [다음/Next] 버튼 클릭 성공: {sel}")
                await page.wait_for_timeout(2500)
                return True
        except Exception:
            continue
    
    # fallback: dialog 내 button 중 '다음' 텍스트 포함 시도
    try:
        fallback_btn = page.locator('div[role="dialog"] button, div[role="dialog"] div[role="button"]').filter(has_text="다음").first
        if await fallback_btn.is_visible(timeout=2000):
            await fallback_btn.click(force=True)
            print("  ✓ [다음] fallback 버튼 클릭 성공")
            await page.wait_for_timeout(2500)
            return True
    except Exception:
        pass

    # 2. Qwen2.5-VL Vision Agent 시각적 위치 탐색 및 클릭 폴백
    if await vision_find_and_click(page, "Next button or 다음 button located at the top right of the modal dialog"):
        await page.wait_for_timeout(2500)
        return True

    return False

async def open_create_dialog(page):
    """모달(div[role='dialog'])이 화면에 생성될 때까지 3단계 방식으로 강제 트리거 + Qwen2.5-VL Vision Agent"""
    dialog = page.locator('div[role="dialog"]').first

    # 1차 시도: 사이드바 만들기 아이콘 및 텍스트 강제 클릭 (좌표 기반 마우스 클릭 병행)
    triggers = [
        'svg[aria-label="새로운 게시물"]',
        'svg[aria-label="New post"]',
        'svg[aria-label="만들기"]',
        'svg[aria-label="Create"]',
        'a[role="link"]:has-text("만들기")',
        'div[role="button"]:has-text("만들기")',
        'span:has-text("만들기")',
        'a[href="#"]:has(svg)'
    ]

    for sel in triggers:
        try:
            target = page.locator(sel).first
            if await target.is_visible(timeout=1500):
                box = await target.bounding_box()
                if box:
                    # 마우스 커서를 물리적으로 요소 중앙으로 이동 후 클릭
                    await page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
                    print(f"  ✓ [만들기] 좌표 기반 마우스 클릭 성공: {sel}")
                else:
                    await target.click(force=True)
                    print(f"  ✓ [만들기] force=True 클릭 성공: {sel}")

                await page.wait_for_timeout(1500)

                # 서브메뉴(게시물 / Post)가 열린 경우 클릭
                try:
                    post_menu = page.locator(
                        "div[role='menu'] span:has-text('게시물'), "
                        "div[role='menu'] span:has-text('Post'), "
                        "span:text-is('게시물'), "
                        "span:text-is('Post'), "
                        "a[role='menuitem']:has-text('게시물')"
                    ).first
                    if await post_menu.is_visible(timeout=2000):
                        print("  ✓ [만들기] 서브메뉴 '게시물(Post)' 클릭...")
                        await post_menu.click(force=True)
                        await page.wait_for_timeout(1000)
                except Exception:
                    pass

                if await dialog.is_visible(timeout=2500):
                    print("  🎉 만들기 모달(div[role='dialog']) 오픈 감지 성공!")
                    return True
        except Exception:
            continue

    # 2차 시도: 좌측 네비게이션 a 태그 목록에서 순차 매칭
    try:
        nav_elements = page.locator('nav a, div[role="navigation"] a, div[role="navigation"] div[role="button"]')
        count = await nav_elements.count()
        for i in range(count):
            item = nav_elements.nth(i)
            text = await item.inner_text()
            if any(k in text for k in ["만들기", "Create", "새로운", "Post"]):
                await item.click(force=True)
                print(f"  ✓ [만들기] 네비게이션 매칭 클릭 성공: {text}")
                await page.wait_for_timeout(1500)
                try:
                    post_menu = page.locator("div[role='menu'] span:has-text('게시물'), span:text-is('게시물'), span:text-is('Post')").first
                    if await post_menu.is_visible(timeout=2000):
                        await post_menu.click(force=True)
                        await page.wait_for_timeout(1000)
                except Exception:
                    pass
                if await dialog.is_visible(timeout=2500):
                    print("  🎉 만들기 모달(div[role='dialog']) 오픈 감지 성공!")
                    return True
    except Exception:
        pass

    # 3차 시도: Qwen2.5-VL Vision Agent 시각적 위치 추론 클릭
    print("  👉 [만들기] Qwen2.5-VL Vision Agent 시각 탐색 시도...")
    if await vision_find_and_click(page, "Instagram Create or New Post plus icon on the left sidebar navigation"):
        await page.wait_for_timeout(1500)
        try:
            post_menu = page.locator("div[role='menu'] span:has-text('게시물'), span:text-is('게시물'), span:text-is('Post')").first
            if await post_menu.is_visible(timeout=2000):
                await post_menu.click(force=True)
                await page.wait_for_timeout(1000)
        except Exception:
            pass
        if await dialog.is_visible(timeout=2500):
            print("  🎉 Qwen2.5-VL Vision Agent로 만들기 모달 오픈 성공!")
            return True

    # 4차 시도: 단축키 및 DOM 이벤트 트리거
    print("  👉 [만들기] 단축키 및 DOM 이벤트 트리거 시도...")
    await page.keyboard.press("Escape")
    await page.wait_for_timeout(500)
    await page.keyboard.press("c")
    await page.wait_for_timeout(1500)
    try:
        post_menu = page.locator("div[role='menu'] span:has-text('게시물'), span:text-is('게시물'), span:text-is('Post')").first
        if await post_menu.is_visible(timeout=2000):
            await post_menu.click(force=True)
            await page.wait_for_timeout(1000)
    except Exception:
        pass
    
    return await dialog.is_visible(timeout=3000)

def update_queue_published(card_id, university, department):
    """발행 완료 후 data/university_queue.json 갱신"""
    if not os.path.exists(QUEUE_FILE):
        return
    try:
        with open(QUEUE_FILE, "r", encoding="utf-8") as f:
            queue_data = json.load(f)

        now_iso = datetime.now().isoformat()
        updated = False
        for item in queue_data:
            match = False
            if card_id and item.get("id") == card_id:
                match = True
            elif university and department and item.get("university") == university and item.get("department") == department:
                match = True
            
            if match:
                item["instagramPublished"] = True
                item["publishedAt"] = now_iso
                updated = True
                break

        if updated:
            with open(QUEUE_FILE, "w", encoding="utf-8") as f:
                json.dump(queue_data, f, ensure_ascii=False, indent=2)
            print(f"✅ university_queue.json 갱신 완료 (instagramPublished: true, publishedAt: {now_iso})")
    except Exception as e:
        print(f"⚠️ university_queue.json 갱신 실패: {e}")

def set_cooldown(seconds=180):
    """3분 연속 발행 쿨다운 타이머 파일 저장"""
    os.makedirs(os.path.dirname(COOLDOWN_FILE), exist_ok=True)
    now = time.time()
    expires_at = now + seconds
    data = {
        "lastPublishedAt": datetime.now().isoformat(),
        "expiresAtTimestamp": expires_at,
        "expiresAt": datetime.fromtimestamp(expires_at).isoformat(),
        "remainingSeconds": seconds
    }
    with open(COOLDOWN_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"⏳ 쿨다운 설정 완료: {seconds}초 대기")

async def upload_carousel_to_instagram(
    job_id: str,
    prepared_images: list,
    caption_text: str,
    card_id: str = None,
    university: str = None,
    department: str = None
):
    profile_path = os.path.abspath(PROFILE_DIR)
    clean_profile_locks(profile_path)

    update_progress(job_id, 15, "백그라운드 엔진 구동 중...", status="browser_launch")

    async with async_playwright() as p:
        context = None
        page = None
        try:
            # 화면 표시 없이 완전 백그라운드(headless=True) 실행
            context = await p.chromium.launch_persistent_context(
                user_data_dir=profile_path,
                channel="chrome",
                headless=True,
                viewport={"width": 1440, "height": 900},
                user_agent=DEFAULT_USER_AGENT,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage"
                ]
            )
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            # 기존 auth.json 세션 쿠키 병합 로드
            if os.path.exists(STORAGE_STATE_PATH):
                try:
                    with open(STORAGE_STATE_PATH, "r", encoding="utf-8") as af:
                        auth_state = json.load(af)
                        cookies = auth_state.get("cookies", [])
                        if cookies:
                            await context.add_cookies(cookies)
                            print(f"🔑 기존 instagram_auth.json 에서 쿠키 {len(cookies)}개 주입 완료")
                except Exception as ce:
                    print(f"쿠키 주입 경고: {ce}")

            page = context.pages[0] if context.pages else await context.new_page()

            # 1. 인스타그램 접속 및 세션 확인
            print("🌐 [백그라운드] 인스타그램 접속 중...")
            update_progress(job_id, 30, "인스타그램 세션 확인 중...", status="connecting")
            try:
                await page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=45000)
            except Exception:
                pass

            # 1. 팝업 제거 및 홈 피드 안정화
            await dismiss_popups(page)
            for _ in range(3):
                await page.keyboard.press("Escape")
                await page.wait_for_timeout(500)

            if "accounts/login" in page.url:
                raise RuntimeError("인스타그램 로그인이 풀려 있습니다. 터미널에서 scripts/setup_insta_login.py를 1회 실행하여 로그인하십시오.")

            update_progress(job_id, 45, "만들기 모달 호출 및 이미지 첨부 중...", status="uploading")

            # 만들기 다이얼로그 오픈 검증
            opened = await open_create_dialog(page)
            if not opened:
                # 최후 시도: 좌측 네비게이션 바의 6번째 아이콘 위치 직접 클릭
                try:
                    sidebar_btn = page.locator('nav a, div[role="navigation"] a, nav div[role="button"]').nth(5)
                    await sidebar_btn.click(force=True)
                    print("  ✓ [만들기] 6번째 사이드바 아이콘 폴백 클릭")
                    await page.wait_for_timeout(2000)
                except Exception:
                    pass

            # 파일 인풋 직접 타깃팅 (모달 오픈 여부와 무관하게 DOM 전체의 input[type=file] 대기)
            file_input = page.locator('input[type="file"]').first
            await file_input.wait_for(state="attached", timeout=25000)
            await file_input.set_input_files(prepared_images)
            print(f"📁 파일 인풋에 {len(prepared_images)}개 슬라이드 직접 주입 성공")
            await page.wait_for_timeout(3500)
            update_progress(job_id, 70, "캐러셀 슬라이드 정렬 및 필터 통과 중...", status="cropping")

            # 3. [다음] 버튼 1차 (자르기/필터 화면 통과)
            print("  👉 [다음] 1차 클릭 시도...")
            await click_next_button(page)

            # 4. [다음] 버튼 2차 (캡션 입력창 이동)
            print("  👉 [다음] 2차 클릭 시도...")
            await click_next_button(page)

            # 6. 캡션 입력 (지터 타이핑)
            update_progress(job_id, 85, "피드 본문 및 캡션 작성 중...", status="captioning")
            caption_box = page.locator('div[aria-label*="문구 입력"], div[aria-label*="Write a caption"], div[role="textbox"]').first
            await caption_box.wait_for(state="visible", timeout=15000)
            await caption_box.click()

            print(f"✍️ 캡션 입력 시작 ({len(caption_text)}자)...")
            for char in caption_text:
                await page.keyboard.insert_text(char)
                await asyncio.sleep(random.uniform(0.010, 0.035))

            await page.wait_for_timeout(2000)

            # 5. 공유하기 클릭 (다중 셀렉터 및 강제 클릭)
            update_progress(job_id, 95, "피드 최종 공유 처리 중...", status="uploading")
            share_selectors = [
                'div[role="dialog"] div[role="button"]:has-text("공유하기")',
                'div[role="dialog"] button:has-text("공유하기")',
                'div[role="dialog"] div[role="button"]:has-text("Share")',
                'div[role="dialog"] button:has-text("Share")',
                'div[role="dialog"] header div:last-child div[role="button"]:has-text("공유")',
                'div[role="dialog"] header div:last-child button:has-text("공유")',
                'div[role="dialog"] header div:last-child button',
                'div[role="dialog"] header div:last-child div[role="button"]'
            ]
            shared = False
            for s_sel in share_selectors:
                try:
                    s_btn = page.locator(s_sel).first
                    if await s_btn.is_visible(timeout=2000):
                        await s_btn.click(force=True)
                        print(f"🚀 [공유하기] 버튼 클릭 완료: {s_sel}")
                        shared = True
                        break
                except Exception:
                    continue

            if not shared:
                print("  👉 [공유하기] Qwen2.5-VL Vision Agent 시각 탐색 시도...")
                if await vision_find_and_click(page, "Share button or 공유하기 button at the top right of the modal"):
                    shared = True

            # 8. 피드 공유 완료 대기
            update_progress(job_id, 98, "게시물 발행 확인 및 마무리 처리 중...", status="finalizing")
            success_locator = page.locator('text="게시물이 공유되었습니다", text="Your post has been shared.", text="공유됨"')
            try:
                await success_locator.wait_for(state="visible", timeout=60000)
                print("🎉 [성공] 인스타그램 피드 공유 완료 메시지 감지!")
            except Exception:
                print("⚠️ 완료 메시지 타임아웃, 추가 3초 대기 후 마무리...")
                await page.wait_for_timeout(3000)

            # 최신 세션 쿠키 저장
            try:
                await context.storage_state(path=STORAGE_STATE_PATH)
            except Exception:
                pass

            update_progress(job_id, 100, "인스타그램 피드 발행 완료!", status="completed")
            await page.wait_for_timeout(3000)
            await context.close()

            # DB & Cooldown 갱신
            update_queue_published(card_id, university, department)
            set_cooldown(seconds=180)
            print(f"✨ [완료] {university} {department} 인스타그램 캐러셀 피드({len(prepared_images)}장) 발행 완료!")

        except Exception as err:
            err_msg = str(err)
            print(f"[Upload Error]: {err_msg}")
            try:
                os.makedirs(os.path.join(ROOT_DIR, "temp", "insta_tasks"), exist_ok=True)
                snap_path = os.path.join(ROOT_DIR, "temp", "insta_tasks", "error_snapshot.png")
                if 'page' in locals() and page:
                    await page.screenshot(path=snap_path)
                    print(f"📸 디버그 스크린샷 저장: {snap_path}")
            except Exception:
                pass
            update_progress(job_id, 0, f"업로드 실패: {err_msg[:250]}", status="error")
            if 'context' in locals() and context:
                await context.close()
            sys.exit(1)

async def async_run_pipeline(task_file):
    if not os.path.exists(task_file):
        print(f"❌ 작업 파일을 찾을 수 없습니다: {task_file}")
        sys.exit(1)

    with open(task_file, "r", encoding="utf-8") as f:
        task = json.load(f)

    job_id = task.get("jobId", "insta_job_" + str(int(time.time())))
    card_id = task.get("cardId")
    university = task.get("university", "")
    department = task.get("department", "")
    year = task.get("year", "2025")
    raw_slides = task.get("slides", [])
    caption = task.get("caption", "").strip()

    if not caption and os.path.exists(QUEUE_FILE):
        try:
            with open(QUEUE_FILE, "r", encoding="utf-8") as qf:
                qdata = json.load(qf)
            for it in qdata:
                if (card_id and it.get("id") == card_id) or (university and department and it.get("university") == university and it.get("department") == department):
                    caption = generate_instagram_caption_py(it)
                    print("📝 큐 데이터 기반 인스타그램 정밀 캡션 자동 생성 완료")
                    break
        except Exception as qe:
            print(f"캡션 자동 생성 경고: {qe}")

    prep_dir = os.path.join(ROOT_DIR, "temp", "insta_prepared", job_id)

    print("=" * 65)
    print(f"🚀 [인간 모사 인스타그램 캐러셀 업로더 시작 (Headless)] Job ID: {job_id}")
    print(f"- 대상: {university} {department} ({year})")
    print(f"- 입력 슬라이드 수: {len(raw_slides)}개")
    print("=" * 65)

    # 1단계: Pillow 1080x1080 캔버스 여백 보정 (15%)
    update_progress(job_id, 15, "1080x1080 여백 보정 (Pillow) 진행 중...", status="preparing")
    prepared_paths = []

    target_slides = raw_slides[:10]
    for idx, slide_path in enumerate(target_slides, start=1):
        real_path = resolve_image_path(slide_path)
        if not real_path:
            print(f"⚠️ 이미지 파일을 찾을 수 없어 건너뜁니다: {slide_path}")
            continue

        out_name = f"slide_{idx:02d}.jpg"
        out_path = os.path.join(prep_dir, out_name)
        try:
            res_p = prepare_1080x1080_canvas(real_path, out_path)
            prepared_paths.append(res_p)
            print(f"  [슬라이드 {idx}/{len(target_slides)}] 1080x1080 정규화 완료: {out_name}")
        except Exception as pe:
            print(f"  ❌ 슬라이드 변환 실패 ({slide_path}): {pe}")

    if not prepared_paths:
        err_msg = "업로드 가능한 유효한 이미지가 없습니다."
        update_progress(job_id, 0, err_msg, status="error")
        print(f"❌ {err_msg}")
        sys.exit(1)

    print(f"✅ 총 {len(prepared_paths)}개 슬라이드 1080x1080 캔버스 준비 완료")

    await upload_carousel_to_instagram(
        job_id=job_id,
        prepared_images=prepared_paths,
        caption_text=caption,
        card_id=card_id,
        university=university,
        department=department
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Human-like Instagram Carousel Publisher")
    parser.add_argument("--task-file", required=True, help="Path to the JSON task specification")
    args = parser.parse_args()

    try:
        asyncio.run(async_run_pipeline(args.task_file))
    except Exception as e:
        import traceback
        traceback.print_exc()
        try:
            with open(args.task_file, "r", encoding="utf-8") as f:
                task = json.load(f)
            job_id = task.get("jobId", "unknown")
            update_progress(job_id, 0, f"파이썬 실행 예외: {str(e)}", status="error")
        except Exception:
            pass
        sys.exit(1)
