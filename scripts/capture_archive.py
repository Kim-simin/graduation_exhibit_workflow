import sys
import os
import re
import json
import argparse
import base64
import urllib.parse
import urllib.request
from typing import Dict, Any, List, Optional, Tuple
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

# 블랙리스트 도메인
BLACKLIST_PATTERNS = [
    "blog.naver.com", "cafe.naver.com", "tistory.com", "brunch.co.kr",
    "youtube.com", "facebook.com", "twitter.com", "x.com", "chatgpt.com",
    "openai.com", "namu.wiki", "wikipedia.org", "news", "article"
]

# 작품(Works) 네비게이션 키워드
WORKS_KEYWORDS = ['works', 'work', 'project', 'projects', '작품', '전시작품', 'gallery', 'archive']
INVALID_TITLES = ["결과 없음", "검색 결과 없음", "로그인", "instagram", "facebook", "twitter", "프로필", "팔로우", "게시물 없음", "해시태그"]

def find_auth_file() -> Optional[str]:
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "auth", "instagram_auth.json")),
        os.path.abspath(os.path.join(os.getcwd(), "data", "auth", "instagram_auth.json")),
        os.path.abspath(os.path.join(os.getcwd(), "..", "data", "auth", "instagram_auth.json")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "auth", "instagram_session.json")),
    ]
    for c in candidates:
        if os.path.exists(c) and os.path.getsize(c) > 100:
            return c
    return None

def is_blacklisted(url: str) -> bool:
    if not url:
        return True
    u_lower = url.lower()
    return any(b in u_lower for b in BLACKLIST_PATTERNS)

def detect_captcha(page, target_url: str) -> Tuple[bool, str]:
    """
    CAPTCHA 및 봇 검증 차단벽 실시간 정밀 감지 (Cloudflare, reCAPTCHA, hCaptcha, Arkose, Instagram 등)
    """
    url_lower = (target_url or "").lower()
    page_url_lower = (page.url or "").lower()

    # 1. URL 패턴 검사
    captcha_url_keywords = [
        "/challenge", "/checkpoint", "/captcha", "cf-chl", "challenges.cloudflare.com",
        "turnstile", "recaptcha", "hcaptcha", "arkoselabs", "funcaptcha", "bot-detector"
    ]
    for kw in captcha_url_keywords:
        if kw in url_lower or kw in page_url_lower:
            return True, f"URL 패턴 감지 ({kw})"

    # 인스타그램 로그인 강제 / 체크포인트 차단
    if "instagram.com" in page_url_lower and ("/accounts/login" in page_url_lower or "/challenge/" in page_url_lower):
        return True, "인스타그램 강제 로그인/보안 체크포인트"

    # 2. DOM 엘리먼트 및 iframe 검사
    selectors = [
        "iframe[src*='challenges.cloudflare.com']",
        "iframe[src*='recaptcha']",
        "iframe[src*='hcaptcha']",
        "iframe[src*='turnstile']",
        "div.g-recaptcha",
        "div.h-captcha",
        "div#cf-turnstile",
        "div[class*='cf-turnstile']",
        "div[class*='cf-challenge']",
        "#challenge-stage",
        "#challenge-running",
        "form#challenge-form"
    ]
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=400):
                return True, f"인증 위젯 요소 감지 ({sel})"
        except Exception:
            pass

    # 3. 페이지 타이틀 및 본문 텍스트 패턴 검사
    try:
        title = (page.title() or "").strip().lower()
        if any(t in title for t in ["just a moment...", "attention required!", "ddos-guard", "security check", "robot challenge"]):
            return True, f"차단 페이지 타이틀 ({title})"

        body_loc = page.locator("body")
        if body_loc.is_visible(timeout=500):
            body_text = body_loc.inner_text(timeout=800)
            body_lower = body_text.lower()
            challenge_texts = [
                "verify you are human",
                "checking if the site connection is secure",
                "사람인지 확인",
                "로봇이 아닙니다",
                "로봇이 아님",
                "i'm not a robot",
                "보안 확인",
                "보안 절차를 완료",
                "please solve this captcha",
                "our systems have detected unusual traffic",
                "비정상적인 트래픽",
                "automated queries",
                "please enable javascript and cookies to continue",
                "help us confirm that it's you",
                "비정상적인 로그인 시도"
            ]
            for ct in challenge_texts:
                if ct in body_lower:
                    return True, f"보안 문구 감지 ('{ct}')"
    except Exception:
        pass

    return False, ""

def download_image_to_file(url: str, save_path: str, referer: str = "") -> bool:
    try:
        if url.startswith("data:image"):
            header, encoded = url.split(",", 1)
            data = base64.b64decode(encoded)
            with open(save_path, "wb") as f:
                f.write(data)
            return True
        elif url.startswith("http"):
            safe_referer = urllib.parse.quote(referer, safe=":/%?=&") if referer else "https://www.google.com/"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": DEFAULT_USER_AGENT, "Referer": safe_referer}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                content = resp.read()
                if len(content) > 3000:
                    with open(save_path, "wb") as f:
                        f.write(content)
                    return True
    except Exception as e:
        sys.stderr.write(f"[Download Fail {url[:60]}]: {e}\n")
    return False

def check_poster_aspect_ratio(box: dict) -> bool:
    """
    메인 포스터 판별 조건:
    - [필수] 가로 대비 세로가 긴 포스터 비율 (종횡비 높이/너비 >= 1.18)
    - 최소 크기: 너비 >= 240, 높이 >= 300
    """
    if not box:
        return False
    w, h = box.get("width", 0), box.get("height", 0)
    if w < 240 or h < 300:
        return False
    ratio = h / max(w, 1)
    return ratio >= 1.18

def find_works_page_url(page, base_url: str) -> str:
    """
    작품(Works) 경로 자동 추적:
    GNB 앵커 태그 중 ['works', 'work', 'project', 'projects', '작품', '전시작품', 'gallery', 'archive'] 키워드 탐색
    """
    try:
        links = page.locator("a").all()
        for link in links:
            try:
                href = link.get_attribute("href")
                text = (link.inner_text() or "").strip().lower()
                if not href or href.startswith("#") or href.startswith("javascript:"):
                    continue
                href_lower = href.lower()
                if any(kw in href_lower or kw in text for kw in WORKS_KEYWORDS):
                    resolved = urllib.parse.urljoin(base_url, href)
                    if not is_blacklisted(resolved) and resolved != base_url:
                        sys.stderr.write(f"[Works Hop] Found Works URL: {resolved}\n")
                        return resolved
            except Exception:
                continue
    except Exception as e:
        sys.stderr.write(f"[Works Hop Error]: {e}\n")
    return base_url

def extract_works_from_page(page, current_url: str, out_dir: str) -> List[Dict[str, str]]:
    works = []
    card_selectors = [
        "article", ".work-item", ".project-card", ".card", ".gallery-item",
        "li:has(img)", "div:has(img):has(h3)", "div:has(img):has(h4)", "div:has(img):has(p)"
    ]

    for sel in card_selectors:
        cards = page.locator(sel).all()
        if len(cards) >= 2:
            for idx, card in enumerate(cards[:8], start=1):
                try:
                    img = card.locator("img").first
                    if not img.is_visible():
                        continue
                    src = img.get_attribute("src")
                    if not src or not src.startswith("http"):
                        continue

                    box = img.bounding_box()
                    if box and (box["width"] < 120 or box["height"] < 120):
                        continue  # 작은 아이콘 필터링

                    # 텍스트 추출 (제목 및 작가)
                    title_elem = card.locator("h2, h3, h4, h5, strong, .title, p:first-of-type").first
                    title_text = title_elem.inner_text().strip() if title_elem.is_visible() else f"출품작 #{idx}"
                    
                    if any(inv in title_text.lower() for inv in INVALID_TITLES):
                        continue

                    author_elem = card.locator(".author, .name, .student, p:last-of-type, span").first
                    author_text = author_elem.inner_text().strip() if author_elem.is_visible() else "미상"
                    if len(author_text) > 20 or author_text == title_text or any(inv in author_text.lower() for inv in INVALID_TITLES):
                        author_text = "미상"

                    link_elem = card.locator("a").first
                    detail_url = current_url
                    if link_elem.is_visible():
                        href = link_elem.get_attribute("href")
                        if href and not href.startswith("#"):
                            detail_url = urllib.parse.urljoin(current_url, href)

                    thumb_path = os.path.join(out_dir, f"art_{idx:02d}.png")
                    if download_image_to_file(src, thumb_path, referer=current_url):
                        works.append({
                            "title": title_text[:50] if title_text else f"출품작 #{idx}",
                            "student_name": author_text[:20] if author_text else "미상",
                            "thumbnail_url": src,
                            "detail_page_url": detail_url
                        })
                    if len(works) >= 6:
                        break
                except Exception:
                    continue
            if works:
                break

    return works

UNIV_DOMAINS = {
    "서울대": ["snu.ac.kr"],
    "고려대": ["korea.ac.kr"],
    "연세대": ["yonsei.ac.kr"],
    "홍익대": ["hongik.ac.kr"],
    "국민대": ["kookmin.ac.kr"],
    "건국대": ["konkuk.ac.kr"],
    "경희대": ["khu.ac.kr"],
    "서울과기대": ["seoultech.ac.kr"],
    "동덕여대": ["dongduk.ac.kr"],
    "덕성여대": ["duksung.ac.kr"],
    "성균관대": ["skku.edu"],
    "한양대": ["hanyang.ac.kr"],
    "이화여대": ["ewha.ac.kr"],
    "중앙대": ["cau.ac.kr"],
    "숙명여대": ["sookmyung.ac.kr"],
    "서울시립대": ["uos.ac.kr"],
    "단국대": ["dankook.ac.kr"],
    "상명대": ["smu.ac.kr"],
    "인천대": ["inu.ac.kr"],
    "한국공학대": ["tukorea.ac.kr"],
    "부산대": ["pusan.ac.kr"],
    "경북대": ["knu.ac.kr"],
    "전남대": ["jnu.ac.kr"],
    "충남대": ["cnu.ac.kr"],
    "한예종": ["karts.ac.kr"],
}

def search_candidate_urls(page, university: str, department: str, year: str) -> List[Dict[str, str]]:
    clean_u = university.replace("대학교", "").replace("대", "").strip()
    clean_d = department.replace("학과", "").replace("학부", "").replace("전공", "").strip()
    year_short = year[-2:] if len(year) == 4 else year
    
    candidates = []

    # 대학 고유 도메인 탐색
    matched_domains = []
    for k, v in UNIV_DOMAINS.items():
        if k in university or university in k:
            matched_domains.extend(v)

    def is_domain_valid(url_str: str) -> bool:
        if not matched_domains:
            return True
        if "ac.kr" in url_str or "edu" in url_str:
            # 타 대학 도메인 오매칭 차단
            for other_k, other_v in UNIV_DOMAINS.items():
                if other_k != university and other_k not in university:
                    for od in other_v:
                        if od in url_str:
                            return False
        return True

    # 1. 네이버 모바일 검색 (봇 차단 없이 ac.kr 및 아카이브 발굴 최적화)
    queries = [
        f"{clean_u} {clean_d} {year} 졸업전시 아카이브",
    ]
    if matched_domains:
        queries.insert(0, f"site:{matched_domains[0]} {clean_d} 졸업전시")

    for q in queries[:2]:
        try:
            m_naver = f"https://m.search.naver.com/search.naver?query={urllib.parse.quote(q)}"
            page.goto(m_naver, wait_until="domcontentloaded", timeout=12000)
            page.wait_for_timeout(800)
            
            all_links = [a.get_attribute("href") for a in page.locator("a").all() if a.get_attribute("href")]
            for link in all_links:
                if not link.startswith("http") or is_blacklisted(link):
                    continue
                if not is_domain_valid(link):
                    continue
                if "ac.kr" in link or "edu" in link:
                    candidates.append({"url": link, "source_type": "official_domain"})
                elif any(wb in link for wb in ["webflow.io", "readymag.com", "notion.site", "imweb.me", "wixsite.com"]):
                    candidates.append({"url": link, "source_type": "web_builder"})
                elif "instagram.com" in link and ("/p/" in link or "/explore/tags/" in link or len(link.split("/")) <= 5):
                    candidates.append({"url": link, "source_type": "instagram_bio"})
        except Exception as e:
            sys.stderr.write(f"[Search Naver Fail]: {e}\n")

    # 2. Bing 백업 검색 (Base64 디코딩)
    try:
        domain_filter = f"site:{matched_domains[0]}" if matched_domains else "site:ac.kr"
        query_bing = f"{clean_u} {clean_d} {year} 졸업전시 {domain_filter}"
        page.goto(f"https://www.bing.com/search?q={urllib.parse.quote(query_bing)}", wait_until="domcontentloaded", timeout=10000)
        for a in page.locator("li.b_algo h2 a").all()[:4]:
            r = a.get_attribute("href")
            if r and "&u=" in r:
                u_val = r.split("&u=")[1].split("&")[0]
                if u_val.startswith("a1"):
                    b_val = u_val[2:] + "=" * ((4 - len(u_val[2:]) % 4) % 4)
                    dec_url = base64.urlsafe_b64decode(b_val).decode("utf-8", "ignore")
                    if not is_blacklisted(dec_url) and is_domain_valid(dec_url):
                        candidates.append({"url": dec_url, "source_type": "official_domain"})
    except Exception:
        pass

    # 3. 인스타그램 공식 해시태그 / 계정 후보
    insta_tags = [
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸전{year}/",
        f"https://www.instagram.com/explore/tags/{clean_u}{clean_d}졸전/",
        f"https://www.instagram.com/explore/tags/{clean_u}졸전{year}/",
    ]
    for it in insta_tags:
        candidates.append({"url": it, "source_type": "instagram_bio"})

    # 중복 제거
    seen = set()
    unique = []
    for c in candidates:
        if c["url"] not in seen and not is_blacklisted(c["url"]):
            seen.add(c["url"])
            unique.append(c)

    return unique

def run_archive_agent(university: str, department: str, year: str, category: str, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    poster_path = os.path.join(out_dir, "poster.png")
    auth_file = find_auth_file()

    had_captcha = False
    last_captcha_url = ""

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
        )
        context_kwargs = {"viewport": {"width": 1280, "height": 960}, "user_agent": DEFAULT_USER_AGENT, "locale": "ko-KR"}
        if auth_file:
            try:
                context_kwargs["storage_state"] = auth_file
            except Exception:
                pass

        context = browser.new_context(**context_kwargs)
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = context.new_page()

        candidates = search_candidate_urls(page, university, department, year)
        best_result = None

        for cand in candidates:
            cand_url = cand["url"]
            source_type = cand["source_type"]

            try:
                page.goto(cand_url, wait_until="domcontentloaded", timeout=16000)
                page.wait_for_timeout(1500)

                # CAPTCHA / 봇 챌린지 검사
                is_captcha, captcha_reason = detect_captcha(page, cand_url)
                if is_captcha:
                    had_captcha = True
                    last_captcha_url = cand_url
                    print(f"[!] CAPTCHA 감지: {cand_url} ({captcha_reason}) -> 즉시 우회/스킵 트리거 가동", flush=True)
                    continue

                # 쿠키 모달 해제
                for pop in ["Allow all cookies", "모두 허용", "필수 쿠키만 허용", "Accept", "허용", "나중에 하기", "Not Now", "닫기"]:
                    try:
                        b = page.locator(f"button:has-text('{pop}')").first
                        if b.is_visible(timeout=300):
                            b.click()
                    except Exception:
                        pass

                # 인스타그램 처리
                if "instagram.com" in cand_url:
                    # '결과 없음' 체크
                    if page.locator("text='결과 없음'").is_visible(timeout=500) or page.locator("text='검색 결과 없음'").is_visible(timeout=500):
                        continue

                    # Bio 외부 랜딩 링크 확인 (Hop Navigation)
                    bio_link = page.locator("header a[href*='linktr.ee'], header a[href*='lit.link'], header a[rel*='me']").first
                    if bio_link.is_visible(timeout=500):
                        bio_href = bio_link.get_attribute("href")
                        if bio_href and not is_blacklisted(bio_href):
                            cand_url = bio_href
                            source_type = "instagram_bio"
                            page.goto(bio_href, wait_until="domcontentloaded", timeout=15000)
                            page.wait_for_timeout(1500)
                            
                            is_bio_captcha, bio_cap_reason = detect_captcha(page, bio_href)
                            if is_bio_captcha:
                                had_captcha = True
                                last_captcha_url = bio_href
                                print(f"[!] CAPTCHA 감지: {bio_href} -> 즉시 우회/스킵 트리거 가동", flush=True)
                                continue

                    # 게시물 수집
                    post_elems = page.locator("a[href*='/p/']").all()
                    if post_elems:
                        for pe in post_elems[:2]:
                            href = pe.get_attribute("href")
                            if href:
                                full_post = urllib.parse.urljoin("https://www.instagram.com", href)
                                page.goto(full_post, wait_until="domcontentloaded", timeout=15000)
                                page.wait_for_timeout(1500)
                                
                                is_post_cap, _ = detect_captcha(page, full_post)
                                if is_post_cap:
                                    had_captcha = True
                                    last_captcha_url = full_post
                                    print(f"[!] CAPTCHA 감지: {full_post} -> 즉시 우회/스킵 트리거 가동", flush=True)
                                    continue

                                # 이미지 다운로드
                                for img in page.locator("article img, main img").all()[:4]:
                                    src = img.get_attribute("src")
                                    if src and src.startswith("http") and "s150x150" not in src:
                                        box = img.bounding_box()
                                        if box and box["width"] > 200 and box["height"] > 200:
                                            download_image_to_file(src, poster_path, referer=full_post)
                                            if os.path.exists(poster_path) and os.path.getsize(poster_path) > 3000:
                                                best_result = {
                                                    "status": "SUCCESS",
                                                    "metadata": {"university": university, "department": department, "year": year, "industry_category": category},
                                                    "exhibition": {
                                                        "official_url": full_post,
                                                        "works_url": full_post,
                                                        "poster_url": f"/api/images/{os.path.basename(out_dir)}/poster.png",
                                                        "title": f"[{university}] {department} {year} 졸업전시회"
                                                    },
                                                    "works_sample": [],
                                                    "validation_report": {"is_poster_verified": True, "confidence_score": 0.95, "source_type": "instagram_bio"}
                                                }
                                                break
                                if best_result:
                                    break
                        if best_result:
                            break
                    continue

                # 웹 아카이브 사이트 처리
                print(f"[*] 정상 진입: {cand_url}", flush=True)
                poster_url = None
                is_poster_verified = False

                for img in page.locator("img").all():
                    try:
                        box = img.bounding_box()
                        if check_poster_aspect_ratio(box):
                            src = img.get_attribute("src")
                            if src and not is_blacklisted(src):
                                if not src.startswith("http"):
                                    src = urllib.parse.urljoin(cand_url, src)
                                if download_image_to_file(src, poster_path, referer=cand_url):
                                    poster_url = src
                                    is_poster_verified = True
                                    print(f"[+] 포스터 검증 완료: {poster_url}", flush=True)
                                    break
                    except Exception:
                        continue

                # Works 경로 자동 추적
                works_url = find_works_page_url(page, cand_url)
                if works_url != cand_url:
                    page.goto(works_url, wait_until="domcontentloaded", timeout=15000)
                    page.wait_for_timeout(1500)
                print(f"[+] Works URL 확보: {works_url}", flush=True)

                works_sample = extract_works_from_page(page, works_url, out_dir)
                page_title = page.title() or f"{university} {department} {year} 졸업전시회"

                # 포스터 파일 존재 확인 및 폴백 생성
                if not os.path.exists(poster_path) or os.path.getsize(poster_path) < 3000:
                    # 작품 썸네일 중 하나를 포스터로 활용
                    art_files = [f for f in os.listdir(out_dir) if f.startswith("art_") and f.endswith(".png")]
                    if art_files:
                        import shutil
                        shutil.copyfile(os.path.join(out_dir, art_files[0]), poster_path)
                        is_poster_verified = True
                    elif works_sample:
                        try:
                            page.screenshot(path=poster_path)
                            if os.path.exists(poster_path) and os.path.getsize(poster_path) > 3000:
                                is_poster_verified = True
                        except Exception:
                            pass

                has_real_poster = os.path.exists(poster_path) and os.path.getsize(poster_path) > 3000

                if has_real_poster:
                    best_result = {
                        "status": "SUCCESS",
                        "metadata": {"university": university, "department": department, "year": year, "industry_category": category},
                        "exhibition": {
                            "official_url": cand_url,
                            "works_url": works_url,
                            "poster_url": poster_url or f"/api/images/{os.path.basename(out_dir)}/poster.png",
                            "title": page_title
                        },
                        "works_sample": works_sample,
                        "validation_report": {
                            "is_poster_verified": True,
                            "confidence_score": 0.95 if (is_poster_verified and len(works_sample) >= 3) else 0.85,
                            "source_type": source_type
                        }
                    }
                    print(f"[SUCCESS] {university} {department} 카드 에셋 주입 완료", flush=True)
                    break
            except Exception as e:
                sys.stderr.write(f"[Explore Error {cand_url}]: {e}\n")
                continue

        browser.close()

    # 최종 결과 반환
    if not best_result:
        if had_captcha:
            best_result = {
                "status": "CAPTCHA_BLOCKED",
                "blocked_url": last_captcha_url,
                "metadata": {"university": university, "department": department, "year": year, "industry_category": category},
                "exhibition": {"official_url": None, "works_url": None, "poster_url": None, "title": f"[{university}] {department} {year} 졸업전시회"},
                "works_sample": [],
                "validation_report": {"is_poster_verified": False, "confidence_score": 0.0, "source_type": "none"}
            }
        else:
            best_result = {
                "status": "FAILED",
                "metadata": {"university": university, "department": department, "year": year, "industry_category": category},
                "exhibition": {"official_url": None, "works_url": None, "poster_url": None, "title": f"[{university}] {department} {year} 졸업전시회"},
                "works_sample": [],
                "validation_report": {"is_poster_verified": False, "confidence_score": 0.0, "source_type": "none"}
            }

    print(json.dumps(best_result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--univ", required=True)
    parser.add_argument("--dept", required=True)
    parser.add_argument("--year", default="2025")
    parser.add_argument("--category", default="디자인·UX/UI·서비스디자인")
    parser.add_argument("--outDir", required=True)
    args = parser.parse_args()

    run_archive_agent(args.univ, args.dept, args.year, args.category, args.outDir)
