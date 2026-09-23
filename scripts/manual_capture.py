import sys
import os
import re
import json
import argparse
import asyncio
import base64
import time
import urllib.parse
from urllib.parse import urljoin
from playwright.async_api import async_playwright

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# scripts 디렉토리 모듈 임포트
sys.path.insert(0, os.path.dirname(__file__))
from category_mapper import get_standard_category
from run_queue_agent import (
    analyze_page_type_with_llama,
    crawl_list_detail_pattern,
    is_single_board_view,
    detect_captcha,
    DEFAULT_USER_AGENT,
    is_valid_card_text,
    is_inside_navigation,
    normalize_title,
    normalize_url,
    normalize_img_src,
    filter_top_level_card_elements
)

async def crawl_and_capture_exhibition_async(target_url: str, card_id: str, univ: str = "", dept: str = "", out_dir: str = ""):
    if not out_dir:
        out_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures", card_id))
    else:
        out_base = os.path.abspath(out_dir)
    os.makedirs(out_base, exist_ok=True)

    poster_filename = "main_poster.png"
    poster_abs_path = os.path.join(out_base, poster_filename)
    poster_rel_path = f"/captures/{card_id}/{poster_filename}"

    captured_items = []
    page_title = f"[{univ}] {dept} 졸업전시회"
    target_project_url = target_url

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 960},
            user_agent=DEFAULT_USER_AGENT,
            locale="ko-KR"
        )
        page = await context.new_page()

        try:
            try:
                await page.goto(target_url, wait_until="networkidle", timeout=15000)
            except Exception:
                await page.goto(target_url, wait_until="domcontentloaded", timeout=12000)
            await page.wait_for_timeout(1000)

            page_title = (await page.title()) or f"[{univ}] {dept} 졸업전시회"

            # 1. 첫 화면 캡처 및 로컬 VLM (llama-server) 라우터 실행
            landing_screenshot = await page.screenshot(full_page=False)
            b64_image = base64.b64encode(landing_screenshot).decode("utf-8")

            is_board = await is_single_board_view(page, target_url)
            page_type = await analyze_page_type_with_llama(
                b64_image,
                server_url="http://127.0.0.1:8080",
                fallback_hint_url=target_url,
                fallback_is_board=is_board
            )
            sys.stderr.write(f"[*] [Manual Capture VLM Router] 판정 결과: {page_type}\n")

            captures_root = os.path.abspath(os.path.join(out_base, ".."))

            # 2. 라우팅 분기: LIST_BOARD vs GRID_GALLERY
            if page_type == "LIST_BOARD":
                sys.stderr.write("[*] [Manual Capture] LIST_BOARD 감지 -> crawl_list_detail_pattern() 가동\n")
                captured_items = await crawl_list_detail_pattern(
                    page=page,
                    target_url=target_url,
                    card_id=card_id,
                    output_dir=captures_root,
                    univ=univ,
                    dept=dept
                )
            else:
                sys.stderr.write("[*] [Manual Capture] GRID_GALLERY 감지 -> 기본 갤러리 모드 가동\n")
                try:
                    await page.screenshot(path=poster_abs_path, timeout=4000)
                except Exception:
                    pass

                # 지연 로딩 스크롤
                await page.evaluate("""
                    async () => {
                        window.scrollTo(0, document.body.scrollHeight / 3);
                        await new Promise(r => setTimeout(r, 600));
                        window.scrollTo(0, (document.body.scrollHeight / 3) * 2);
                        await new Promise(r => setTimeout(r, 600));
                        window.scrollTo(0, document.body.scrollHeight);
                        await new Promise(r => setTimeout(r, 600));
                        window.scrollTo(0, 0);
                    }
                """)
                await page.wait_for_timeout(1000)

                # 1. 부모-자식 DOM 중첩 필터링 (Parent-Child DOM De-nesting)
                marked_count = await page.evaluate("""() => {
                    document.querySelectorAll('[data-gallery-card-target]').forEach(el => el.removeAttribute('data-gallery-card-target'));

                    const raw = Array.from(document.querySelectorAll(
                        'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"], ul[class*="work"] > li, div[class*="grid"] > div'
                    ));

                    const valid = raw.filter(el => {
                        if (el.closest('header, nav, footer, .paging, .pagination, #header, #footer')) return false;
                        const box = el.getBoundingClientRect();
                        if (box.width < 50 || box.height < 50) return false;
                        return true;
                    });

                    // De-nest: 다른 valid 후보 요소 내부에 포함된(자식/후손) 요소는 중첩 래퍼이므로 제외
                    const topLevel = valid.filter(el => !valid.some(other => other !== el && other.contains(el)));
                    topLevel.forEach((el, i) => {
                        el.setAttribute('data-gallery-card-target', String(i));
                    });
                    return topLevel.length;
                }""")

                if marked_count > 0:
                    card_elements = await page.query_selector_all('[data-gallery-card-target]')
                else:
                    card_elements = await page.query_selector_all(
                        'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"]'
                    )

                seen_titles = set()
                seen_images = set()
                seen_detail_urls = set()

                for idx, card in enumerate(card_elements):
                    try:
                        if await is_inside_navigation(card):
                            continue

                        # 1) 텍스트 추출 (호버 등 hidden 대응을 위해 textContent 폴백)
                        raw_text = ((await card.inner_text()) or "").strip()
                        if not raw_text:
                            raw_text = (await card.evaluate("el => (el.textContent || '').trim()") or "")

                        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
                        is_fallback_title = False
                        if lines:
                            title = lines[0]
                        else:
                            is_fallback_title = True
                            title = f"작품 #{len(captured_items) + 1}"

                        # 2) 이미지 식별자 추출
                        img_el = await card.query_selector('img')
                        img_src = ""
                        if img_el:
                            img_src = await img_el.get_attribute('src') or await img_el.get_attribute('data-src') or ""
                        else:
                            has_bg = await card.evaluate("""el => {
                                const style = window.getComputedStyle(el);
                                return !!(style.backgroundImage && style.backgroundImage !== 'none');
                            }""")
                            if not has_bg:
                                continue

                        clean_img_key = normalize_img_src(img_src, page.url) if img_src else ""

                        # 3) 상세 링크 추출
                        href = await card.get_attribute('href')
                        if not href:
                            inner_a = await card.query_selector('a')
                            if inner_a:
                                href = await inner_a.get_attribute('href')
                        full_detail_url = urljoin(page.url, href) if href else page.url
                        clean_url_key = normalize_url(full_detail_url) if (href and href != '#') else ""

                        # 4) 3중 중복 방지 (Multi-Key Deduplication)
                        norm_title = normalize_title(title)

                        # Key 1: 이미지 중복 체크 (이미지가 같으면 무조건 중복)
                        if clean_img_key and clean_img_key in seen_images:
                            continue

                        # Key 2: 상세 링크 중복 체크 (메인 목록 URL이 아닌 실제 상세 URL이 이미 수집된 경우)
                        if clean_url_key and clean_url_key in seen_detail_urls and clean_url_key != normalize_url(page.url):
                            continue

                        # Key 3: 제목 중복 체크
                        if not is_fallback_title:
                            if norm_title in seen_titles:
                                continue
                            if not is_valid_card_text(title, univ, dept) or len(title) > 60:
                                continue
                        else:
                            if not clean_img_key:
                                continue

                        # 키 등록
                        if not is_fallback_title and norm_title:
                            seen_titles.add(norm_title)
                        if clean_img_key:
                            seen_images.add(clean_img_key)
                        if clean_url_key and clean_url_key != normalize_url(page.url):
                            seen_detail_urls.add(clean_url_key)

                        author = lines[1] if len(lines) > 1 and len(lines[1]) <= 25 and is_valid_card_text(lines[1], univ, dept) else f"{univ or '출품'} 작가"
                        img_filename = f"work_{len(captured_items) + 1}.png"
                        img_save_path = os.path.join(out_base, img_filename)
                        public_thumbnail_path = f"/captures/{card_id}/{img_filename}"

                        if img_el:
                            await img_el.screenshot(path=img_save_path, timeout=3000)
                        else:
                            await card.screenshot(path=img_save_path, timeout=3000)

                        captured_items.append({
                            "id": f"work-{len(captured_items) + 1}",
                            "title": title,
                            "project_title": title,
                            "author": author,
                            "caption": f"{title} | {author}",
                            "thumbnail": public_thumbnail_path,
                            "screenshot_path": public_thumbnail_path,
                            "image_url": public_thumbnail_path,
                            "raw_text": raw_text.replace('\n', ' | ')[:200],
                            "detail_url": full_detail_url
                        })
                    except Exception:
                        continue

                await page.evaluate("() => document.querySelectorAll('[data-gallery-card-target]').forEach(el => el.removeAttribute('data-gallery-card-target'))")

                # 그리드 모드에서 카드가 0건 수집된 경우, 전략 C (게시판 순회)로 자동 폴백
                if not captured_items:
                    sys.stderr.write("[*] [Manual Capture] 그리드 카드 미발견 -> crawl_list_detail_pattern() 폴백 시도\n")
                    captured_items = await crawl_list_detail_pattern(
                        page=page,
                        target_url=target_url,
                        card_id=card_id,
                        output_dir=captures_root,
                        univ=univ,
                        dept=dept
                    )

            # 수집된 작품이 있는 경우, 첫 번째 작품의 깨끗한 포스터를 대표 포스터(main_poster.png)로 동기화
            if captured_items:
                first_img = os.path.join(out_base, "work_1.png")
                if os.path.exists(first_img):
                    import shutil
                    shutil.copyfile(first_img, poster_abs_path)
                    sys.stderr.write(f"[+] [Manual Capture] 대표 포스터 동기화 완료: {first_img} -> {poster_abs_path}\n")

        except Exception as e:
            sys.stderr.write(f"[Capture Exception]: {e}\n")
        finally:
            await browser.close()

    result = {
        "status": "SUCCESS" if (os.path.exists(poster_abs_path) or len(captured_items) > 0) else "FAILED",
        "card_id": card_id,
        "university": univ,
        "department": dept,
        "category": get_standard_category(dept),
        "page_title": page_title,
        "target_url": target_url,
        "project_url": target_project_url or target_url,
        "main_poster": poster_rel_path if os.path.exists(poster_abs_path) else None,
        "works": captured_items
    }

    print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
    return result

def crawl_and_capture_exhibition(target_url: str, card_id: str, univ: str = "", dept: str = "", out_dir: str = ""):
    return asyncio.run(crawl_and_capture_exhibition_async(target_url, card_id, univ, dept, out_dir))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--cardId", required=True)
    parser.add_argument("--univ", default="")
    parser.add_argument("--dept", default="")
    parser.add_argument("--outDir", default="")
    args = parser.parse_args()

    crawl_and_capture_exhibition(args.url, args.cardId, args.univ, args.dept, args.outDir)
