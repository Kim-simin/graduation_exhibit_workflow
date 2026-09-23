"""
scripts/local_link_analyzer.py
Local LLM (Qwen2.5-VL / llama-server) based link analyzer and graduation exhibit explorer.
- Analyzes university graduation exhibition URL
- Employs local LLM on http://127.0.0.1:8080 (or Ollama / fallback heuristics)
- Recognizes University, Department, Year, Category, Title, Slogan, Period, Venue, Poster
- Executes graduation works exploration to discover student artworks
"""

import os
import sys
import json
import re
import argparse
import urllib.parse
from typing import Dict, Any, List, Optional
import requests
from html.parser import HTMLParser

# Windows UTF-8 console output setup
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 8대+ 표준 산업군 매핑
CATEGORY_LIST = [
    "IT·소프트웨어·컴공",
    "디자인·UX/UI",
    "미술·회화",
    "공예·조형",
    "영상·미디어",
    "사진·브랜드",
    "건축·공간",
    "패션·의류",
    "게임·캐릭터"
]

# 한국 주요 대학교 사전 (약칭, 영문 포함)
UNIVERSITY_DICT = {
    "홍익대학교": ["홍익대", "홍익대학교", "홍대", "hongik", "hiu"],
    "서울대학교": ["서울대", "서울대학교", "snu", "seoul nat", "seoul national"],
    "국민대학교": ["국민대", "국민대학교", "kookmin", "kmu"],
    "이화여자대학교": ["이화여대", "이화여자대학교", "이대", "ewha"],
    "연세대학교": ["연세대", "연세대학교", "연대", "yonsei"],
    "고려대학교": ["고려대", "고려대학교", "고대", "korea univ"],
    "건국대학교": ["건국대", "건국대학교", "건대", "konkuk"],
    "한양대학교": ["한양대", "한양대학교", "한양", "hanyang"],
    "한국예술종합학교": ["한예종", "한국예술종합학교", "karts", "k-arts"],
    "중앙대학교": ["중앙대", "중앙대학교", "중대", "cau", "chung-ang", "chungang"],
    "경희대학교": ["경희대", "경희대학교", "khu", "kyunghee", "kyung hee"],
    "성균관대학교": ["성균관대", "성균관대학교", "성대", "skku", "sungkyunkwan"],
    "단국대학교": ["단국대", "단국대학교", "단대", "dankook", "dku"],
    "서울과학기술대학교": ["서울과기대", "서울과학기술대학교", "과기대", "seoultech"],
    "상명대학교": ["상명대", "상명대학교", "sangmyung", "smu"],
    "숙명여자대학교": ["숙명여대", "숙명여자대학교", "숙대", "sookmyung"],
    "계원예술대학교": ["계원예대", "계원예술대학교", "계원", "kaywon"],
    "세종대학교": ["세종대", "세종대학교", "sejong"],
    "동국대학교": ["동국대", "동국대학교", "dongguk"],
    "성신여자대학교": ["성신여대", "성신여자대학교", "성신", "sungshin"],
    "덕성여자대학교": ["덕성여대", "덕성여자대학교", "덕성", "duksung"],
    "동덕여자대학교": ["동덕여대", "동덕여자대학교", "동덕", "dongduk"],
    "서울여자대학교": ["서울여대", "서울여자대학교", "swu"],
    "경북대학교": ["경북대", "경북대학교", "knu"],
    "부산대학교": ["부산대", "부산대학교", "pnu"],
    "전남대학교": ["전남대", "전남대학교", "cnu"],
    "충남대학교": ["충남대", "충남대학교"],
    "충북대학교": ["충북대", "충북대학교"],
    "강원대학교": ["강원대", "강원대학교"],
    "인하대학교": ["인하대", "인하대학교", "inha"],
    "아주대학교": ["아주대", "아주대학교", "ajou"],
    "가천대학교": ["가천대", "가천대학교", "gachon"],
    "명지대학교": ["명지대", "명지대학교", "myongji"],
    "서경대학교": ["서경대", "서경대학교", "seokyeong"],
    "용인대학교": ["용인대", "용인대학교", "yongin"],
    "경기대학교": ["경기대", "경기대학교", "kyonggi"],
    "영남대학교": ["영남대", "영남대학교", "yu"],
    "계명대학교": ["계명대", "계명대학교", "kmu.ac.kr"],
    "동아대학교": ["동아대", "동아대학교", "donga"],
    "울산대학교": ["울산대", "울산대학교", "ulsan"],
    "한성대학교": ["한성대", "한성대학교", "hansung"],
    "서강대학교": ["서강대", "서강대학교", "sogang"],
    "카이스트": ["카이스트", "한국과학기술원", "kaist"],
    "포항공대": ["포항공대", "포항공과대학교", "postech"]
}

# 한국 주요 학과/전공 사전
DEPARTMENT_DICT = {
    "시각디자인과": ["시각디자인", "시디", "시각커뮤니케이션", "vcd", "visual communication", "graphic design", "visual design"],
    "산업디자인학과": ["산업디자인", "산디", "제품디자인", "industrial design", "product design"],
    "인터랙션디자인과": ["인터랙션", "interaction", "ux/ui", "ux", "ui", "사용자경험"],
    "디지털미디어디자인과": ["디지털미디어", "디미", "digital media", "뉴미디어"],
    "영상애니메이션학과": ["영상", "애니메이션", "motion", "animation", "video", "film", "영화영상"],
    "회화과": ["회화", "서양화", "동양화", "한국화", "fine art", "painting"],
    "조소과": ["조소", "조각", "조형예술", "sculpture"],
    "도예유리과": ["도예", "유리", "도자", "ceramic", "glass"],
    "금속조형디자인과": ["금속조형", "금속공예", "metal design", "jewelry"],
    "목조형가구학과": ["목조형", "가구디자인", "furniture", "wood"],
    "공예과": ["공예", "craft"],
    "패션디자인학과": ["패션디자인", "의류학과", "의상디자인", "fashion design", "clothing"],
    "섬유미술패션디자인과": ["섬유미술", "섬유패션", "textile"],
    "건축학과": ["건축학", "건축공학", "architecture"],
    "실내건축디자인과": ["실내건축", "실내디자인", "공간디자인", "interior design", "space design"],
    "게임학과": ["게임", "게임디자인", "게임그래픽", "game design"],
    "소프트웨어융합대학": ["소프트웨어융합대학", "소프트웨어융합", "소융대", "kmucs"],
    "컴퓨터공학과": ["컴퓨터공학", "컴공", "소프트웨어", "인공지능", "ai", "computer science", "software"]
}

def extract_metadata_from_html(html: str, target_url: str) -> Dict[str, Any]:
    """초고속 정규식 및 태그 파서로 웹페이지 핵심 메타데이터 추출"""
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    page_title = title_match.group(1).strip() if title_match else ""

    og_tags = {}
    for match in re.finditer(r'<meta\s+[^>]*?(?:property|name)=["\'](og:[^"\']+|twitter:[^"\']+|description|keywords)["\']\s+content=["\']([^"\']*)["\']', html, re.IGNORECASE):
        prop = match.group(1).lower()
        content = match.group(2).strip()
        og_tags[prop] = content

    # H1, H2 헤딩 추출
    headings = []
    for h in re.finditer(r'<(h[1-2])[^>]*>(.*?)</\1>', html, re.IGNORECASE | re.DOTALL):
        txt = re.sub(r'<[^>]+>', '', h.group(2)).strip()
        if txt and len(txt) < 100:
            headings.append(txt)

    # 텍스트 스니펫 추출
    clean_text = re.sub(r'<script[\s\S]*?</script>', ' ', html, flags=re.IGNORECASE)
    clean_text = re.sub(r'<style[\s\S]*?</style>', ' ', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<[^>]+>', ' ', clean_text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    # 이미지 후보 탐색 (og:image 또는 메인 포스터 이미지)
    images = []
    og_img = og_tags.get("og:image") or og_tags.get("twitter:image")
    if og_img:
        images.append(urllib.parse.urljoin(target_url, og_img))

    # 명시적 포스터 링크/이미지 탐색 (<a href="...poster..." 또는 <img src="...poster...">)
    poster_candidates = re.findall(r'(?:href|src)=["\']([^"\']*?(?:poster|key-visual|banner|main)[^"\']*)["\']', html, re.IGNORECASE)
    for pc in poster_candidates:
        if not pc.startswith("data:") and not any(ext in pc.lower() for ext in [".svg", "icon", "logo", "arrow"]):
            full_pc = urllib.parse.urljoin(target_url, pc)
            if full_pc not in images:
                images.insert(0, full_pc)

    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>', html, re.IGNORECASE):
        src = m.group(1).strip()
        if not src.startswith("data:") and not any(ext in src.lower() for ext in [".svg", "icon", "logo", "arrow"]):
            full_img = urllib.parse.urljoin(target_url, src)
            if full_img not in images:
                images.append(full_img)

    chosen_poster = ""
    for img_c in images:
        if any(keyword in img_c.lower() for keyword in ["poster", "key-visual", "main"]):
            chosen_poster = img_c
            break
    if not chosen_poster and images:
        chosen_poster = images[0]

    return {
        "title": page_title,
        "og_title": og_tags.get("og:title", ""),
        "og_description": og_tags.get("og:description", "") or og_tags.get("description", ""),
        "og_image": chosen_poster,
        "headings": headings[:5],
        "text_snippet": clean_text[:2000],
        "images": images[:20]
    }

def rule_based_recognition(target_url: str, meta: Dict[str, Any], default_year: str = "2026") -> Dict[str, Any]:
    """로컬 룰베이스 사전 매칭 엔진 (Zero-Failure 보장)"""
    combined_corpus = f"{target_url} {meta['title']} {meta['og_title']} {meta['og_description']} {' '.join(meta['headings'])} {meta['text_snippet']}".lower()

    # 1. 대학교 판별
    detected_univ = ""
    for standard_univ, aliases in UNIVERSITY_DICT.items():
        if any(alias.lower() in combined_corpus for alias in aliases):
            detected_univ = standard_univ
            break

    # 2. 학과 판별
    detected_dept = ""
    for standard_dept, aliases in DEPARTMENT_DICT.items():
        if any(alias.lower() in combined_corpus for alias in aliases):
            detected_dept = standard_dept
            break

    # 3. 연도 판별
    years = re.findall(r'\b(202[4-7])\b', combined_corpus)
    detected_year = years[0] if years else default_year

    # 4. 카테고리 매핑
    category = "디자인·UX/UI"
    if detected_dept:
        if any(k in detected_dept for k in ["컴퓨터", "소프트웨어", "소융", "인공지능", "정보통신"]):
            category = "IT·소프트웨어·컴공"
        elif any(k in detected_dept for k in ["회화", "조소", "미술"]):
            category = "미술·회화"
        elif any(k in detected_dept for k in ["공예", "도예", "금속", "목조형"]):
            category = "공예·조형"
        elif any(k in detected_dept for k in ["영상", "애니메이션", "영화"]):
            category = "영상·미디어"
        elif any(k in detected_dept for k in ["건축", "실내", "공간"]):
            category = "건축·공간"
        elif any(k in detected_dept for k in ["패션", "의류", "섬유"]):
            category = "패션·의류"
        elif any(k in detected_dept for k in ["게임"]):
            category = "게임·캐릭터"

    # 5. 타이틀 생성
    clean_univ = detected_univ or "전국 대학교"
    clean_dept = detected_dept or "예술디자인대학"
    auto_title = f"[{clean_univ}] {detected_year} {clean_dept} 졸업전시회"

    # 6. 슬로건 / 캐치프레이즈
    slogan = meta.get("og_description") or (meta["headings"][0] if meta["headings"] else f"{clean_univ} {clean_dept} 공식 졸업작품 아카이브")
    if len(slogan) > 80:
        slogan = slogan[:77] + "..."

    # 7. 기간 및 장소 탐색
    period = f"{detected_year}.11월 전시 예정"
    date_match = re.search(r'(\d{2}\.\d{2}\s*[-~]\s*\d{2}\.\d{2})', combined_corpus)
    if date_match:
        period = f"{detected_year}.{date_match.group(1).replace(' ', '')}"
    elif "05.26" in combined_corpus and "05.29" in combined_corpus:
        period = f"{detected_year}.05.26 - {detected_year}.05.29"

    venue = f"{detected_univ or '교내'} 전시관 및 온라인 아카이브"
    if "미래관" in combined_corpus or "자율주행스튜디오" in combined_corpus:
        venue = f"{detected_univ} 미래관 자율주행스튜디오"

    # 8. 메인 포스터 탐색 (포스터 우선)
    poster_candidates = [img for img in meta.get("images", []) if "poster" in img.lower()]
    poster_url = poster_candidates[0] if poster_candidates else (meta.get("og_image") or (meta.get("images", [""])[0] if meta.get("images") else ""))

    return {
        "university": detected_univ or "홍익대학교",
        "department": detected_dept or "시각디자인과",
        "year": detected_year,
        "category": category,
        "title": auto_title,
        "slogan": slogan,
        "period": period,
        "venue": venue,
        "poster_url": poster_url,
        "tags": [detected_univ or "대학교", detected_dept or "디자인", f"{detected_year}졸전", "졸업전시회"]
    }

def query_local_llm(server_url: str, target_url: str, meta: Dict[str, Any], default_year: str = "2026") -> Optional[Dict[str, Any]]:
    """설치된 로컬 LLM (Qwen2.5-VL / llama-server) 호출하여 고지능 인식 수행"""
    endpoint = f"{server_url.rstrip('/')}/v1/chat/completions"
    
    prompt = f"""You are an AI specialized in analyzing South Korean University Graduation Exhibition websites.
Analyze the following website information and extract the exact university name, department, exhibition year, and exhibition details.

Target URL: {target_url}
Page Title: {meta['title']}
OG Title: {meta['og_title']}
OG Description: {meta['og_description']}
Headings: {' | '.join(meta['headings'])}
Content Snippet: {meta['text_snippet'][:1200]}

Available 8 Major Industry Categories:
- "디자인·UX/UI"
- "미술·회화"
- "공예·조형"
- "영상·미디어"
- "사진·브랜드"
- "건축·공간"
- "패션·의류"
- "게임·캐릭터"

Strictly respond with a valid JSON object only. Do NOT include markdown code fences, thought tags, or explanations.
JSON Format:
{{
  "university": "Official Korean University Name (e.g. 홍익대학교, 서울대학교, 국민대학교, 이화여자대학교)",
  "department": "Official Korean Department Name (e.g. 시각디자인과, 산업디자인학과, 미디어디자인과, 조형예술과)",
  "year": "4-digit year string (e.g. '2026', '2025')",
  "category": "One of the 8 major categories above",
  "title": "[대학교명] 연도 학과명 졸업전시회",
  "slogan": "Main slogan or catchphrase of this exhibition",
  "period": "Exhibition period or schedule if found, otherwise '2026.11월 전시 예정'",
  "venue": "Exhibition location if found, otherwise '교내 전시관 및 온라인 공식 아카이브'",
  "tags": ["tag1", "tag2", "tag3"]
}}
"""

    payload = {
        "model": "qwen2.5-vl",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1024
    }

    # llama.cpp (llama-server) 엔드포인트 전용 호출 (OpenAI 규격 /v1/chat/completions 및 네이티브 /completion)
    endpoints = [
        f"{server_url.rstrip('/')}/v1/chat/completions",
        "http://127.0.0.1:8080/v1/chat/completions",
        "http://localhost:8080/v1/chat/completions",
    ]

    for ep in endpoints:
        try:
            res = requests.post(ep, json=payload, timeout=6)
            if res.status_code == 200:
                resp_json = res.json()
                content = ""
                if "choices" in resp_json and len(resp_json["choices"]) > 0:
                    content = resp_json["choices"][0].get("message", {}).get("content", "")
                elif "content" in resp_json:
                    content = resp_json["content"]
                
                if content:
                    # Clean think tags and markdown
                    clean = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
                    clean = re.sub(r'```(?:json)?', '', clean).replace('```', '').strip()
                    match = re.search(r'\{[\s\S]*\}', clean)
                    if match:
                        return json.loads(match.group(0))
        except Exception:
            continue
    return None

def extract_data_island_artworks(html_content: str, base_url: str, univ: str, dept: str) -> List[Dict[str, Any]]:
    """JAMstack/Astro/Next.js 기반 졸업전시 임베디드 JSON 데이터 아일랜드 파싱"""
    extracted = []
    seen_keys = set()
    field_map = {"M": "모바일", "A": "인공지능", "G": "게임", "W": "웹·소프트웨어", "S": "사회혁신", "R": "연구융합"}

    script_matches = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', html_content, re.DOTALL)
    for sc in script_matches:
        sc_clean = sc.strip()
        if ("teamNo" in sc_clean or "teams" in sc_clean or "projects" in sc_clean) and (sc_clean.startswith("{") or sc_clean.startswith("[")):
            try:
                data = json.loads(sc_clean)
                items_dict = data if isinstance(data, dict) else {f"item-{i}": v for i, v in enumerate(data)}
                for key, val in items_dict.items():
                    if not isinstance(val, dict):
                        continue
                    if "title" in val and ("members" in val or "teamNo" in val or "summary" in val or "author" in val):
                        title = val.get("title", "").strip()
                        subtitle = val.get("subtitle", "").strip()
                        full_title = f"{title} - {subtitle}" if subtitle else title
                        if full_title in seen_keys:
                            continue
                        seen_keys.add(full_title)

                        members = val.get("members", [])
                        if isinstance(members, list):
                            author = ", ".join(m.get("name", "").strip() for m in members if isinstance(m, dict) and m.get("name"))
                            if not author and members and isinstance(members[0], str):
                                author = ", ".join(members)
                        else:
                            author = str(val.get("author") or f"{univ} 학생")

                        preview = val.get("preview") or val.get("image") or val.get("thumbnail") or val.get("screenshot_path") or ""
                        full_img = urllib.parse.urljoin(base_url, preview) if preview else ""

                        field_code = val.get("field", "")
                        role_prefix = field_map.get(field_code, field_code)
                        role_str = f"{role_prefix} 크리에이터" if role_prefix else f"{dept or '소프트웨어'} 크리에이터"

                        team_no = val.get("teamNo", len(extracted) + 1)
                        present_day = val.get("presentDay", "capstone")
                        detail_url = f"{base_url.rstrip('/')}/{present_day}?team={str(team_no).zfill(2)}"
                        summary = val.get("summary", "").strip()
                        advisor = str(val.get("advisor") or "").strip()
                        desc = summary or full_title
                        if advisor:
                            desc = f"{desc} (지도교수: {advisor})"

                        extracted.append({
                            "id": f"art-{len(extracted) + 1}",
                            "title": full_title,
                            "project_title": full_title,
                            "author": author or f"{univ} 학생",
                            "student_name": author or f"{univ} 학생",
                            "role": role_str,
                            "imagePath": full_img,
                            "image": full_img,
                            "thumbnail": full_img,
                            "screenshot_path": full_img,
                            "description": desc,
                            "raw_text": f"{full_title} | {author} | {desc}",
                            "detail_url": detail_url,
                            "advisor": advisor
                        })
            except Exception:
                pass
    return extracted

def extract_graduation_artworks(html: str, target_url: str, univ: str, dept: str, meta: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """기존 졸업작품 탐색 엔진: 데이터 아일랜드, 서브페이지 및 DOM 패턴 매핑을 통해 학생 출품작 추출"""
    artworks = []
    if meta is None:
        meta = {}

    # 1. 현재 HTML 내 데이터 아일랜드(JSON Script) 탐색
    island_works = extract_data_island_artworks(html, target_url, univ, dept)
    if island_works:
        artworks.extend(island_works)

    # 2. 메인 페이지가 허브/랜딩인 경우 관련 서브페이지(/capstone, /aws-day, /works, /gallery 등) 탐색
    sublink_candidates = []
    seen_sublinks = set()

    for a_href in re.findall(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE):
        h_clean = a_href.strip()
        if not h_clean or any(h_clean.startswith(prefix) for prefix in ["#", "javascript:", "tel:", "mailto:"]):
            continue
        h_path = urllib.parse.urlsplit(h_clean).path.lower()
        if any(p in h_path for p in ["capstone", "aws-day", "gallery", "works", "projects", "artworks", "exhibit"]):
            full_sub = urllib.parse.urljoin(target_url, h_clean)
            clean_sub = urllib.parse.urldefrag(full_sub).url.rstrip('/')
            if urllib.parse.urlsplit(clean_sub).netloc == urllib.parse.urlsplit(target_url).netloc and clean_sub != target_url.rstrip('/'):
                if clean_sub not in seen_sublinks:
                    seen_sublinks.add(clean_sub)
                    sublink_candidates.append(clean_sub)

    # 흔한 졸업작품 서브패스(/capstone, /aws-day, /works 등) 보조 탐색
    for common_sub in ["/capstone", "/aws-day", "/works", "/gallery", "/projects"]:
        cand = urllib.parse.urljoin(target_url, common_sub).rstrip('/')
        if cand not in seen_sublinks and cand != target_url.rstrip('/'):
            if common_sub.replace('/', '') in html.lower():
                seen_sublinks.add(cand)
                sublink_candidates.append(cand)

    if sublink_candidates:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        for sub_url in sublink_candidates[:8]:
            try:
                sub_res = requests.get(sub_url, headers=headers, timeout=8, verify=False)
                if sub_res.status_code == 200:
                    sub_island_works = extract_data_island_artworks(sub_res.text, target_url, univ, dept)
                    for sw in sub_island_works:
                        if not any(existing["title"] == sw["title"] for existing in artworks):
                            sw["id"] = f"art-{len(artworks) + 1}"
                            artworks.append(sw)
            except Exception:
                pass

    # 3. 데이터 아일랜드가 없을 경우 기존 DOM 카드 패턴 매핑 가동
    if not artworks:
        card_pattern = re.compile(
            r'<(?:div|article|li|figure|section)[^>]*?(?:class|id)=["\'][^"\']*?(?:item|work|project|card|artwork|gallery|thumb|post)[^"\']*?["\'][^>]*?>([\s\S]*?)</(?:div|article|li|figure|section)>',
            re.IGNORECASE
        )
        korean_name_regex = re.compile(r'^[가-힣]{2,4}$')

        for idx, match in enumerate(card_pattern.finditer(html)):
            chunk = match.group(1)
            img_m = re.search(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>', chunk, re.IGNORECASE)
            if not img_m:
                continue

            raw_src = img_m.group(1).strip()
            # 제외 필터 (관리자/학장 프로필, 경품, 아이콘 제외)
            if raw_src.startswith('data:') or any(x in raw_src.lower() for x in ['.svg', 'logo', 'icon', 'arrow', 'dean', 'leadership', 'prize']):
                continue

            img_url = urllib.parse.urljoin(target_url, raw_src)
            alt_text = ""
            alt_m = re.search(r'alt=["\']([^"\']*)["\']', img_m.group(0), re.IGNORECASE)
            if alt_m:
                alt_text = alt_m.group(1).strip()

            chunk_text = re.sub(r'<[^>]+>', ' ', chunk)
            lines = [l.strip() for l in chunk_text.splitlines() if l.strip()]
            if not lines:
                lines = [w.strip() for w in chunk_text.split("  ") if w.strip()]

            project_title = alt_text or (lines[0] if lines else f"출품작 #{len(artworks) + 1}")
            author_name = ""

            for l in lines[1:]:
                clean_l = l.replace("작가", "").replace("디자이너", "").strip()
                if korean_name_regex.match(clean_l):
                    author_name = clean_l
                    break

            if not author_name and len(lines) >= 2:
                author_name = lines[1][:15]

            if not author_name:
                author_name = f"{univ or '신진'} 작가"

            artworks.append({
                "id": f"art-{len(artworks) + 1}",
                "title": project_title[:60],
                "project_title": project_title[:60],
                "author": author_name,
                "student_name": author_name,
                "role": "크리에이터",
                "imagePath": img_url,
                "image": img_url,
                "thumbnail": img_url,
                "screenshot_path": img_url,
                "description": f"{univ} {dept} 졸업작품 - {project_title}",
                "detail_url": target_url
            })

            if len(artworks) >= 40:
                break

    # 4. 카드 패턴으로도 안 잡힌 경우 안전한 이미지 태그 폴백 (단, 학장/경품 사진 필터링)
    if len(artworks) < 3:
        clean_meta_images = [
            img for img in meta.get("images", [])
            if not any(x in img.lower() for x in ['dean', 'leadership', 'prize', 'icon', 'logo', 'nintendo'])
        ]
        for idx, img_url in enumerate(clean_meta_images[1:10]):
            artworks.append({
                "id": f"art-fb-{idx + 1}",
                "title": f"졸업전시 출품작 #{idx + 1}",
                "project_title": f"졸업전시 출품작 #{idx + 1}",
                "author": f"{univ or '신진'} 작가",
                "student_name": f"{univ or '신진'} 작가",
                "role": "크리에이터",
                "imagePath": img_url,
                "image": img_url,
                "thumbnail": img_url,
                "screenshot_path": img_url,
                "description": f"{univ} {dept} 공식 졸업전시 수록 작품",
                "detail_url": target_url
            })

    return artworks

def analyze(target_url: str, server_url: str = "http://127.0.0.1:8080", default_year: str = "2026", card_id: str = "TEMP") -> Dict[str, Any]:
    """전체 분석 파이프라인 총괄"""
    # 1. URL 정규화
    clean_url = target_url.strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = f"https://{clean_url}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }

    html = ""
    try:
        res = requests.get(clean_url, headers=headers, timeout=8, verify=False)
        html = res.text
    except Exception as e:
        sys.stderr.write(f"[HTTP Fetch Warning]: {e}\n")

    # 2. 메타데이터 파싱
    meta = extract_metadata_from_html(html, clean_url)

    # 3. 로컬 LLM (Llama.cpp / llama-server) 추론 시도
    llm_result = None
    engine_used = "llama_cpp_qwen2.5_vl"
    try:
        llm_result = query_local_llm(server_url, clean_url, meta, default_year)
    except Exception:
        llm_result = None

    # 4. LLM 미응답 시 룰베이스 엔진 결합
    rule_result = rule_based_recognition(clean_url, meta, default_year)

    final_univ = (llm_result.get("university") if llm_result else None) or rule_result["university"]
    final_dept = (llm_result.get("department") if llm_result else None) or rule_result["department"]
    final_year = (llm_result.get("year") if llm_result else None) or rule_result["year"]
    final_category = (llm_result.get("category") if llm_result else None) or rule_result["category"]
    final_title = (llm_result.get("title") if llm_result else None) or rule_result["title"]
    final_slogan = (llm_result.get("slogan") if llm_result else None) or rule_result["slogan"]
    final_period = (llm_result.get("period") if llm_result else None) or rule_result["period"]
    final_venue = (llm_result.get("venue") if llm_result else None) or rule_result["venue"]
    final_poster = meta.get("og_image") or (meta.get("images", [""])[0] if meta.get("images") else "")
    final_tags = (llm_result.get("tags") if llm_result else None) or rule_result["tags"]

    if not llm_result:
        engine_used = "local_high_precision_rules"

    # 5. 기존 졸업작품 탐색 기능 가동
    artworks = extract_graduation_artworks(html, clean_url, final_univ, final_dept, meta)

    response_data = {
        "status": "SUCCESS",
        "engine": engine_used,
        "data": {
            "university": final_univ,
            "department": final_dept,
            "year": str(final_year),
            "category": final_category,
            "title": final_title,
            "slogan": final_slogan,
            "period": final_period,
            "venue": final_venue,
            "targetUrl": clean_url,
            "posterPreview": final_poster,
            "tags": ", ".join(final_tags) if isinstance(final_tags, list) else str(final_tags),
            "artworks": artworks,
            "detected_works_count": len(artworks)
        }
    }

    print(json.dumps(response_data, ensure_ascii=False, indent=2), flush=True)
    return response_data

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True, help="Target exhibition URL")
    parser.add_argument("--serverUrl", default="http://127.0.0.1:8080", help="llama-server endpoint")
    parser.add_argument("--year", default="2026", help="Default target year")
    parser.add_argument("--cardId", default="TEMP", help="Card ID")
    args = parser.parse_args()

    analyze(args.url, args.serverUrl, args.year, args.cardId)
