"""
scripts/test_kookmin_extractor.py
Tests extraction of all student artworks from https://expo.cs.kookmin.ac.kr/
"""

import re
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List

BASE_URL = "https://expo.cs.kookmin.ac.kr"

FIELD_MAP = {
    "M": "모바일",
    "A": "인공지능",
    "G": "게임",
    "W": "웹·소프트웨어",
    "S": "사회혁신",
    "R": "연구융합"
}

def fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        return resp.read().decode('utf-8', errors='replace')

def extract_kookmin_expo_artworks(target_url: str = BASE_URL) -> Dict[str, Any]:
    # 1. Fetch Landing page
    landing_html = fetch_html(target_url)
    
    # Extract main poster
    poster_match = re.search(r'href=["\'](/images/posters/[^"\']+)["\']', landing_html)
    poster_url = urllib.parse.urljoin(target_url, poster_match.group(1)) if poster_match else f"{BASE_URL}/images/posters/poster-2026.jpg"

    # 2. Check for subpages
    subpages = ["/capstone", "/aws-day"]
    
    all_artworks = []
    seen_team_nos = set()

    for sub in subpages:
        sub_url = urllib.parse.urljoin(target_url, sub)
        try:
            sub_html = fetch_html(sub_url)
            # Find script containing team-data
            # Look for <script[^>]*id=["\']team-data["\'][^>]*>(.*?)</script> or inline JSON with "team-01"
            json_matches = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', sub_html, re.DOTALL)
            for sc in json_matches:
                sc_clean = sc.strip()
                if sc_clean.startswith("{") and sc_clean.endswith("}") and "teamNo" in sc_clean:
                    try:
                        data = json.loads(sc_clean)
                        for team_key, t in data.items():
                            team_no = t.get("teamNo")
                            if team_no in seen_team_nos:
                                continue
                            seen_team_nos.add(team_no)

                            title = t.get("title", "").strip()
                            subtitle = t.get("subtitle", "").strip()
                            display_title = f"{title} - {subtitle}" if subtitle else title
                            
                            members = t.get("members", [])
                            author_names = ", ".join(m.get("name", "").strip() for m in members if m.get("name"))
                            if not author_names:
                                author_names = "국민대학교 소프트웨어융합대학 학생"

                            preview = t.get("preview", "")
                            full_img = urllib.parse.urljoin(target_url, preview) if preview else ""

                            field = t.get("field", "W")
                            field_name = FIELD_MAP.get(field, "소프트웨어")

                            present_day = t.get("presentDay", "capstone")
                            detail_url = f"{target_url.rstrip('/')}/{present_day}?team={str(team_no).padStart(2, '0') if hasattr(str(team_no), 'padStart') else str(team_no).zfill(2)}"

                            summary = t.get("summary", "").strip()

                            all_artworks.append({
                                "id": f"art-kmu-{str(team_no).zfill(2)}",
                                "project_title": display_title,
                                "title": display_title,
                                "author": author_names,
                                "student_name": author_names,
                                "role": f"{field_name} 크리에이터",
                                "imagePath": full_img,
                                "image": full_img,
                                "thumbnail": full_img,
                                "screenshot_path": full_img,
                                "description": summary or display_title,
                                "detail_url": detail_url,
                                "field": field_name,
                                "booth": t.get("booth", ""),
                                "advisor": t.get("advisor", "")
                            })
                    except Exception as e:
                        pass
        except Exception as e:
            print(f"[ERR] Failed subpage {sub_url}: {e}")

    return {
        "university": "국민대학교",
        "department": "소프트웨어융합대학",
        "year": "2026",
        "category": "IT·소프트웨어·컴공",
        "title": "[국민대학교] 2026 소프트웨어융합대학 졸업작품전시회 (KMUCS EXPO)",
        "slogan": "소프트웨어융합대학 졸업작품 전시회 및 잡페어",
        "period": "2026.05.26 - 2026.05.29",
        "venue": "국민대학교 미래관 자율주행스튜디오",
        "main_poster": poster_url,
        "artworks": all_artworks,
        "total_works": len(all_artworks)
    }

if __name__ == "__main__":
    result = extract_kookmin_expo_artworks()
    print(f"Total student artworks found: {result['total_works']}")
    for art in result["artworks"][:10]:
        print(f"  [{art['id']}] {art['title']} | 작가: {art['author']} | 이미지: {art['image']}")
    print(f"Main poster: {result['main_poster']}")
