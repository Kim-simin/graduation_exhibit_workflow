import sys
import os
import re
import json
import argparse
import time
import urllib.parse
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

# 시스템 메뉴 및 유틸리티 불용어 목록
SYSTEM_BLACKLIST_TEXT = {
    "본문 바로가기", "본문바로가기", "주메뉴 바로가기", "주메뉴바로가기", "로그인", "로그아웃", 
    "회원가입", "마이페이지", "사이트맵", "뉴스/공지", "공지사항", "대학공지", 
    "학사공지", "학과소개", "학과안내", "오시는길", "오시는 길", "none", "null", "undefined", 
    "home", "search", "개인정보처리방침", "이용약관", "이메일무단수집거부", "contact", "about", 
    "sitemap", "quick menu", "뉴스", "공지", "교수소개", "교수진", "학부소개", "전시소개",
    "전체메뉴", "주요서비스", "바로가기", "top", "back", "next", "prev", "list", "목록",
    "학생활동", "학사일정", "입학안내", "사이트 소개", "학과 앨범", "포토갤러리", "커뮤니티", "자료실"
}

def is_valid_card_text(title: str, univ: str = "", dept: str = "") -> bool:
    cleaned = title.strip().lower()
    if not cleaned or len(cleaned) <= 1:
        return False
    for bad in SYSTEM_BLACKLIST_TEXT:
        bad_l = bad.lower()
        if bad_l == cleaned or bad_l in cleaned:
            return False
    if univ:
        u_clean = univ.strip().lower()
        if cleaned == u_clean or cleaned.startswith(u_clean) or cleaned == u_clean.replace("대학교", "대"):
            return False
    if dept:
        d_clean = dept.replace("학과", "").replace("학부", "").replace("전공", "").strip().lower()
        if d_clean and (cleaned == d_clean or cleaned.replace(" ", "") == d_clean.replace(" ", "")):
            return False
    if cleaned.endswith("대학교") or cleaned.endswith("대학원"):
        return False
    return True

def is_inside_navigation(element) -> bool:
    try:
        return element.evaluate("""el => {
            return !!el.closest('header, nav, footer, aside, [class*="gnb"], [id*="gnb"], [class*="menu"], [id*="menu"], [class*="util"], [class*="top-"], [id*="header"], [id*="footer"], [class*="sidebar"], [class*="navigation"]');
        }""")
    except Exception:
        return False

def is_single_board_view(page, target_url: str) -> bool:
    u_lower = target_url.lower()
    url_view_hints = ["mode=view", "/view/", "view.do", "view.php", "view.jsp", "view.html", "view.asp", "article_id=", "articleno=", "b_id=", "board_id=", "nttid="]
    if any(h in u_lower for h in url_view_hints):
        return True
    try:
        has_view = page.evaluate("""() => {
            return !!document.querySelector('.b-title, div[class*="board_view"], div[class*="bbs_view"], div[id*="board_view"], div[class*="view_wrap"], div[class*="view-content"], div.sub-content-wrap');
        }""")
        return bool(has_view)
    except Exception:
        return False

def extract_single_board_view_images(page, target_url: str, card_id: str, out_base: str, univ: str = "", dept: str = ""):
    article_title = ""
    title_candidates = [
        '.b-title', 'th[class*="title"]', 'td[class*="title"]', 'div[class*="subject"]', 
        'div[class*="title"]', 'h2[class*="title"]', 'h3[class*="title"]', 
        '.board-view-title', '.view-title', 'div[class*="view"] h2', 'div[class*="view"] h3', 'h1', 'h2'
    ]
    for sel in title_candidates:
        try:
            el = page.query_selector(sel)
            if el and el.is_visible():
                txt = el.inner_text().strip().replace('\n', ' ')
                if txt and is_valid_card_text(txt, univ, dept) and len(txt) >= 2:
                    article_title = txt
                    break
        except Exception:
            continue
            
    if not article_title:
        article_title = page.title() or f"[{univ}] {card_id} 전시"

    body_selectors = [
        'div.sub-content-wrap', 'div[class*="view_content"]', 'div[class*="view-con"]',
        'div[class*="board-view"]', 'div[class*="board_view"]', 'div[class*="view_wrap"]',
        'div[class*="content"]', 'article', '#cms-content', 'main'
    ]
    body_el = None
    for b_sel in body_selectors:
        try:
            candidate = page.query_selector(b_sel)
            if candidate and candidate.is_visible():
                if len(candidate.query_selector_all('img')) > 0:
                    body_el = candidate
                    break
        except Exception:
            continue
            
    if not body_el:
        body_el = page
        
    all_imgs = body_el.query_selector_all('img')
    results = []
    
    for idx, img_el in enumerate(all_imgs):
        try:
            if not img_el.is_visible():
                continue
            if is_inside_navigation(img_el):
                continue
                
            box = img_el.bounding_box()
            if box and (box['width'] < 120 or box['height'] < 120):
                continue
                
            src = img_el.get_attribute("src") or img_el.get_attribute("data-src") or ""
            if not src or src.endswith(".svg") or any(ign in src.lower() for ign in ["icon", "btn", "logo", "banner"]):
                continue
                
            img_filename = f"work_{len(results) + 1}.png"
            img_save_path = os.path.join(out_base, img_filename)
            public_thumbnail_path = f"/captures/{card_id}/{img_filename}"
            
            captured = False
            try:
                img_el.screenshot(path=img_save_path, timeout=3000)
                if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 1000:
                    captured = True
            except Exception:
                pass
                
            if not captured and src:
                full_src = urljoin(page.url, src)
                try:
                    res = page.request.get(full_src, timeout=5000)
                    if res.status == 200:
                        with open(img_save_path, "wb") as f:
                            f.write(res.body())
                        if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 1000:
                            captured = True
                except Exception:
                    pass
                    
            if not captured:
                continue
                
            alt = (img_el.get_attribute("alt") or "").strip()
            work_title = alt if alt and is_valid_card_text(alt, univ, dept) and len(alt) >= 2 else f"{article_title} #{len(results) + 1}"
            
            results.append({
                "id": f"work-{len(results) + 1}",
                "title": work_title,
                "project_title": work_title,
                "author": f"{univ or '학생'} 작가",
                "caption": f"{work_title} | {univ}",
                "thumbnail": public_thumbnail_path,
                "screenshot_path": public_thumbnail_path,
                "image_url": public_thumbnail_path,
                "raw_text": f"{article_title} | {work_title}",
                "detail_url": target_url
            })
        except Exception:
            continue
            
    return results

def crawl_and_capture_exhibition(target_url: str, card_id: str, univ: str = "", dept: str = "", out_base: str = ""):
    if not out_base:
        out_base = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures", card_id))
    os.makedirs(out_base, exist_ok=True)

    poster_rel_path = f"/captures/{card_id}/main_poster.png"
    poster_abs_path = os.path.join(out_base, "main_poster.png")

    captured_items = []
    page_title = ""
    target_project_url = None

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent=DEFAULT_USER_AGENT,
            locale="ko-KR"
        )
        page = context.new_page()

        try:
            # 1. 메인 / 타겟 페이지 진입
            try:
                page.goto(target_url, wait_until="networkidle", timeout=15000)
            except Exception:
                page.goto(target_url, wait_until="domcontentloaded", timeout=12000)
            page.wait_for_timeout(1000)

            page_title = page.title() or f"[{univ}] {dept} 졸업전시회"

            # 메인 포스터 스크린샷 캡처
            try:
                page.screenshot(path=poster_abs_path, timeout=4000, animations="disabled")
            except Exception:
                try:
                    page.screenshot(path=poster_abs_path, timeout=3000)
                except Exception:
                    pass

            # 단일 게시글 뷰(Single Board View) 감지 시 본문 첨부 이미지 우선 수집
            if is_single_board_view(page, target_url):
                sys.stderr.write(f"[*] [Manual Capture] Single Board View 감지: {target_url}\n")
                captured_items = extract_single_board_view_images(page, target_url, card_id, out_base, univ, dept)
                if captured_items:
                    first_img = os.path.join(out_base, "work_1.png")
                    if os.path.exists(first_img):
                        import shutil
                        shutil.copyfile(first_img, poster_abs_path)
            else:
                target_url_lower = target_url.lower()
                is_already_works_page = any(w in target_url_lower for w in ["/works", "/work", "/project", "/projects", "/product"])

                if not is_already_works_page:
                    # 내부 핵심 네비게이션 탐색
                    found_url = page.evaluate('''() => {
                        const keywords = ['project', 'projects', 'works', 'work', 'designer', 'designers', 'student', 'students', '작가', '작품', '전시작품', 'exhibition', 'archive'];
                        const forbidden = ['about', 'intro', 'contact', 'history', 'notice', 'recruit', 'event', 'login'];
                        const links = Array.from(document.querySelectorAll('a[href]'));
                        for (const a of links) {
                            const href = a.getAttribute('href') || '';
                            const text = (a.innerText || '').toLowerCase();
                            const h = href.toLowerCase();
                            if (forbidden.some(f => h.includes(f) || text.includes(f))) continue;
                            if (keywords.some(k => text.includes(k) || h.includes(k))) {
                                return a.href;
                            }
                        }
                        return null;
                    }''')

                    if found_url and found_url != target_url:
                        target_project_url = found_url
                        try:
                            page.goto(target_project_url, wait_until="networkidle", timeout=12000)
                        except Exception:
                            page.goto(target_project_url, wait_until="domcontentloaded", timeout=8000)
                        page.wait_for_timeout(1000)
                else:
                    target_project_url = target_url

                # 2. CSR / Next.js 하이드레이션 및 지연 로딩(Lazy loading) 해제를 위한 스크롤 대기
                page.wait_for_timeout(2000)
                page.evaluate("""
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
                page.wait_for_timeout(1500)

                # 3. 동적 그리드 / 링크 기반 휴리스틱 탐지 (우선순위 1 -> 2 -> 3)
                card_elements = []

                # 전략 A: 동일 경로 내 상세 링크 패턴(/projects/, /project/, /works/)을 가진 <a> 태그 탐지
                link_candidates = page.query_selector_all('a[href*="/project"], a[href*="/work"], a[href*="/piece"], a[href*="/works/"]')
                valid_links = []
                for link in link_candidates:
                    if is_inside_navigation(link):
                        continue
                    box = link.bounding_box()
                    if box and box['width'] > 80 and box['height'] > 80:
                        valid_links.append(link)
                if len(valid_links) >= 3:
                    card_elements = valid_links
                    sys.stderr.write(f"[*] [Manual Capture - 전략 A] 상세 링크 패턴 기반으로 {len(card_elements)}개 프로젝트 카드 감지 성공\n")

                # 전략 B: 3개 이상 반복되는 그리드/플렉스 자식 컨테이너 분석 (Tailwind/CSS-in-JS 무관 작동)
                if not card_elements:
                    generic_candidates = page.query_selector_all('main div, section div, div[class*="grid"] > div, ul > li, div > div')
                    valid_boxes = []
                    for el in generic_candidates:
                        if is_inside_navigation(el):
                            continue
                        box = el.bounding_box()
                        if box and 120 < box['width'] < 800 and 120 < box['height'] < 800:
                            has_media = el.query_selector('img, [style*="background"]')
                            if has_media:
                                children_with_box = el.query_selector_all('div')
                                has_card_child = False
                                for child in children_with_box:
                                    c_box = child.bounding_box()
                                    if c_box and 120 < c_box['width'] < 800 and 120 < c_box['height'] < 800 and child.query_selector('img'):
                                        has_card_child = True
                                        break
                                if not has_card_child:
                                    valid_boxes.append(el)
                    if len(valid_boxes) >= 3:
                        card_elements = valid_boxes
                        sys.stderr.write(f"[*] [Manual Capture - 전략 B] 그리드 반복 구조 분석으로 {len(card_elements)}개 카드 감지 성공\n")

                # 전략 C: 기존 클래스 기반 폴백
                if not card_elements:
                    content_root = page.query_selector('main, article, #cms-content, div[id*="content"], div[class*="content"], div[class*="view"], div[id*="view"], div[class*="board"], div[id*="board"]')
                    root_element = content_root if content_root else page
                    card_elements = root_element.query_selector_all(
                        'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"], a[class*="work"], ul[class*="work"] > li, ul[class*="project"] > li, ul[class*="list"] > li, ul[class*="grid"] > li, div[class*="grid"] > div'
                    )

                seen_titles = set()
                import requests
                session = requests.Session()
                session.headers.update({"User-Agent": DEFAULT_USER_AGENT})

                for idx, card in enumerate(card_elements):
                    try:
                        if is_inside_navigation(card):
                            continue

                        raw_text = (card.inner_text() or "").strip()
                        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
                        title = lines[0] if lines else f"작품 #{len(captured_items) + 1}"

                        # 장문 인사말/안내문 및 불용어 필터링
                        if len(title) > 60 or title in seen_titles or not is_valid_card_text(title, univ, dept):
                            continue

                        # 유효 이미지 유무 검사
                        img_el = card.query_selector('img')
                        has_bg = False
                        if not img_el:
                            has_bg = card.evaluate("""el => {
                                const style = window.getComputedStyle(el);
                                return !!(style.backgroundImage && style.backgroundImage !== 'none');
                            }""")
                            if not has_bg:
                                continue

                        if img_el:
                            src_preview = (img_el.get_attribute("src") or "").lower()
                            if "data:image/svg" in src_preview or src_preview.endswith(".svg"):
                                continue

                        seen_titles.add(title)
                        author = lines[1] if len(lines) > 1 and len(lines[1]) <= 25 and is_valid_card_text(lines[1], univ, dept) else f"{univ or '출품'} 작가"

                        # 4. 카드 내부 이미지 엘리먼트 다운로드 또는 스크린샷
                        img_filename = f"work_{len(captured_items) + 1}.png"
                        img_save_path = os.path.join(out_base, img_filename)
                        public_thumbnail_path = f"/captures/{card_id}/{img_filename}"

                        captured = False

                        # Next.js 이미지 파싱 및 다운로드
                        if img_el:
                            img_src = img_el.get_attribute('src') or img_el.get_attribute('data-src') or ""
                            if '/_next/image' in img_src and 'url=' in img_src:
                                parsed_query = urllib.parse.parse_qs(urllib.parse.urlparse(img_src).query)
                                if 'url' in parsed_query:
                                    img_src = parsed_query['url'][0]

                            if img_src and not img_src.endswith('.svg') and not img_src.startswith('data:'):
                                full_src = urljoin(page.url, img_src)
                                try:
                                    res = session.get(full_src, timeout=8)
                                    if res.status_code == 200 and len(res.content) > 1024:
                                        with open(img_save_path, 'wb') as f:
                                            f.write(res.content)
                                        captured = True
                                except Exception:
                                    pass

                        # 이미지 다운로드 실패 시 단독 스크린샷 캡처 백업
                        if not captured:
                            try:
                                target_to_shoot = img_el if (img_el and img_el.is_visible()) else card
                                target_to_shoot.screenshot(path=img_save_path, timeout=3000)
                                if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 500:
                                    captured = True
                            except Exception as e:
                                sys.stderr.write(f"[WARN] 이미지 캡처 실패 ({title}): {e}\n")

                        # 5. 카드 상세 링크 URL 확보
                        href = card.get_attribute('href')
                        if not href:
                            link_tag = card.query_selector('a')
                            if link_tag:
                                href = link_tag.get_attribute('href')
                        detail_url = urljoin(page.url, href) if href else page.url

                        captured_items.append({
                            "id": f"work-{len(captured_items) + 1}",
                            "title": title,
                            "project_title": title,
                            "author": author,
                            "caption": f"{title} | {author}",
                            "thumbnail": public_thumbnail_path if captured else "",
                            "screenshot_path": public_thumbnail_path if captured else "",
                            "image_url": public_thumbnail_path if captured else "",
                            "raw_text": raw_text.replace('\n', ' | ')[:200],
                            "detail_url": detail_url
                        })
                    except Exception as card_err:
                        continue

            # 6. DOM 파싱 결과가 0건일 때 Vision 자동 크롭 에이전트 가동
            if len(captured_items) == 0 and os.path.exists(poster_abs_path):
                sys.stderr.write("[Manual Capture] DOM 파싱 결과 0건 -> Vision 자동 크롭 에이전트 가동\n")
                try:
                    from vision_extractor import extract_and_crop_works
                    vision_cards = extract_and_crop_works(poster_abs_path, card_id, os.path.abspath(os.path.join(out_base, "..")))
                    for vc in vision_cards:
                        captured_items.append({
                            "id": vc.get("id", f"work-{len(captured_items)+1}"),
                            "title": vc.get("project_title", vc.get("title", "출품작")),
                            "project_title": vc.get("project_title", vc.get("title", "출품작")),
                            "author": vc.get("author", f"{univ or '학생'} 작가"),
                            "caption": vc.get("caption", ""),
                            "raw_text": vc.get("raw_text", ""),
                            "thumbnail": vc.get("screenshot_path", vc.get("thumbnail", "")),
                            "screenshot_path": vc.get("screenshot_path", vc.get("thumbnail", "")),
                            "image_url": vc.get("screenshot_path", vc.get("thumbnail", "")),
                            "detail_url": page.url
                        })
                except Exception as ve:
                    sys.stderr.write(f"[Vision Fallback Exception]: {ve}\n")

        except Exception as e:
            sys.stderr.write(f"[Capture Exception]: {e}\n")
        finally:
            browser.close()

    result = {
        "status": "SUCCESS" if (os.path.exists(poster_abs_path) or len(captured_items) > 0) else "FAILED",
        "card_id": card_id,
        "university": univ,
        "department": dept,
        "page_title": page_title,
        "target_url": target_url,
        "project_url": target_project_url or target_url,
        "main_poster": poster_rel_path if os.path.exists(poster_abs_path) else None,
        "works": captured_items
    }

    print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--cardId", required=True)
    parser.add_argument("--univ", default="")
    parser.add_argument("--dept", default="")
    parser.add_argument("--outDir", default="")
    args = parser.parse_args()

    crawl_and_capture_exhibition(args.url, args.cardId, args.univ, args.dept, args.outDir)
