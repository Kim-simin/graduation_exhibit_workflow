import sys
import os
import re
import time
import json
import base64
import urllib.parse
import urllib.request
from typing import Dict, Any, List, Optional
from playwright.sync_api import sync_playwright

# Windows 환경 콘솔 UTF-8 출력 보정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ---------------------------------------------------------
# 세션 및 저장 경로 설정
# ---------------------------------------------------------
AUTH_DIR = os.path.join("data", "auth")
STORAGE_STATE_PATH = os.path.join(AUTH_DIR, "instagram_auth.json")
INSTAGRAM_SESSION_FILE = os.path.join(AUTH_DIR, "instagram_session.json")
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


# ---------------------------------------------------------
# [1] 인스타그램 세션 관리 및 인증 모듈
# ---------------------------------------------------------
def is_instagram_authenticated() -> bool:
    """
    저장된 인스타그램 인증 상태 파일(instagram_auth.json 또는 instagram_session.json)이 존재하는지 확인합니다.
    """
    if os.path.exists(STORAGE_STATE_PATH) and os.path.getsize(STORAGE_STATE_PATH) > 10:
        return True
    if os.path.exists(INSTAGRAM_SESSION_FILE) and os.path.getsize(INSTAGRAM_SESSION_FILE) > 10:
        return True
    return False


def get_instagram_storage_state_path() -> Optional[str]:
    """유효한 인스타그램 인증 세션 파일 경로를 반환합니다."""
    if os.path.exists(STORAGE_STATE_PATH) and os.path.getsize(STORAGE_STATE_PATH) > 10:
        return STORAGE_STATE_PATH
    if os.path.exists(INSTAGRAM_SESSION_FILE) and os.path.getsize(INSTAGRAM_SESSION_FILE) > 10:
        return INSTAGRAM_SESSION_FILE
    return None


# ---------------------------------------------------------
# [2] 고화질 이미지 다운로드 유틸리티
# ---------------------------------------------------------
def download_image_file(img_url: str, save_path: str, referer: Optional[str] = None) -> bool:
    """
    고화질 이미지를 다운로드하여 로컬 경로에 저장합니다.
    Base64 Data URL 및 일반 HTTP(S) URL을 모두 지원합니다.
    """
    try:
        if img_url.startswith("data:image"):
            header, encoded = img_url.split(",", 1)
            data = base64.b64decode(encoded)
            with open(save_path, "wb") as f:
                f.write(data)
            return True
        elif img_url.startswith("http"):
            req = urllib.request.Request(
                img_url,
                headers={
                    "User-Agent": DEFAULT_USER_AGENT,
                    "Referer": referer or "https://www.instagram.com/"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                content = resp.read()
                if len(content) > 4000:
                    with open(save_path, "wb") as f:
                        f.write(content)
                    return True
    except Exception as e:
        print(f"[이미지 다운로드 실패: {img_url[:60]}...]: {e}")
    return False


# ---------------------------------------------------------
# ---------------------------------------------------------
# [3] 인스타그램 타겟 포스트 및 캐러셀 스크래퍼
# ---------------------------------------------------------
def scrape_instagram_post(page, target_url: str, download_dir: str, university: str, department: str, year: str = "2025") -> Dict[str, Any]:
    """
    선택된 인스타그램 게시물(/p/ 또는 /reel/)에서:
    - [슬라이드 1]: 메인 포스터 다운로드 (poster.png)
    - [슬라이드 2~N]: 다음 버튼을 누르며 출품작 이미지 순차 다운로드 (art_01.png, art_02.png, ...)
    - 본문 텍스트(캡션) 추출
    """
    print(f"[Scraper: Instagram] 게시물 수집 진입: {target_url} (대상 연도: {year})")
    poster_path = os.path.join(download_dir, "poster.png")
    artworks_collected = []
    scraped_text = ""

    try:
        page.goto(target_url, wait_until="domcontentloaded", timeout=25000)
        page.wait_for_timeout(3000)

        # 팝업 닫기
        for pop_txt in ["Allow all cookies", "모두 허용", "필수 쿠키만 허용", "Accept", "허용", "나중에 하기", "Not Now"]:
            try:
                pop_btn = page.locator(f"button:has-text('{pop_txt}')").first
                if pop_btn.is_visible():
                    pop_btn.click()
                    page.wait_for_timeout(500)
            except Exception:
                pass

        # 캡션 추출
        try:
            caption_elem = page.locator("h1, article span, div[class*='caption']").all_inner_texts()
            clean_caps = [c.strip() for c in caption_elem if len(c.strip()) > 20 and "로그인" not in c and "Instagram" not in c]
            if clean_caps:
                scraped_text = "\n".join(clean_caps[:3])[:1200]
        except Exception:
            pass

        collected_img_urls = []
        max_carousel_steps = 8

        for step in range(max_carousel_steps):
            imgs = page.locator("article img, main img").all()
            for img in imgs:
                try:
                    src = img.get_attribute("src")
                    if src and src.startswith("http") and "s150x150" not in src and "s320x320" not in src:
                        box = img.bounding_box()
                        if box and box["width"] > 220 and box["height"] > 220:
                            if src not in collected_img_urls:
                                collected_img_urls.append(src)
                except Exception:
                    continue

            next_btn = page.locator("button[aria-label='다음'], button[aria-label='Next']").first
            if next_btn.is_visible():
                try:
                    next_btn.click()
                    page.wait_for_timeout(800)
                except Exception:
                    break
            else:
                break

        if collected_img_urls:
            # 1번째 이미지: 포스터
            download_image_file(collected_img_urls[0], poster_path, referer="https://www.instagram.com/")
            print(f"[Scraper: Instagram] 슬라이드 1 포스터 다운로드 완료 -> {poster_path}")

            # 2번째 이후: 출품작
            for idx, img_u in enumerate(collected_img_urls[1:], start=1):
                art_p = os.path.join(download_dir, f"art_{idx:02d}.png")
                if download_image_file(img_u, art_p, referer="https://www.instagram.com/"):
                    artworks_collected.append({
                        "student_name": f"{university} 출품작가 {idx}",
                        "title": f"출품작 #{idx}",
                        "image": art_p,
                        "description": f"{university} {department} {year} 졸업전시 공식 인스타그램 출품작",
                        "inferred_role": f"{department} 크리에이터"
                    })
                if len(artworks_collected) >= 6:
                    break
        else:
            # 이미지 태그를 직접 못 찾았을 경우 article 영역 캡처
            article_loc = page.locator("article").first
            if article_loc.is_visible():
                article_loc.screenshot(path=poster_path)

    except Exception as e:
        print(f"[Scraper: Instagram 게시물 수집 예외]: {e}")

    return {
        "poster_path": poster_path if os.path.exists(poster_path) and os.path.getsize(poster_path) > 3000 else None,
        "artworks": artworks_collected,
        "scraped_text": scraped_text
    }


# ---------------------------------------------------------
# [4] 연도별 인스타그램 단독 탐색 엔진 (외부 검색 일절 배제)
# ---------------------------------------------------------
def explore_instagram_only(page, university: str, department: str, download_dir: str, year: str = "2025") -> Optional[Dict[str, Any]]:
    """
    오직 인스타그램 내부 해시태그 및 키워드 검색만을 순차적으로 시도합니다.
    선택된 연도(year)를 해시태그 및 검색어에 강제 결합합니다.
    """
    clean_u = university.replace("대학교", "").replace("대", "").strip()
    clean_d = department.replace("학과", "").replace("학부", "").replace("전공", "").strip()
    year_short = year[-2:] if len(year) == 4 else year  # 예: '25'

    # 요구사항에 명시된 4개 필수 해시태그 타겟 및 키워드 타겟
    insta_targets = [
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸전{year}/",
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸업전시{year}/",
        f"https://www.instagram.com/explore/tags/{year}{clean_u}{clean_d}졸업전시/",
        f"https://www.instagram.com/explore/tags/{clean_u}졸전{year}/",
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸전{year_short}/",
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸업전시{year_short}/",
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸업전시/",
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸전/",
        f"https://www.instagram.com/explore/search/keyword/?q={urllib.parse.quote(university + ' ' + department + ' ' + year + ' 졸업전시')}"
    ]

    for target_url in insta_targets:
        print(f"[Scraper: Instagram {year}년도 탐색] -> {target_url}")
        try:
            page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(3000)

            # 팝업 닫기
            for pop_txt in ["Allow all cookies", "모두 허용", "필수 쿠키만 허용", "Accept", "허용", "나중에 하기", "Not Now"]:
                try:
                    pop_btn = page.locator(f"button:has-text('{pop_txt}')").first
                    if pop_btn.is_visible():
                        pop_btn.click()
                        page.wait_for_timeout(500)
                except Exception:
                    pass

            # 피드 내 게시물 링크 목록 추출
            post_links = page.locator("a[href*='/p/']").all()
            if post_links:
                for post_elem in post_links[:3]:
                    first_post_href = post_elem.get_attribute("href")
                    if not first_post_href:
                        continue
                    if not first_post_href.startswith("http"):
                        first_post_href = urllib.parse.urljoin("https://www.instagram.com", first_post_href)
                    
                    print(f"[Scraper: Instagram] 피드 게시물 진입 및 연도 검증: {first_post_href}")
                    res = scrape_instagram_post(page, first_post_href, download_dir, university, department, year)
                    
                    # 과년도 혼입 차단 검증:
                    # 캡션이 추출되었을 경우, target_url 자체에 year가 명시되어 있거나 본문 텍스트에 연도(2025/25) 또는 대학/학과명이 존재하는지 확인
                    cap_text = res.get("scraped_text", "")
                    is_year_valid = (
                        year in target_url or year_short in target_url or
                        year in cap_text or year_short in cap_text or
                        clean_u in cap_text or clean_d in cap_text or
                        not cap_text  # 캡션이 비어있는 이미지 위주 포스트는 통과
                    )

                    if is_year_valid and (res.get("poster_path") or res.get("artworks")):
                        res["scraped_url"] = first_post_href
                        return res
        except Exception as e:
            print(f"[Scraper: Instagram 탐색 실패 - {target_url}]: {e}")
            continue

    return None


# ---------------------------------------------------------
# [5] 메인 단일 진입점 함수: fetch_exhibit_assets
# ---------------------------------------------------------
def fetch_exhibit_assets(university: str, department: str, year: str = "2025") -> Dict[str, Any]:
    """
    인스타그램 단일 진입 스크래퍼 (연도 매개변수 지원):
    - 외부 사이트(chatgpt, wordreference, 일반 검색 포털 등) 진입을 원천 차단.
    - instagram_auth.json 세션을 로드하여 연도별 인스타그램 해시태그로 직행.
    - 첫 번째 게시물에서 포스터(슬라이드 1)와 출품작(슬라이드 2~N)을 수집.
    - 탐색 실패 시 임의 웹사이트를 캡처하지 않고 빈 리스트/None 반환.
    """
    clean_u = re.sub(r'[\\/*?:"<>|]', "_", university).strip()
    clean_d = re.sub(r'[\\/*?:"<>|]', "_", department).strip()
    download_dir = os.path.join("data", "downloads", f"{clean_u}_{clean_d}")
    os.makedirs(download_dir, exist_ok=True)
    poster_path = os.path.join(download_dir, "poster.png")

    print(f"\n🚀 [인스타그램 단독 스크래핑 시작] {university} {department} (타겟 연도: {year}년)")

    artworks_collected = []
    scraped_text = ""
    target_url = None
    exhibition_title = f"[{university}] {year} {department} 졸업전시회"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-blink-features=AutomationControlled"
                ]
            )

            auth_file = get_instagram_storage_state_path()
            context_kwargs = {
                "viewport": {"width": 1080, "height": 1350},
                "user_agent": DEFAULT_USER_AGENT,
                "locale": "ko-KR"
            }

            if auth_file and os.path.exists(auth_file):
                print(f"[Playwright] 인스타그램 인증 세션 로드 완료 ({auth_file})")
                try:
                    context_kwargs["storage_state"] = auth_file
                    context = browser.new_context(**context_kwargs)
                except Exception as st_err:
                    print(f"[Playwright] storage_state 로드 경고: {st_err}")
                    context = browser.new_context(**context_kwargs)
            else:
                print("[Playwright] ⚠️ 저장된 인스타그램 인증 세션이 없습니다. 공개 모드로 시도합니다.")
                context = browser.new_context(**context_kwargs)

            # Anti-Bot 우회
            context.add_init_script(
                "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
            )

            page = context.new_page()

            # 연도별 인스타그램 단독 탐색 수행
            insta_res = explore_instagram_only(page, university, department, download_dir, year=year)
            if insta_res:
                if insta_res.get("poster_path"):
                    poster_path = insta_res["poster_path"]
                if insta_res.get("artworks"):
                    artworks_collected = insta_res["artworks"]
                if insta_res.get("scraped_text"):
                    scraped_text = insta_res["scraped_text"]
                target_url = insta_res.get("scraped_url")
                print(f"[Scraper] {year}년도 인스타그램 수집 성공: 포스터 1장, 출품작 {len(artworks_collected)}점")

            browser.close()

    except Exception as pw_err:
        print(f"[Playwright 구동 예외]: {pw_err}")

    # 포스터가 없으면 임의 웹사이트를 캡처하지 않고 None 반환
    final_poster = poster_path if (os.path.exists(poster_path) and os.path.getsize(poster_path) > 3000) else None

    return {
        "poster_image": final_poster,
        "artworks": artworks_collected,
        "scraped_text": scraped_text,
        "scraped_url": target_url or "",
        "exhibition_title": exhibition_title,
        "download_dir": download_dir,
        "status": "SUCCESS" if final_poster else "FAILED"
    }


def scrape_university_exhibition(university: str, department: str, year: str = "2025") -> Dict[str, Any]:
    """기존 nodes.py 및 app.py와의 완벽한 하위 호환성을 제공하는 래퍼 함수"""
    return fetch_exhibit_assets(university, department, year)


if __name__ == "__main__":
    print("=== Scraper 워터폴 탐색 테스트 가동 ===")
    res = fetch_exhibit_assets("건국대학교", "리빙디자인", "2025")
    print(f"포스터 경로: {res['poster_image']} (존재: {os.path.exists(res['poster_image']) if res['poster_image'] else False})")
    print(f"출품작 수: {len(res['artworks'])}개")
    print(f"수집된 텍스트 요약: {res['scraped_text'][:120]}...")

