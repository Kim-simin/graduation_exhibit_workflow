from category_mapper import get_standard_category
import os
import sys
import re
import json
import time
import base64
import asyncio
import argparse
import urllib.parse
from urllib.parse import urljoin
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
from playwright.async_api import async_playwright
import requests

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
    "/event", "/profboard", "/book", "/library", "/login"
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
    },
    "인천대학교": {
        "domains": ["inu.ac.kr"],
        "direct_sites": ["https://cse.inu.ac.kr/isis/13789/subview.do"]
    },
    "강원대학교": {
        "domains": ["kangwon.ac.kr"],
        "direct_sites": ["https://design.kangwon.ac.kr/"]
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
        "한국공학대": "한국공학대학교", "한예종": "한국예술종합학교", "강원대": "강원대학교"
    }
    for k, v in replacements.items():
        if u == k or u.startswith(k):
            return v
    if not u.endswith("대학교") and not u.endswith("학교"):
        return u + "대학교"
    return u

async def detect_captcha(page, target_url: str) -> Tuple[bool, str]:
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
            if await page.locator(sel).first.is_visible(timeout=250):
                return True, f"위젯 감지 ({sel})"
        except Exception:
            pass

    try:
        title = ((await page.title()) or "").lower()
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

async def is_inside_navigation(element) -> bool:
    """헤더, 네비게이션, GNB, 유틸리티, 푸터, 사이드바 내부 요소인지 검사"""
    try:
        return await element.evaluate("""el => {
            return !!el.closest('header, nav, footer, aside, [class*="gnb"], [id*="gnb"], [class*="menu"], [id*="menu"], [class*="util"], [class*="top-"], [id*="header"], [id*="footer"], [class*="sidebar"], [class*="navigation"]');
        }""")
    except Exception:
        return False

def normalize_title(title: str) -> str:
    """공백, 특수문자 제거 및 소문자 정규화"""
    if not title:
        return ""
    return re.sub(r'[\s\W_]+', '', title).lower()

def normalize_url(url: str) -> str:
    """URL에서 쿼리스트링, 해시, 끝 슬래시를 제거한 정규화 경로 반환"""
    if not url:
        return ""
    try:
        p = urllib.parse.urlparse(url)
        path = p.path.rstrip('/')
        return f"{p.scheme}://{p.netloc}{path}".lower()
    except Exception:
        return url.strip().lower()

def normalize_img_src(src: str, base_url: str) -> str:
    """이미지 URL 정규화 (next/image query string 정제 등)"""
    if not src:
        return ""
    try:
        abs_url = urllib.parse.urljoin(base_url, src)
        p = urllib.parse.urlparse(abs_url)
        if '/_next/image' in p.path and 'url=' in p.query:
            qs = urllib.parse.parse_qs(p.query)
            if 'url' in qs:
                abs_url = qs['url'][0]
                p = urllib.parse.urlparse(abs_url)
        return f"{p.scheme}://{p.netloc}{p.path}".strip().lower()
    except Exception:
        return src.strip().lower()

async def filter_top_level_card_elements(page, elements: list) -> list:
    """후보 엘리먼트 배열 중 다른 후보 요소 내부에 포함된(자식/후손) 중복 요소를 제거"""
    if not elements or len(elements) <= 1:
        return elements
    try:
        await page.evaluate("""() => {
            document.querySelectorAll('[data-candidate-elem]').forEach(el => el.removeAttribute('data-candidate-elem'));
        }""")
        for i, el in enumerate(elements):
            try:
                await el.evaluate(f"(node, idx) => node.setAttribute('data-candidate-elem', String(idx))", i)
            except Exception:
                pass
        
        kept_indices = await page.evaluate("""() => {
            const nodes = Array.from(document.querySelectorAll('[data-candidate-elem]'));
            const kept = nodes.filter(node => !nodes.some(other => other !== node && other.contains(node)));
            return kept.map(n => parseInt(n.getAttribute('data-candidate-elem'), 10)).filter(n => !isNaN(n));
        }""")
        
        await page.evaluate("""() => {
            document.querySelectorAll('[data-candidate-elem]').forEach(el => el.removeAttribute('data-candidate-elem'));
        }""")
        
        if kept_indices:
            return [elements[i] for i in kept_indices if i < len(elements)]
    except Exception as e:
        print(f"[WARN] DOM de-nesting filtering fallback: {e}", flush=True)
    return elements

async def is_single_board_view(page, target_url: str) -> bool:
    """단일 게시글 뷰(Single Board View) 여부 판별"""
    u_lower = target_url.lower()
    url_view_hints = ["mode=view", "/view/", "view.do", "view.php", "view.jsp", "view.html", "view.asp", "article_id=", "articleno=", "b_id=", "board_id=", "nttid=", "artclview"]
    if any(h in u_lower for h in url_view_hints):
        return True
    try:
        has_view = await page.evaluate("""() => {
            return !!document.querySelector('.b-title, div[class*="board_view"], div[class*="bbs_view"], div[id*="board_view"], div[class*="view_wrap"], div[class*="view-content"], div.sub-content-wrap, .view-con, .board-view-info');
        }""")
        return bool(has_view)
    except Exception:
        return False

def clean_json_output(raw_text: str) -> str:
    """Qwen 모델의 생각 태그(<think>) 및 마크다운 코드블록을 완벽 제거"""
    text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL)
    text = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    return match.group(0) if match else text

def parse_robust_json(text: str) -> Optional[Dict[str, Any]]:
    clean = clean_json_output(text)
    try:
        data = json.loads(clean)
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    return None

# ==============================================================================
# 1. 로컬 VLM 기반 페이지 구조 동적 판단 (Router)
# ==============================================================================
async def analyze_page_type_with_llama(
    screenshot_base64: str,
    server_url: str = "http://127.0.0.1:8080",
    fallback_hint_url: str = "",
    fallback_is_board: bool = False
) -> str:
    """
    타겟 URL 접속 직후 첫 화면을 캡처하여 http://127.0.0.1:8080/v1/chat/completions (로컬 Qwen2.5-VL)에 전송.
    JSON 형식:
    {
      "page_type": "GRID_GALLERY" | "LIST_BOARD",
      "reason": "판단 사유"
    }
    GRID_GALLERY: 한 페이지 내에 작품 썸네일들이 모두 모여있는 경우.
    LIST_BOARD: 텍스트 게시판이나 썸네일 목록 형태라서 클릭 후 '상세 페이지'로 들어가야 작품을 볼 수 있는 경우.
    """
    prompt = """Analyze this webpage screenshot and determine its UI structure type for scraping a university graduation exhibition.

Classification types:
1. "GRID_GALLERY": A single gallery page where multiple artwork/project cards, photos, or visual thumbnails are displayed together on the page itself in a grid or masonry layout (users view artworks directly on this page or infinite scroll).
2. "LIST_BOARD": A text bulletin board, table, or list format (typical university board/notice style with titles, authors, dates, post numbers, or small table items) where users must click a title/row to enter a 'detail page' to view the artwork and content.

Return STRICT JSON:
{
  "page_type": "GRID_GALLERY" or "LIST_BOARD",
  "reason": "Clear explanation of judgment"
}
"""
    payload = {
        "model": "qwen2.5-vl",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{screenshot_base64}"}}
                ]
            }
        ],
        "temperature": 0.05,
        "max_tokens": 512
    }

    endpoint = f"{server_url.rstrip('/')}/v1/chat/completions"
    try:
        def _post():
            return requests.post(endpoint, json=payload, timeout=20)
        res = await asyncio.to_thread(_post)
        if res.status_code == 200:
            raw_content = res.json()["choices"][0]["message"]["content"]
            data = parse_robust_json(raw_content)
            if data and "page_type" in data:
                p_type = str(data["page_type"]).strip().upper()
                reason = data.get("reason", "")
                if "LIST" in p_type or "BOARD" in p_type:
                    print(f"[*] [VLM Router] 판정: LIST_BOARD (사유: {reason})", flush=True)
                    return "LIST_BOARD"
                elif "GRID" in p_type or "GALLERY" in p_type:
                    print(f"[*] [VLM Router] 판정: GRID_GALLERY (사유: {reason})", flush=True)
                    return "GRID_GALLERY"
    except Exception as e:
        print(f"[WARN] llama-server (Qwen2.5-VL) 통신 실패 또는 비가동 ({e}) -> DOM/URL 기반 휴리스틱 분류로 폴백", flush=True)

    # 오프라인/통신 실패 시 안전 폴백
    u_lower = fallback_hint_url.lower()
    board_hints = ["subview.do", "board", "bbs", "artcllist", "list.do", "list.php", "board_id", "b_id"]
    if fallback_is_board or any(h in u_lower for h in board_hints):
        print(f"[*] [Router Fallback] 휴리스틱 판정: LIST_BOARD (URL: {fallback_hint_url})", flush=True)
        return "LIST_BOARD"

    print(f"[*] [Router Fallback] 기본 판정: GRID_GALLERY", flush=True)
    return "GRID_GALLERY"

# ==============================================================================
# 2. 신규 모드: [전략 C: 게시판 목록-상세(List-Detail) 순회]
# ==============================================================================
async def crawl_list_detail_pattern(
    page,
    target_url: str,
    card_id: str,
    output_dir: str = "public/captures",
    univ: str = "",
    dept: str = ""
) -> List[Dict[str, Any]]:
    """
    [전략 C: 게시판 목록-상세(List-Detail) 순회]
    1. 상세 페이지 링크 일괄 수집:
       - 페이지가 일반 갤러리 그리드가 아닌 '게시판 형태(Table, Board List)'일 경우
       - 게시글 제목에 달린 <a> 태그의 href/data-bbs-artcl-seq 속성을 배열로 모두 수집
       - 중복 제거 및 무의미한 페이징/로그인 링크 필터링
    2. 순회 진입 및 본문(Detail) 추출 (브라우저 Back 방식 지양):
       - 수집된 링크 배열을 for문으로 순회하며 await page.goto(detail_url)로 하나씩 직접 진입
       - 본문 컨테이너(.view-con, .board-view, .post-content, .view-content, article, main) 탐색
       - 텍스트 추출: 본문 내에서 작품명(제목)과 작가명/팀원명(예: "최해솔, 김현빈, 최경민", "인천공항T3") 파싱
       - 이미지 캡처: 본문 내 가장 큰 메인 이미지(포스터)를 찾아 다운로드하거나 img 엘리먼트 단독 캡처
    3. 순회가 끝나면 원래 목록 URL로 복귀
    """
    save_dir = os.path.join(output_dir, card_id)
    os.makedirs(save_dir, exist_ok=True)

    print(f"[*] [전략 C: List-Detail] 게시판 목록 상세 순회 가동: {target_url}", flush=True)

    # 1. 페이지네이션을 돌며 모든 상세 링크 수집 (중복 제거 및 전체 페이지 순회)
    detail_links_info = []
    seen_urls = set()
    page_num = 1
    max_pages = 25  # 안전 상한

    while page_num <= max_pages:
        page_links = await page.evaluate("""() => {
            const links = [];
            const origin = window.location.origin;
            const currentUrl = window.location.href;

            // 테이블 리스트, 게시판 목록 컨테이너 우선 탐색
            const candidateSelectors = [
                'table tbody tr td a',
                'table.board-table a',
                'table.horizon1 a',
                'ul[class*="board"] li a',
                'ul[class*="list"] li a',
                'div[class*="list"] a',
                'a.js-view-artcl',
                'a[data-bbs-artcl-seq]',
                'a[href*="artclView"]',
                'a[href*="view.do"]',
                'a[href*="view.php"]',
                'a[href*="board.php"]'
            ];

            const aElements = document.querySelectorAll(candidateSelectors.join(', '));
            for (const a of aElements) {
                // 네비게이션, 푸터, 페이징 버튼 배제
                if (a.closest('header, nav, footer, .paging, .pagination, .page-nav, .b-paging, .view-navi, .btn-mine, .wrap_page_func, #header, #footer')) {
                    continue;
                }

                const text = (a.innerText || '').trim().replace(/\\s+/g, ' ');
                const href = a.getAttribute('href') || '';
                const seq = a.getAttribute('data-bbs-artcl-seq') || a.getAttribute('data-artcl-seq') || a.getAttribute('data-seq');
                const siteId = a.getAttribute('data-site-id') || 'isis';
                const fnctNo = a.getAttribute('data-fnct-no') || '3178';

                let resolved = '';
                if (seq) {
                    // K2Web Wizard CMS (인천대 등)
                    resolved = `${origin}/bbs/${siteId}/${fnctNo}/${seq}/artclView.do`;
                } else if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                    try {
                        const full = new URL(href, currentUrl).href;
                        const low = full.toLowerCase();
                        if (!low.includes('page=') && !low.includes('login') && !low.includes('download') &&
                            !low.includes('javascript:') && !low.includes('#')) {
                            if (low.includes('artclview') || low.includes('view.do') || low.includes('view.php') ||
                                low.includes('/view/') || low.includes('board.php') || low.includes('wr_id') ||
                                low.includes('artclseq') || low.includes('nttid') || low.includes('article') ||
                                a.closest('td.td-subject, td.title, th.title, .b-title, .subject, [class*="subject"]')) {
                                resolved = full;
                            }
                        }
                    } catch(e) {}
                }

                if (resolved && text.length > 2) {
                    links.push({
                        url: resolved,
                        title_hint: text
                    });
                }
            }
            return links;
        }""")

        # 폴백: 위에서 못 찾았을 경우 전체 DOM에서 view 관련 링크 수집
        if not page_links:
            page_links = await page.evaluate("""() => {
                const links = [];
                const origin = window.location.origin;
                for (const a of document.querySelectorAll('a')) {
                    if (a.closest('header, nav, footer, .paging, .pagination, .wrap_page_func')) continue;
                    const href = a.getAttribute('href') || '';
                    const seq = a.getAttribute('data-bbs-artcl-seq') || a.getAttribute('data-artcl-seq');
                    const siteId = a.getAttribute('data-site-id') || 'isis';
                    const fnctNo = a.getAttribute('data-fnct-no') || '3178';
                    let resolved = '';
                    if (seq) {
                        resolved = `${origin}/bbs/${siteId}/${fnctNo}/${seq}/artclView.do`;
                    } else if (href && (href.includes('artclView.do') || href.includes('view.do') || href.includes('/view/'))) {
                        try { resolved = new URL(href, window.location.href).href; } catch(e) {}
                    }
                    if (resolved) {
                        links.push({ url: resolved, title_hint: (a.innerText || '').trim() });
                    }
                }
                return links;
            }""")

        new_count = 0
        for item in page_links:
            u = item["url"]
            if u not in seen_urls:
                seen_urls.add(u)
                detail_links_info.append(item)
                new_count += 1

        print(f"[*] [전략 C 페이지네이션] {page_num}페이지에서 {new_count}개 신규 링크 수집 (누적: {len(detail_links_info)}개)", flush=True)

        # 다음 페이지 탐색 및 클릭
        next_page_num = page_num + 1
        next_btn = await page.query_selector(
            f"a[href*=\"page_link('{next_page_num}')\"], "
            f"a[title*=\"{next_page_num}페이지\"], "
            f"a[href*=\"pageIndex={next_page_num}\"], "
            f"a[href*=\"page={next_page_num}\"], "
            f".pagination a.next, a._listNext, a[title*='다음'], a:has-text('>')"
        )

        if next_btn and await next_btn.is_visible():
            is_disabled = await next_btn.evaluate("""el => {
                return el.classList.contains('disabled') || 
                       el.disabled || 
                       el.getAttribute('href') === 'javascript:void(0);' || 
                       el.getAttribute('href') === '#' || 
                       (el.classList.contains('_last') && !el.innerText.includes('다음'));
            }""")
            href_attr = (await next_btn.get_attribute("href") or "").strip()
            if not is_disabled and (str(next_page_num) in href_attr or "next" in href_attr.lower() or "page_link" in href_attr or "page" in href_attr.lower()):
                print(f"[*] [전략 C 페이지네이션] 다음 페이지({next_page_num})로 이동 중...", flush=True)
                try:
                    await next_btn.click()
                    await page.wait_for_timeout(2000)
                    page_num = next_page_num
                    continue
                except Exception as e:
                    print(f"[!] 다음 페이지 이동 실패: {e}", flush=True)
                    break

        # 더 이상 다음 페이지가 없으면 루프 탈출
        break

    if not detail_links_info:
        print("[*] [전략 C] 게시판 상세 링크가 존재하지 않습니다.", flush=True)
        return []

    print(f"[*] [전략 C] 게시판 전체 페이지 순회 완료. 총 {len(detail_links_info)}개의 전체 상세 페이지 순회 시작 (제한 없음)...", flush=True)
    results = []

    # 수집된 전체 상세 페이지 순회 (하드코딩 슬라이싱 영구 제거!)
    for idx, item_info in enumerate(detail_links_info):
        detail_url = item_info["url"]
        title_hint = item_info.get("title_hint", "")
        print(f"[*] [전략 C #{idx+1}/{len(detail_links_info)}] 상세 페이지 진입: {detail_url}", flush=True)

        try:
            await page.goto(detail_url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(1000)

            # CAPTCHA 방어
            is_cap, cap_reason = await detect_captcha(page, detail_url)
            if is_cap:
                print(f"[!] CAPTCHA 감지: {detail_url} ({cap_reason}) -> 건너뜀", flush=True)
                continue

            # 지연 로딩 스크롤
            try:
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                await page.wait_for_timeout(600)
                await page.evaluate("window.scrollTo(0, 0)")
            except Exception:
                pass

            # 상세 페이지 본문 컨테이너 찾기
            content_area = await page.query_selector('.view-con, .board-view, .post-content, .view-content, div[class*="view_wrap"], article, main')
            target_el = content_area if content_area else page

            # 본문 내 텍스트 모두 긁기 (팀원, 작품명 등)
            raw_text = ((await target_el.inner_text()) or "").strip()
            lines = [line.strip() for line in raw_text.split('\n') if line.strip()]

            # 1) 작품명 추출
            title = ""
            for t_sel in ['.view-title', 'h2.view-title', '.b-title', 'h2[class*="title"]', 'h3[class*="title"]', 'h1', 'h2', 'h3']:
                el = await page.query_selector(t_sel)
                if el and await el.is_visible():
                    txt = (await el.inner_text()).strip()
                    if txt and is_valid_card_text(txt, univ, dept) and len(txt) >= 2:
                        title = txt
                        break

            # 본문 텍스트 내 "1.작품명 : ..." 형태 탐색
            if not title or len(title) > 80:
                for line in lines:
                    m_t = re.search(r'(?:^\d+\.?\s*)?(?:작품명|작품제목|프로젝트명)\s*[:：]\s*(.+)', line)
                    if m_t:
                        cand = m_t.group(1).strip()
                        if cand and is_valid_card_text(cand, univ, dept):
                            title = cand
                            break

            if not title:
                title = title_hint if title_hint and is_valid_card_text(title_hint, univ, dept) else (lines[0] if lines else f"작품 #{idx+1}")

            # 제목 정제: "2026년 졸업작품 G-05. " 나 "1.작품명 : " 접두사 제거
            title = re.sub(r'^\d+\.?\s*(?:작품명\s*[:：])?\s*', '', title).strip()
            title = re.sub(r'^\d{4}년?\s*졸업작품\s*[A-Z0-9-]+\.\s*', '', title).strip()

            # 2) 팀원 / 작가명 추출 (팀원: 최해솔, 김현빈, 최경민 / 팀 명: 인디언 등 파싱)
            author = ""
            for line in lines:
                m_mem = re.search(r'(?:팀원|학생|참여자|제작자|조원)\s*[:：]\s*(.+)', line)
                if m_mem:
                    author = m_mem.group(1).strip()
                    break

            if not author:
                for line in lines:
                    m_team = re.search(r'(?:^\d+\.?\s*)?(?:팀\s*명|팀명)\s*[:：]\s*(.+)', line)
                    if m_team:
                        author = m_team.group(1).strip()
                        break

            if not author:
                for a_sel in ['.view-util .writer dd', 'dl.writer dd', '.b-writer', 'td.writer', 'span.writer']:
                    el = await page.query_selector(a_sel)
                    if el and await el.is_visible():
                        txt = (await el.inner_text()).strip()
                        if txt and len(txt) <= 25 and is_valid_card_text(txt, univ, dept) and txt != dept and "학과" not in txt:
                            author = txt
                            break

            if not author:
                author = f"{univ or '출품'} 작가"

            # 3) 본문 내 이미지 요소 캡처 (본문 내 가장 큰 메인 이미지 포스터 찾기)
            img_filename = f"work_{len(results) + 1}.png"
            img_save_path = os.path.join(save_dir, img_filename)
            public_thumb_url = f"/captures/{card_id}/{img_filename}"

            all_imgs = await target_el.query_selector_all('img')
            best_img = None
            max_area = 0
            for img in all_imgs:
                src = (await img.get_attribute('src') or "").lower()
                if not src or src.endswith('.svg') or any(ign in src for ign in ['icon', 'btn', 'logo', 'sns', 'share', 'facebook', 'instagram', 'twitter']):
                    continue
                box = await img.bounding_box()
                if box and box['width'] >= 80 and box['height'] >= 80:
                    area = box['width'] * box['height']
                    if area > max_area:
                        max_area = area
                        best_img = img

            captured = False
            if best_img:
                try:
                    src = await best_img.get_attribute('src') or ""
                    abs_src = urljoin(page.url, src)
                    if abs_src.startswith('http') and not abs_src.endswith('.svg'):
                        try:
                            res = await page.request.get(abs_src, timeout=8000)
                            if res.status == 200 and len(await res.body()) > 1000:
                                with open(img_save_path, 'wb') as f:
                                    f.write(await res.body())
                                captured = True
                        except Exception:
                            pass
                    if not captured:
                        await best_img.screenshot(path=img_save_path, timeout=5000)
                        if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 1000:
                            captured = True
                except Exception as e:
                    print(f"[WARN] 이미지 캡처 실패 ({title}): {e}", flush=True)

            if not captured:
                try:
                    if content_area:
                        await content_area.screenshot(path=img_save_path)
                    else:
                        await page.screenshot(path=img_save_path)
                    captured = True
                except Exception:
                    pass

            results.append({
                "id": f"work-{len(results) + 1}",
                "title": title,
                "project_title": title,
                "author": author,
                "caption": f"{title} | {author}",
                "thumbnail": public_thumb_url if captured else "",
                "screenshot_path": public_thumb_url if captured else "",
                "image_url": public_thumb_url if captured else "",
                "raw_text": f"{title} | {author}",
                "detail_url": detail_url
            })
            print(f"[+] [전략 C #{len(results)}] 작품 수집: '{title}' (작가/팀: {author}) -> {img_save_path}", flush=True)

            # 안정화 딜레이 (DOM Detached 및 브라우저 과부하 방지)
            await page.wait_for_timeout(1000)

        except Exception as e:
            print(f"[WARN] 상세 페이지 순회 중 오류 발생 ({detail_url}): {e}", flush=True)
            await page.wait_for_timeout(1000)

    # 순회가 끝나면 원래 목록 URL로 복귀
    try:
        await page.goto(target_url, wait_until="domcontentloaded", timeout=15000)
    except Exception:
        pass

    return results

# ==============================================================================
# 기존 단일 게시글 뷰 본문 이미지 추출 로직
# ==============================================================================
async def extract_single_board_view_images(page, target_url: str, card_id: str, output_dir: str = "public/captures", univ: str = "", dept: str = "") -> List[Dict[str, Any]]:
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
            el = await page.query_selector(sel)
            if el and await el.is_visible():
                txt = (await el.inner_text()).strip().replace('\n', ' ')
                if txt and is_valid_card_text(txt, univ, dept) and len(txt) >= 2:
                    article_title = txt
                    break
        except Exception:
            continue
            
    if not article_title:
        article_title = (await page.title()) or f"[{univ}] {card_id} 전시"

    body_selectors = [
        'div.sub-content-wrap', 'div[class*="view_content"]', 'div[class*="view-con"]',
        'div[class*="board-view"]', 'div[class*="board_view"]', 'div[class*="view_wrap"]',
        'div[class*="content"]', 'article', '#cms-content', 'main'
    ]
    body_el = None
    for b_sel in body_selectors:
        try:
            candidate = await page.query_selector(b_sel)
            if candidate and await candidate.is_visible():
                imgs = await candidate.query_selector_all('img')
                if len(imgs) > 0:
                    body_el = candidate
                    break
        except Exception:
            continue
            
    if not body_el:
        body_el = page
        
    all_imgs = await body_el.query_selector_all('img')
    results = []
    
    for idx, img_el in enumerate(all_imgs):
        try:
            if not await img_el.is_visible():
                continue
            if await is_inside_navigation(img_el):
                continue
                
            box = await img_el.bounding_box()
            if box and (box['width'] < 120 or box['height'] < 120):
                continue
                
            src = await img_el.get_attribute("src") or await img_el.get_attribute("data-src") or ""
            if not src or src.endswith(".svg") or any(ign in src.lower() for ign in ["icon", "btn", "logo", "banner"]):
                continue
                
            img_filename = f"work_{len(results) + 1}.png"
            img_save_path = os.path.join(save_dir, img_filename)
            public_thumbnail_path = f"/captures/{card_id}/{img_filename}"
            
            captured = False
            try:
                await img_el.screenshot(path=img_save_path, timeout=3000)
                if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 1000:
                    captured = True
            except Exception:
                pass
                
            if not captured and src:
                full_src = urllib.parse.urljoin(target_url, src)
                try:
                    res = await page.request.get(full_src, timeout=5000)
                    if res.status == 200:
                        with open(img_save_path, "wb") as f:
                            f.write(await res.body())
                        if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 1000:
                            captured = True
                except Exception:
                    pass
                    
            if not captured:
                continue
                
            alt = ((await img_el.get_attribute("alt")) or "").strip()
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

# ==============================================================================
# 갤러리 스크롤 및 카드 추출 로직 (전략 A, B, C 통합 체인)
# ==============================================================================
async def extract_works_with_images(page, target_url: str, card_id: str, output_dir: str = "public/captures", univ: str = "", dept: str = "") -> List[Dict[str, Any]]:
    save_dir = os.path.join(output_dir, card_id)
    os.makedirs(save_dir, exist_ok=True)

    print(f"[*] 타겟 사이트 진입 탐색: {target_url}", flush=True)
    try:
        await page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
    except Exception as e:
        print(f"[WARN] 초기 로딩 지연: {e}", flush=True)

    # 1. 단일 게시글 뷰(Single Board View) 감지 시 전용 추출 로직으로 분기
    if await is_single_board_view(page, target_url):
        print(f"[*] [Single Board View 감지] {target_url} -> 본문 이미지 전수 수집 모드 가동", flush=True)
        board_results = await extract_single_board_view_images(page, target_url, card_id, output_dir, univ, dept)
        if board_results:
            return board_results

    # 2. CSR / Next.js 데이터 하이드레이션 및 지연 로딩 대기
    await page.wait_for_timeout(2000)
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

    # 3. 동적 그리드 / 링크 기반 탐지 (우선순위: 전략 A -> 전략 B -> 전략 C 체인)
    candidate_elements = []

    # 전략 A: 동일 경로 내 상세 링크 패턴(/projects/, /project/, /works/)을 가진 <a> 태그 탐지
    link_candidates = await page.query_selector_all('a[href*="/project"], a[href*="/work"], a[href*="/piece"], a[href*="/works/"]')
    valid_links = []
    for link in link_candidates:
        if await is_inside_navigation(link):
            continue
        box = await link.bounding_box()
        if box and box['width'] > 80 and box['height'] > 80:
            valid_links.append(link)
    if len(valid_links) >= 3:
        candidate_elements = valid_links
        print(f"[*] [전략 A] 상세 링크 패턴 기반으로 {len(candidate_elements)}개 프로젝트 카드 감지 성공", flush=True)

    # 전략 B: 3개 이상 반복되는 그리드/플렉스 자식 컨테이너 분석 (Tailwind/CSS-in-JS 무관 작동)
    if not candidate_elements:
        generic_candidates = await page.query_selector_all('main div, section div, div[class*="grid"] > div, ul > li, div > div')
        valid_boxes = []
        for el in generic_candidates:
            if await is_inside_navigation(el):
                continue
            box = await el.bounding_box()
            if box and 120 < box['width'] < 800 and 120 < box['height'] < 800:
                has_media = await el.query_selector('img, [style*="background"]')
                if has_media:
                    children_with_box = await el.query_selector_all('div')
                    has_card_child = False
                    for child in children_with_box:
                        c_box = await child.bounding_box()
                        if c_box and 120 < c_box['width'] < 800 and 120 < c_box['height'] < 800 and await child.query_selector('img'):
                            has_card_child = True
                            break
                    if not has_card_child:
                        valid_boxes.append(el)
        if len(valid_boxes) >= 3:
            candidate_elements = valid_boxes
            print(f"[*] [전략 B] 그리드 반복 구조 분석으로 {len(candidate_elements)}개 카드 감지 성공", flush=True)

    # 전략 C: 일반 게시판(Table/List) 구조에서 상세 페이지 링크(href) 수집 후 순회 진입
    if not candidate_elements:
        print("[*] [전략 C 검사] 그리드 카드 미발견 -> 일반 게시판(Table/List) 상세 링크 탐색 및 순회 가동...", flush=True)
        board_results = await crawl_list_detail_pattern(
            page=page,
            target_url=target_url,
            card_id=card_id,
            output_dir=output_dir,
            univ=univ,
            dept=dept
        )
        if board_results:
            print(f"[*] [전략 C 성공] 게시판 상세 페이지 순회를 통해 {len(board_results)}개 실제 작품 수집 완료", flush=True)
            return board_results

    # 전략 C까지 없을 때만 최후의 클래스 셀렉터 폴백 시도
    if not candidate_elements:
        content_root = await page.query_selector('main, article, #cms-content, div[id*="content"], div[class*="content"]')
        root_el = content_root if content_root else page
        candidate_elements = await root_el.query_selector_all(
            'div[class*="project"], div[class*="work"], div[class*="card"], div[class*="item"], article'
        )

    # 부모-자식 DOM 중첩 필터링 (Parent-Child De-nesting)
    if candidate_elements:
        candidate_elements = await filter_top_level_card_elements(page, candidate_elements)

    results = []
    seen_titles = set()
    seen_images = set()
    seen_detail_urls = set()
    session = requests.Session()
    session.headers.update({"User-Agent": DEFAULT_USER_AGENT})

    for idx, card in enumerate(candidate_elements):
        try:
            if await is_inside_navigation(card):
                continue

            # 1) 텍스트 추출 (호버 hidden 대비 textContent 폴백)
            raw_text = ((await card.inner_text()) or "").strip()
            if not raw_text:
                raw_text = (await card.evaluate("el => (el.textContent || '').trim()") or "")

            lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            is_fallback_title = False
            if lines:
                title = lines[0]
            else:
                is_fallback_title = True
                title = f"작품 #{len(results) + 1}"

            # 2) 이미지 요소 및 경로 추출
            img_el = await card.query_selector('img')
            has_bg = False
            img_src = ""
            if not img_el:
                has_bg = await card.evaluate("""el => {
                    const style = window.getComputedStyle(el);
                    return !!(style.backgroundImage && style.backgroundImage !== 'none');
                }""")
                if not has_bg:
                    continue
            else:
                src_preview = ((await img_el.get_attribute("src")) or "").lower()
                if "data:image/svg" in src_preview or src_preview.endswith(".svg"):
                    continue
                img_src = await img_el.get_attribute('src') or await img_el.get_attribute('data-src') or ""

            clean_img_key = normalize_img_src(img_src, page.url) if img_src else ""

            # 3) 상세 페이지 링크 추출
            href = await card.get_attribute('href')
            if not href:
                inner_a = await card.query_selector('a')
                if inner_a:
                    href = await inner_a.get_attribute('href')
            detail_url = urllib.parse.urljoin(target_url, href) if href else target_url
            clean_url_key = normalize_url(detail_url) if (href and href != '#') else ""

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
                # 텍스트 미추출 임시 제목(작품 #N)은 이미지가 없거나 이미지가 이미 등록된 경우 절대 수집 금지
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

            img_filename = f"work_{len(results) + 1}.png"
            img_save_path = os.path.join(save_dir, img_filename)
            public_thumbnail_path = f"/captures/{card_id}/{img_filename}"

            captured = False

            if img_el:
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

            if not captured:
                try:
                    target_to_shoot = img_el if (img_el and await img_el.is_visible()) else card
                    await target_to_shoot.screenshot(path=img_save_path, timeout=3000)
                    if os.path.exists(img_save_path) and os.path.getsize(img_save_path) > 500:
                        captured = True
                except Exception as e:
                    print(f"[WARN] 카드 #{idx+1} 단독 스크린샷 실패 ({title}): {e}", flush=True)

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

# ==============================================================================
# 3. 개별 대학교 카드 처리 및 동적 라우팅 파이프라인
# ==============================================================================
async def process_university_card(page, item: dict) -> Tuple[str, Optional[dict]]:
    raw_univ = item.get("university", "")
    dept = item.get("department", "")
    card_id = item.get("id", "DES-XX")
    year = str(item.get("year", "2026"))
    category = item.get("category", "디자인·UX/UI")

    univ = normalize_univ_name(raw_univ)
    clean_u = univ.replace("/", "_").replace("\\", "_").strip()
    clean_d = dept.replace("/", "_").replace("\\", "_").strip()
    out_dir = os.path.join(DOWNLOAD_BASE, f"{clean_u}_{clean_d}")
    os.makedirs(out_dir, exist_ok=True)
    poster_path = os.path.join(out_dir, "poster.png")

    print(f"[QUEUE_START] 대상: {univ} {dept} ({card_id})", flush=True)
    print(f"[*] 타겟 도메인 탐색 중...", flush=True)

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
        await page.goto(m_naver, wait_until="domcontentloaded", timeout=10000)
        await page.wait_for_timeout(600)
        for a in await page.locator("a").all():
            href = await a.get_attribute("href") or ""
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
            print(f"[*] 타겟 사이트 진입 시도: {target_url}", flush=True)
            await page.goto(target_url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(1000)

            # CAPTCHA 및 봇 챌린지 검사
            is_cap, cap_reason = await detect_captcha(page, target_url)
            if is_cap:
                print(f"[!] CAPTCHA 감지: {target_url} ({cap_reason}) -> 즉시 회피 트리거 가동", flush=True)
                continue

            print(f"[*] 정상 진입: {target_url}", flush=True)

            page_title = (await page.title()) or f"[{univ}] {dept} {year} 졸업전시회"

            # ------------------------------------------------------------------
            # 로컬 VLM 기반 페이지 구조 동적 판단 및 라우팅 (Router)
            # ------------------------------------------------------------------
            landing_screenshot = await page.screenshot(full_page=False)
            b64_image = base64.b64encode(landing_screenshot).decode("utf-8")

            is_single_board = await is_single_board_view(page, target_url)
            page_type = await analyze_page_type_with_llama(
                b64_image,
                fallback_hint_url=target_url,
                fallback_is_board=is_single_board
            )

            public_captures_dir = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures")
            )

            # 라우팅 분기: LIST_BOARD vs GRID_GALLERY (체인 통합)
            if page_type == "LIST_BOARD":
                print(f"[*] [ROUTING -> LIST_BOARD] 목록-상세 순회 모드(crawl_list_detail_pattern) 직접 가동", flush=True)
                works_sample = await crawl_list_detail_pattern(page, target_url, card_id, output_dir=public_captures_dir, univ=univ, dept=dept)
            else:
                print(f"[*] [ROUTING -> GRID_GALLERY] 갤러리 모드(extract_and_download_cards) 가동 (내부 전략 A->B->C 체인)", flush=True)
                works_sample = await extract_and_download_cards(page, target_url, card_id, output_dir=public_captures_dir, univ=univ, dept=dept)

            # ------------------------------------------------------------------
            # 대표 포스터 지정 및 보강
            # ------------------------------------------------------------------
            if not os.path.exists(poster_path) and works_sample:
                # 첫 번째 수집된 작품의 스크린샷/포스터를 대표 포스터로 지정
                first_img = os.path.join(public_captures_dir, card_id, "work_1.png")
                if os.path.exists(first_img):
                    import shutil
                    shutil.copyfile(first_img, poster_path)
                    print(f"[+] 대표 포스터 연동 완료: {first_img} -> {poster_path}", flush=True)

            # JSON 출력 데이터 빌드
            rel_poster = os.path.join("data", "downloads", f"{clean_u}_{clean_d}", "poster.png").replace("\\", "/")
            std_cat = get_standard_category(item.get("category") or dept)
            item["category"] = std_cat
            item["status"] = "리서치 완료"
            item["poster_image"] = rel_poster
            item["exhibition_title"] = page_title
            item["scraped_url"] = target_url
            item["critic_score"] = 95
            item["curation_summary"] = {
                "headline": page_title,
                "curation_intro": f"{year}년도 {univ} {dept} 공식 졸업전시회 아카이브입니다. 학생들의 창작 역량과 혁신적인 실험을 선보입니다.",
                "inferred_industry_keywords": [std_cat.split("·")[0], dept, f"{year}졸전"]
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

# ==============================================================================
# 메인 비동기 실행 루프
# ==============================================================================
async def main():
    parser = argparse.ArgumentParser(description="VLM 기반 동적 스크래핑 라우터 및 다단계(List-Detail) 크롤러")
    parser.add_argument("--target-url", type=str, help="단독 테스트할 대상 URL (예: https://cse.inu.ac.kr/isis/13789/subview.do)")
    parser.add_argument("--univ", type=str, default="인천대학교", help="대학교명")
    parser.add_argument("--dept", type=str, default="컴퓨터공학과", help="학과/학부명")
    parser.add_argument("--card-id", type=str, default="UNIV-2026-인천대학교-컴퓨터공학과-0001", help="고유 식별자")
    args = parser.parse_args()

    # 단독 URL 직접 테스트 모드
    if args.target_url:
        print(f"==================================================", flush=True)
        print(f"[*] 단독 타겟 테스트 모드 가동", flush=True)
        print(f"[*] 타겟 URL: {args.target_url}", flush=True)
        print(f"[*] 대상: {args.univ} {args.dept} ({args.card_id})", flush=True)
        print(f"==================================================", flush=True)

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
            )
            context = await browser.new_context(viewport={"width": 1280, "height": 960}, user_agent=DEFAULT_USER_AGENT, locale="ko-KR")
            await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            page = await context.new_page()

            test_item = {
                "id": args.card_id,
                "university": args.univ,
                "department": args.dept,
                "year": "2026",
                "category": "디자인·UX/UI",
                "target_url": args.target_url
            }

            status, updated = await process_university_card(page, test_item)
            print(f"[*] 단독 테스트 결과 상태: {status}", flush=True)
            if updated:
                print(f"[*] 수집된 작품 수: {len(updated.get('artworks', []))}점", flush=True)
                for a in updated.get("artworks", [])[:5]:
                    print(f"    - {a['title']} ({a['student_name']}) -> {a['thumbnail']}")

            await browser.close()
        return

    # 대기 큐 순차 처리 모드
    if not os.path.exists(QUEUE_FILE):
        print(f"[ERROR] 큐 파일 누락: {QUEUE_FILE}")
        return

    from research.storage_manager import (
        atomic_read_json,
        update_exhibition_card_delta,
        interprocess_file_lock
    )

    with interprocess_file_lock(QUEUE_FILE):
        queue = atomic_read_json(QUEUE_FILE)

    ALLOWED_CRAWLER_STATUSES = {"대기 중", "대기", "PENDING", "READY"}
    pending_items = []
    for q_item in queue:
        status = q_item.get("status", "")
        # Allowlist 기반 다운스트림 크롤러 실행: 허용된 상태만 실행 (검토 필요/보류/미검증 등 원천 차단)
        if status not in ALLOWED_CRAWLER_STATUSES:
            continue

        poster = q_item.get("poster_image")
        if status == "리서치 완료" and poster and os.path.exists(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", poster))):
            continue
        pending_items.append(q_item)

    print(f"==================================================", flush=True)
    print(f"[*] 대시보드 관제 마스터 에이전트 가동 (대기 큐: {len(pending_items)}건)", flush=True)
    print(f"[*] VLM 라우터 & List-Detail 크롤러 활성화", flush=True)
    print(f"==================================================", flush=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(viewport={"width": 1280, "height": 960}, user_agent=DEFAULT_USER_AGENT, locale="ko-KR")
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()

        for idx, item in enumerate(pending_items, start=1):
            status, updated = await process_university_card(page, item)

            try:
                # 동기화 경로 지정 및 델타 정밀 업데이트 (동시 등록된 타 카드 유실 방지)
                platform_queue = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "data", "university_queue.json"))
                sync_paths = [platform_queue] if os.path.exists(os.path.dirname(platform_queue)) else None
                
                delta_update = {"status": status}
                if updated:
                    for k in ["artworks", "poster_image", "scraped_url", "critic_feedback", "isUploaded"]:
                        if k in updated and updated[k] is not None:
                            delta_update[k] = updated[k]

                update_exhibition_card_delta(QUEUE_FILE, item["id"], delta_update, sync_paths=sync_paths)
                print(f"[*] [큐 델타 저장 완료] {item['id']} -> {status}", flush=True)
            except Exception as e:
                print(f"[WARN] 큐 저장 실패: {e}", flush=True)

            print("--------------------------------------------------", flush=True)
            await asyncio.sleep(1.5)

        await browser.close()

    print("[*] 전체 큐 순차 처리 완료.", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
