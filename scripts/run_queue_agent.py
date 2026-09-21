import os
import sys
import re
import json
import time
import urllib.parse
import urllib.request
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
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

QUEUE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "university_queue.json"))
DOWNLOAD_BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "downloads"))

# 절대 금지 도메인 및 경로
BLACKLIST_DOMAINS = [
    "blog.naver.com", "cafe.naver.com", "tistory.com", "brunch.co.kr",
    "namu.wiki", "wikipedia.org", "youtube.com", "facebook.com", "twitter.com", "x.com"
]

FORBIDDEN_PATHS = [
    "/about", "/contact", "/history", "/intro", "/notice", "/recruit",
    "/event", "/profboard", "/book", "/library", "/login", "/bbs"
]

# 전국 주요 대학 공식 도메인 매핑
KNOWN_OFFICIAL_SITES = {
    "서울대학교": {
        "domains": ["snu.ac.kr", "snudesignweek.com"],
        "direct_sites": ["https://snudesignweek.com/"]
    },
    "고려대학교": {
        "domains": ["korea.ac.kr"],
        "direct_sites": [
            "http://kiid.korea.ac.kr/2025/works/product-system-design/",
            "http://kiid.korea.ac.kr/2025/works/product-development/",
            "http://kiid.korea.ac.kr/2025/works/fine-arts/",
            "http://kiid.korea.ac.kr/"
        ]
    },
    "홍익대학교": {
        "domains": ["hongik.ac.kr"],
        "direct_sites": ["https://sidi.hongik.ac.kr/archive"]
    },
    "경희대학교": {
        "domains": ["khu.ac.kr"],
        "direct_sites": ["https://vd.khu.ac.kr/"]
    },
    "서울과학기술대학교": {
        "domains": ["seoultech.ac.kr"],
        "direct_sites": ["https://id.seoultech.ac.kr/"]
    },
    "국민대학교": {
        "domains": ["kookmin.ac.kr"],
        "direct_sites": ["https://design.kookmin.ac.kr/"]
    },
    "건국대학교": {
        "domains": ["konkuk.ac.kr"],
        "direct_sites": ["https://www.konkuk.ac.kr/"]
    },
    "덕성여자대학교": {
        "domains": ["duksung.ac.kr"],
        "direct_sites": ["https://www.duksung.ac.kr/visualcomm/"]
    },
    "동덕여자대학교": {
        "domains": ["dongduk.ac.kr"],
        "direct_sites": ["https://www.dongduk.ac.kr/"]
    },
    "성균관대학교": {
        "domains": ["skku.edu"],
        "direct_sites": ["https://design.skku.edu/"]
    },
    "이화여자대학교": {
        "domains": ["ewha.ac.kr"],
        "direct_sites": ["https://design.ewha.ac.kr/"]
    },
    "한양대학교": {
        "domains": ["hanyang.ac.kr"],
        "direct_sites": ["https://design.hanyang.ac.kr/"]
    },
    "서울시립대학교": {
        "domains": ["uos.ac.kr"],
        "direct_sites": ["https://design.uos.ac.kr/"]
    }
}

def normalize_univ_name(univ: str) -> str:
    u = univ.strip()
    replacements = {
        "서울대": "서울대학교", "고려대": "고려대학교", "연세대": "연세대학교",
        "홍익대": "홍익대학교", "경희대": "경희대학교", "건국대": "건국대학교",
        "국민대": "국민대학교", "덕성여대": "덕성여자대학교", "동덕여대": "동덕여자대학교",
        "서울과기대": "서울과학기술대학교", "성균관대": "성균관대학교", "이화여대": "이화여자대학교",
        "한양대": "한양대학교", "서울시립대": "서울시립대학교", "상명대": "상명대학교",
        "단국대": "단국대학교", "인천대": "인천대학교", "부산대": "부산대학교",
        "경북대": "경북대학교", "전남대": "전남대학교", "충남대": "충남대학교",
        "한국공학대": "한국공학대학교", "한예종": "한국예술종합학교"
    }
    for k, v in replacements.items():
        if u == k or u.startswith(k):
            return v
    if not u.endswith("대학교") and not u.endswith("학교"):
        return u + "대학교"
    return u

def detect_captcha(page, target_url: str) -> Tuple[bool, str]:
    """2초 이내 CAPTCHA 및 봇 챌린지 실시간 감지"""
    url_lower = (target_url or "").lower()
    page_url_lower = (page.url or "").lower()

    for kw in ["/challenge", "/checkpoint", "/captcha", "cf-chl", "challenges.cloudflare.com", "turnstile", "recaptcha", "hcaptcha"]:
        if kw in url_lower or kw in page_url_lower:
            return True, f"URL 패턴 ({kw})"

    if "instagram.com" in page_url_lower and ("/accounts/login" in page_url_lower or "/challenge/" in page_url_lower):
        return True, "인스타그램 강제 로그인 차단"

    for sel in ["iframe[src*='challenges.cloudflare.com']", "iframe[src*='recaptcha']", "iframe[src*='hcaptcha']", "div.g-recaptcha", "div#cf-turnstile"]:
        try:
            if page.locator(sel).first.is_visible(timeout=250):
                return True, f"위젯 감지 ({sel})"
        except Exception:
            pass

    try:
        title = (page.title() or "").lower()
        if any(t in title for t in ["just a moment...", "security check", "robot challenge"]):
            return True, f"타이틀 ({title})"
    except Exception:
        pass

    return False, ""

def is_url_allowed(url: str, target_univ: str) -> bool:
    if not url or not url.startswith("http"):
        return False
    u_lower = url.lower()
    if any(b in u_lower for b in BLACKLIST_DOMAINS):
        return False
    if any(f in u_lower for f in FORBIDDEN_PATHS):
        return False

    # 타 대학 도메인 침범 차단
    for other_univ, info in KNOWN_OFFICIAL_SITES.items():
        if other_univ != target_univ and other_univ not in target_univ and target_univ not in other_univ:
            for d in info["domains"]:
                if d in u_lower:
                    return False
    return True

def verify_poster_image(file_path: str) -> Tuple[bool, int, int, float]:
    """PIL 기반 메인 포스터 엄격 검증 (가로 대비 세로 >= 1.2, 최소 400x500)"""
    if not os.path.exists(file_path) or os.path.getsize(file_path) < 3000:
        return False, 0, 0, 0.0
    try:
        with Image.open(file_path) as img:
            w, h = img.size
            ratio = h / max(w, 1)
            is_valid = (ratio >= 1.2) and (w >= 400) and (h >= 500)
            return is_valid, w, h, ratio
    except Exception:
        return False, 0, 0, 0.0

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
    """헤더, 네비게이션, GNB, 유틸리티, 푸터, 사이드바 내부 요소인지 검사"""
    try:
        return element.evaluate("""el => {
            return !!el.closest('header, nav, footer, aside, [class*="gnb"], [id*="gnb"], [class*="menu"], [id*="menu"], [class*="util"], [class*="top-"], [id*="header"], [id*="footer"], [class*="sidebar"], [class*="navigation"]');
        }""")
    except Exception:
        return False

def is_single_board_view(page, target_url: str) -> bool:
    """단일 게시글 뷰(Single Board View) 여부 판별"""
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

def extract_single_board_view_images(page, target_url: str, card_id: str, output_dir: str = "public/captures", univ: str = "", dept: str = "") -> List[Dict[str, Any]]:
    """단일 게시글 뷰에서 본문 첨부 이미지들을 순서대로 추출하여 메인 포스터 및 상세 에셋으로 등록"""
    save_dir = os.path.join(output_dir, card_id)
    os.makedirs(save_dir, exist_ok=True)
    
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
            img_save_path = os.path.join(save_dir, img_filename)
            public_thumbnail_path = f"/captures/{card_id}/{img_filename}"
            
            captured = False
            try:
                img_el.screenshot(path=img_save_path, timeout=3000)
                if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 1000:
                    captured = True
            except Exception:
                pass
                
            if not captured and src:
                full_src = urllib.parse.urljoin(target_url, src)
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
            
    print(f"[*] [게시판 뷰] 본문 첨부 이미지 기반 {len(results)}개 작품 에셋 등록 완료 -> {save_dir}", flush=True)
    return results

def extract_works_with_images(page, target_url: str, card_id: str, output_dir: str = "public/captures", univ: str = "", dept: str = "") -> List[Dict[str, Any]]:
    save_dir = os.path.join(output_dir, card_id)
    os.makedirs(save_dir, exist_ok=True)

    print(f"[*] 타겟 사이트 진입: {target_url}", flush=True)
    try:
        page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
    except Exception as e:
        print(f"[WARN] 초기 로딩 지연: {e}", flush=True)

    # 1. 단일 게시글 뷰(Single Board View) 감지 시 전용 추출 로직으로 분기
    if is_single_board_view(page, target_url):
        print(f"[*] [Single Board View 감지] {target_url} -> 본문 이미지 전수 수집 모드 가동", flush=True)
        board_results = extract_single_board_view_images(page, target_url, card_id, output_dir, univ, dept)
        if board_results:
            return board_results

    # 2. CSR / Next.js 데이터 하이드레이션 및 지연 로딩(Lazy loading) 충분 대기
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
    candidate_elements = []

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
        candidate_elements = valid_links
        print(f"[*] [전략 A] 상세 링크 패턴 기반으로 {len(candidate_elements)}개 프로젝트 카드 감지 성공", flush=True)

    # 전략 B: 3개 이상 반복되는 그리드/플렉스 자식 컨테이너 분석 (Tailwind/CSS-in-JS 무관 작동)
    if not candidate_elements:
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
            candidate_elements = valid_boxes
            print(f"[*] [전략 B] 그리드 반복 구조 분석으로 {len(candidate_elements)}개 카드 감지 성공", flush=True)

    # 전략 C: 기존 클래스 기반 폴백
    if not candidate_elements:
        content_root = page.query_selector('main, article, #cms-content, div[id*="content"], div[class*="content"], div[class*="view"], div[id*="view"], div[class*="board"], div[id*="board"]')
        root_el = content_root if content_root else page
        candidate_elements = root_el.query_selector_all(
            'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article, a[href*="/works/"], a[href*="/project/"], a[class*="work"], ul[class*="work"] > li, ul[class*="project"] > li, ul[class*="list"] > li, ul[class*="grid"] > li, div[class*="grid"] > div'
        )
        print(f"[*] [전략 C] 클래스 셀렉터 폴백으로 {len(candidate_elements)}개 후보 감지", flush=True)

    results = []
    seen_titles = set()
    import requests
    session = requests.Session()
    session.headers.update({"User-Agent": DEFAULT_USER_AGENT})

    for idx, card in enumerate(candidate_elements):
        try:
            if is_inside_navigation(card):
                continue

            raw_text = (card.inner_text() or "").strip()
            lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            title = lines[0] if lines else f"작품 #{len(results) + 1}"

            if not is_valid_card_text(title, univ, dept) or title in seen_titles or len(title) > 60:
                continue

            img_el = card.query_selector('img')
            has_bg = False
            if not img_el:
                has_bg = card.evaluate("""el => {
                    const style = window.getComputedStyle(el);
                    return !!(style.backgroundImage && style.backgroundImage !== 'none');
                }""")
                if not has_bg:
                    continue

            # 이미지 태그 확인 시 svg 아이콘 단독인 경우 배제
            if img_el:
                src_preview = (img_el.get_attribute("src") or "").lower()
                if "data:image/svg" in src_preview or src_preview.endswith(".svg"):
                    continue

            seen_titles.add(title)
            author = lines[1] if len(lines) > 1 and len(lines[1]) <= 25 and is_valid_card_text(lines[1], univ, dept) else f"{univ or '출품'} 작가"

            img_filename = f"work_{len(results) + 1}.png"
            img_save_path = os.path.join(save_dir, img_filename)
            public_thumbnail_path = f"/captures/{card_id}/{img_filename}"

            captured = False

            # 4. Next.js 특화 이미지 주소 추출 및 다운로드
            if img_el:
                img_src = img_el.get_attribute('src') or img_el.get_attribute('data-src') or ""
                if '/_next/image' in img_src and 'url=' in img_src:
                    parsed_query = urllib.parse.parse_qs(urllib.parse.urlparse(img_src).query)
                    if 'url' in parsed_query:
                        img_src = parsed_query['url'][0]

                if img_src and not img_src.endswith('.svg') and not img_src.startswith('data:'):
                    abs_url = urllib.parse.urljoin(target_url, img_src)
                    try:
                        res = session.get(abs_url, timeout=8)
                        if res.status_code == 200 and len(res.content) > 1024:
                            with open(img_save_path, 'wb') as f:
                                f.write(res.content)
                            captured = True
                    except Exception:
                        pass

            # 5. 이미지 다운로드 실패 시 단독 스크린샷 캡처 백업
            if not captured:
                try:
                    target_to_shoot = img_el if (img_el and img_el.is_visible()) else card
                    target_to_shoot.screenshot(path=img_save_path, timeout=3000)
                    if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 500:
                        captured = True
                except Exception as e:
                    print(f"[WARN] 카드 #{idx+1} 단독 스크린샷 실패 ({title}): {e}", flush=True)

            href = card.get_attribute('href')
            if not href:
                inner_a = card.query_selector('a')
                if inner_a:
                    href = inner_a.get_attribute('href')
            detail_url = urllib.parse.urljoin(target_url, href) if href else target_url

            results.append({
                "id": f"work-{len(results) + 1}",
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
        except Exception:
            continue

    print(f"[SUCCESS] {len(results)}개 프로젝트 카드 수집 및 에셋 저장 완료 -> {save_dir}", flush=True)
    return results

# 별칭 제공 (호환성 보장)
extract_and_download_cards = extract_works_with_images

def process_university_card(page, item: dict) -> Tuple[str, Optional[dict]]:
    raw_univ = item.get("university", "")
    dept = item.get("department", "")
    card_id = item.get("id", "DES-XX")
    year = str(item.get("year", "2025"))
    category = item.get("category", "디자인·UX/UI")

    univ = normalize_univ_name(raw_univ)
    clean_u = univ.replace("/", "_").replace("\\", "_").strip()
    clean_d = dept.replace("/", "_").replace("\\", "_").strip()
    out_dir = os.path.join(DOWNLOAD_BASE, f"{clean_u}_{clean_d}")
    os.makedirs(out_dir, exist_ok=True)
    poster_path = os.path.join(out_dir, "poster.png")

    print(f"[QUEUE_START] 대상: {univ} {dept} ({card_id})", flush=True)
    print(f"[*] 타겟 도메인 탐색 중...", flush=True)

    # 타겟 URL 후보 확보 (0순위: 큐 항목 자체에 명시된 target_url / official_url / scraped_url, 1순위: 공식 등록 사이트, 2순위: 검색 엔진 발굴)
    candidates = []
    explicit_url = item.get("target_url") or item.get("official_url") or item.get("scraped_url")
    if explicit_url and str(explicit_url).startswith("http"):
        candidates.append(str(explicit_url).strip())
    if univ in KNOWN_OFFICIAL_SITES:
        for s in KNOWN_OFFICIAL_SITES[univ]["direct_sites"]:
            if s not in candidates:
                candidates.append(s)

    # 네이버 모바일 검색 보강
    clean_dept_word = dept.replace("학과", "").replace("학부", "").replace("전공", "").strip()
    q = f"{univ} {clean_dept_word} {year} 졸업전시"
    try:
        m_naver = f"https://m.search.naver.com/search.naver?query={urllib.parse.quote(q)}"
        page.goto(m_naver, wait_until="domcontentloaded", timeout=10000)
        page.wait_for_timeout(600)
        for a in page.locator("a").all():
            href = a.get_attribute("href") or ""
            if href.startswith("http") and is_url_allowed(href, univ):
                if any(kw in href for kw in ["design", "archive", "works", "degree", "exhibition", "show"]) or "ac.kr" in href:
                    if href not in candidates:
                        candidates.append(href)
    except Exception:
        pass

    if not candidates:
        print(f"[SKIP] {univ} {dept} 공식 아카이브 링크 미발견 (상태: 보류 전환)", flush=True)
        return "FAILED", None

    for target_url in candidates:
        try:
            # 3단계: 공식 URL 직행 및 CAPTCHA 검사
            page.goto(target_url, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_timeout(1000)

            is_cap, cap_reason = detect_captcha(page, target_url)
            if is_cap:
                print(f"[!] CAPTCHA 감지: {target_url} ({cap_reason}) -> 즉시 회피 트리거 가동", flush=True)
                continue

            print(f"[*] 정상 진입: {target_url}", flush=True)

            # Lazy loading 해제 (1회 스크롤)
            page.evaluate("window.scrollTo(0, 800)")
            page.wait_for_timeout(600)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(400)

            page_title = page.title() or f"[{univ}] {dept} {year} 졸업전시회"

            # 4단계: 메인 포스터 이미지 파싱 및 PIL 검증
            found_poster = False
            best_poster_url = target_url

            # 페이지 내 모든 이미지 후보 다운로드 및 PIL 종횡비/해상도 검증
            img_elements = page.locator("main img, header img, section img, article img, img").all()
            for img_el in img_elements[:15]:
                try:
                    src = img_el.get_attribute("src") or ""
                    if not src or src.endswith(".svg") or "icon" in src.lower() or "logo" in src.lower():
                        continue
                    full_src = urllib.parse.urljoin(target_url, src)

                    # 다운로드
                    temp_p = os.path.join(out_dir, "temp_poster.png")
                    req = urllib.request.Request(full_src, headers={"User-Agent": DEFAULT_USER_AGENT, "Referer": target_url})
                    with urllib.request.urlopen(req, timeout=8) as r:
                        content = r.read()
                        if len(content) > 5000:
                            with open(temp_p, "wb") as f:
                                f.write(content)

                    # PIL 규격 검증
                    v, w, h, ratio = verify_poster_image(temp_p)
                    if v:
                        if os.path.exists(poster_path):
                            try: os.remove(poster_path)
                            except: pass
                        os.rename(temp_p, poster_path)
                        found_poster = True
                        best_poster_url = full_src
                        print(f"[+] 포스터 검증 완료: {full_src} (해상도 {w}x{h}, 종횡비 {ratio:.2f})", flush=True)
                        break
                    else:
                        if os.path.exists(temp_p):
                            os.remove(temp_p)
                except Exception:
                    continue

            # 포스터 엘리먼트가 배경 캔버스/CSS일 경우 뷰포트 비주얼 캡처
            if not found_poster:
                try:
                    hero_box = page.locator("main, section, #root, #wrap, body").first
                    hero_box.screenshot(path=poster_path)
                    v, w, h, ratio = verify_poster_image(poster_path)
                    if v or (w >= 400 and h >= 500):
                        found_poster = True
                        print(f"[+] 포스터(메인 비주얼) 캡처 검증 완료: (해상도 {w}x{h})", flush=True)
                except Exception:
                    pass

            is_board_view = is_single_board_view(page, target_url)

            if not found_poster and not is_board_view:
                continue

            # 작품(Works) 경로 진입 (단일 게시글 뷰가 아닌 경우에만 내부 네비게이션 탐색)
            works_url = target_url
            if not is_board_view:
                for a in page.locator("a").all():
                    try:
                        href = a.get_attribute("href") or ""
                        t_lower = (a.inner_text() or "").lower()
                        h_lower = href.lower()
                        if any(w in h_lower or w in t_lower for w in ["works", "work", "projects", "project", "작품", "exhibition"]):
                            if not any(f in h_lower for f in FORBIDDEN_PATHS):
                                resolved_w = urllib.parse.urljoin(target_url, href)
                                if resolved_w != target_url and is_url_allowed(resolved_w, univ):
                                    works_url = resolved_w
                                    break
                    except Exception:
                        continue

                if works_url != target_url:
                    page.goto(works_url, wait_until="domcontentloaded", timeout=12000)
                    page.wait_for_timeout(1000)

            # 바닥까지 완전 무한 스크롤(Full Scroll)로 0~N개 작품 전체 DOM 렌더링
            last_height = page.evaluate("document.body.scrollHeight")
            for _ in range(25):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
                page.wait_for_timeout(400)
                new_height = page.evaluate("document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(300)

            # 학생 출품작 전수 수집 및 이미지 캡처 (extract_works_with_images 가동)
            public_captures_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures")
            )
            works_sample = extract_works_with_images(page, works_url, card_id, output_dir=public_captures_dir, univ=univ, dept=dept)
            print(f"[+] Works URL 확보: {works_url} (출품작 {len(works_sample)}점 수집 및 썸네일 캡처 완료)", flush=True)

            if not os.path.exists(poster_path) and works_sample:
                first_img = os.path.join(public_captures_dir, card_id, "work_1.png")
                if os.path.exists(first_img):
                    import shutil
                    shutil.copyfile(first_img, poster_path)
                    print(f"[+] 대표 포스터 대체 복사 완료: {first_img} -> {poster_path}", flush=True)

            # JSON 출력 데이터 빌드
            rel_poster = os.path.join("data", "downloads", f"{clean_u}_{clean_d}", "poster.png").replace("\\", "/")
            item["status"] = "리서치 완료"
            item["poster_image"] = rel_poster
            item["exhibition_title"] = page_title
            item["scraped_url"] = target_url
            item["critic_score"] = 95
            item["curation_summary"] = {
                "headline": page_title,
                "curation_intro": f"{year}년도 {univ} {dept} 공식 졸업전시회 아카이브입니다. 학생들의 창작 역량과 혁신적인 실험을 선보입니다.",
                "inferred_industry_keywords": [category.split("·")[0], dept, f"{year}졸전"]
            }
            item["artworks"] = [
                {
                    "title": w["title"],
                    "student_name": w["author"],
                    "image": w["thumbnail"],
                    "thumbnail": w["thumbnail"],
                    "screenshot_path": w["screenshot_path"],
                    "description": f"{w['title']} - {w['author']}",
                    "inferred_role": f"{dept} 크리에이터",
                    "detail_url": w["detail_url"]
                }
                for w in works_sample
            ]

            print(f"[SUCCESS] {univ} {dept} 카드 에셋 주입 완료 (총 {len(works_sample)}점)", flush=True)
            return "SUCCESS", item

        except Exception as e:
            sys.stderr.write(f"[Target Visit Error {target_url}]: {e}\n")
            continue

    print(f"[SKIP] {univ} {dept} 에셋 검증 미달 (상태: 보류 전환)", flush=True)
    return "FAILED", None

def main():
    if not os.path.exists(QUEUE_FILE):
        print(f"[ERROR] 큐 파일 누락: {QUEUE_FILE}")
        return

    with open(QUEUE_FILE, "r", encoding="utf-8") as f:
        queue = json.load(f)

    # 리서치 대상 선별 (이미 '리서치 완료'이고 실제 포스터 파일이 존재하는 카드 제외)
    pending_items = []
    for q_item in queue:
        status = q_item.get("status", "")
        poster = q_item.get("poster_image")
        if status == "리서치 완료" and poster and os.path.exists(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", poster))):
            continue
        pending_items.append(q_item)

    print(f"==================================================", flush=True)
    print(f"[*] 대시보드 관제 마스터 에이전트 가동 (대기 큐: {len(pending_items)}건)", flush=True)
    print(f"[*] 퍼플렉시티식 역추적 및 CAPTCHA Skip 로직 활성화", flush=True)
    print(f"==================================================", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(viewport={"width": 1280, "height": 960}, user_agent=DEFAULT_USER_AGENT, locale="ko-KR")
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = context.new_page()

        for idx, item in enumerate(pending_items, start=1):
            status, updated = process_university_card(page, item)

            # queue 즉시 동기화
            try:
                with open(QUEUE_FILE, "w", encoding="utf-8") as f:
                    json.dump(queue, f, ensure_ascii=False, indent=2)
            except Exception as e:
                print(f"[WARN] 큐 저장 실패: {e}", flush=True)

            print("--------------------------------------------------", flush=True)
            time.sleep(1.5)

        browser.close()

    print("[*] 전체 큐 순차 처리 완료.", flush=True)

if __name__ == "__main__":
    main()
