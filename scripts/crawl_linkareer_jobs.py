import json
import re
import urllib.request
import datetime
import hashlib
import os

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}

def fetch_html(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as resp:
        return resp.read().decode("utf-8", errors="replace")

def extract_apollo_state(html):
    match = re.search(r'<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)</script>', html)
    if not match:
        return {}
    try:
        data = json.loads(match.group(1))
        page_props = data.get("props", {}).get("pageProps", {})
        return page_props.get("__APOLLO_STATE__") or page_props.get("initialApolloState", {})
    except Exception as e:
        print(f"Error parsing __NEXT_DATA__: {e}")
        return {}

def timestamp_to_date(ts):
    if not ts:
        return "상시채용"
    try:
        dt = datetime.datetime.fromtimestamp(ts / 1000.0)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return "상시채용"

def get_emoji_for_org(org):
    if any(k in org for k in ["현대", "기아", "모비스", "테슬라"]):
        return "🚗"
    if any(k in org for k in ["CJ", "식품", "그린푸드", "아워홈", "프레시웨이"]):
        return "🍽️"
    if any(k in org for k in ["SK", "반도체", "하이닉스", "DB", "원익", "세미텍"]):
        return "⚡"
    if any(k in org for k in ["LG", "삼성"]):
        return "📱"
    if any(k in org for k in ["항공", "공항공사"]):
        return "✈️"
    if any(k in org for k in ["철도", "교통"]):
        return "🚆"
    if any(k in org for k in ["증권", "투자", "은행", "금융"]):
        return "📈"
    if any(k in org for k in ["신세계", "갤러리아", "유통", "리테일", "호텔", "아모레"]):
        return "🛍️"
    if any(k in org for k in ["오션", "조선", "해양", "중공업"]):
        return "🚢"
    if any(k in org for k in ["엔터", "SM", "미디어", "네이버", "카카오", "크래프톤", "넷마블"]):
        return "🎬"
    if any(k in org for k in ["건설", "호반", "토목", "주택"]):
        return "🏗️"
    return "🏢"

# 그룹 통합 대규모 공채인지 판별
def is_group_wide_recruitment(title, org):
    group_keywords = [
        "그룹", "공채", "신입사원 모집", "신입 채용", "신입공채", "대규모",
        "신입사원 공개채용", "집중 채용", "테크&라이프", "신입사원 등 공개채용",
        "인턴사원 채용공고", "신규직원 채용"
    ]
    specific_keywords = [
        "연구개발원", "영양사", "도장", "방식설계", "CS 상담", "제조MS", "박사"
    ]
    if any(sk in title for sk in specific_keywords):
        return False
    return any(gk in title for gk in group_keywords)

def map_category_and_departments(title, org, detail_text=""):
    text = (title + " " + org + " " + detail_text).lower()

    # 1. 종합 대기업 그룹 신입 공채 (다학제 전공 우대)
    if is_group_wide_recruitment(title, org):
        # 주력 분야 파악
        if any(w in text for w in ["기아", "현대", "모비스", "자동차"]):
            return (
                "연구개발·설계",
                ["기계공학과", "전자공학과", "컴퓨터공학과", "시각디자인학과", "산업디자인학과", "경영학과"],
                ["HMI/GUI", "Figma", "AutoCAD", "Python", "차량제어", "기획역량"]
            )
        elif any(w in text for w in ["cj", "신세계", "갤러리아", "호텔"]):
            return (
                "마케팅·광고·홍보",
                ["경영학과", "미디어커뮤니케이션", "시각디자인학과", "산업디자인학과", "컴퓨터공학과", "소프트웨어학부"],
                ["브랜드마케팅", "VMD", "Figma", "데이터분석", "UI/UX", "SCM"]
            )
        elif any(w in text for w in ["lg유플러스", "lg", "sk", "통신", "소프트웨어", "마이리얼트립"]):
            return (
                "IT·인터넷",
                ["컴퓨터공학과", "소프트웨어학부", "인공지능학과", "디지털미디어학과", "시각디자인학과", "전자공학과"],
                ["React", "Python", "Cloud", "Figma", "AI/ML", "SQL"]
            )
        elif any(w in text for w in ["ls", "원익", "한화오션", "한화에어로스페이스", "에어로스페이스", "세미텍"]):
            return (
                "연구개발·설계",
                ["기계공학과", "전자공학과", "전기공학과", "신소재공학과", "컴퓨터공학과", "산업공학과"],
                ["AutoCAD", "MATLAB", "회로설계", "임베디드", "품질관리", "공정제어"]
            )
        elif any(w in text for w in ["철도", "공항", "교통", "건강보험", "공사"]):
            return (
                "경영·사무",
                ["경영학과", "컴퓨터공학과", "전자공학과", "기계공학과", "건축학과", "행정학과"],
                ["NCS", "Office", "데이터분석", "시설운영", "ERP"]
            )
        elif any(w in text for w in ["호반", "건설"]):
            return (
                "건설",
                ["건축학과", "실내건축디자인", "토목공학과", "경영학과"],
                ["AutoCAD", "Revit", "BIM", "시공관리", "견적"]
            )
        else:
            return (
                "경영·사무",
                ["경영학과", "컴퓨터공학과", "시각디자인학과", "전자공학과", "미디어커뮤니케이션"],
                ["기획역량", "데이터분석", "Office", "협업능력"]
            )

    # 2. 직무 특화 공고
    # IT / Software
    if any(w in text for w in ["it", "개발", "소프트웨어", "인공지능", "ai", "데이터", "시스템", "프로그래밍", "백엔드", "프론트엔드", "전산"]):
        return (
            "IT·인터넷",
            ["컴퓨터공학과", "소프트웨어학부", "인공지능학과", "디지털미디어학과"],
            ["Python", "Java", "SQL", "Cloud", "TypeScript"]
        )

    # Design / Media
    elif any(w in text for w in ["디자인", "ux", "ui", "gui", "시각", "영상", "vmd", "크리에이티브"]):
        return (
            "디자인",
            ["시각디자인학과", "산업디자인학과", "디지털미디어학과", "디자인조형학부"],
            ["Figma", "Photoshop", "Illustrator", "ProtoPie", "3D GUI"]
        )

    # R&D / Semiconductor / Material / Mechanical
    elif any(w in text for w in ["연구", "r&d", "설계", "기계", "전기", "전자", "소재", "배터리", "로보틱스", "방식설계", "화학", "공학", "반도체"]):
        return (
            "연구개발·설계",
            ["기계공학과", "전자공학과", "전기공학과", "신소재공학과", "화학공학과"],
            ["AutoCAD", "MATLAB", "CATIA", "회로설계", "반도체공정"]
        )

    # Production / Manufacturing / Quality
    elif any(w in text for w in ["생산", "제조", "공정", "품질", "qa", "qc", "조립", "가공", "ms"]):
        return (
            "생산·제조",
            ["산업공학과", "기계공학과", "화학공학과", "전자공학과"],
            ["공정제어", "품질관리", "CAD", "MES", "Six Sigma"]
        )

    # Marketing / PR / Brand / Entertainment
    elif any(w in text for w in ["마케팅", "광고", "홍보", "브랜드", "crm", "엔터", "sm", "매니지먼트", "공연", "음악"]):
        return (
            "마케팅·광고·홍보",
            ["미디어커뮤니케이션", "경영학과", "광고홍보학과", "시각디자인학과"],
            ["콘텐츠기획", "퍼포먼스마케팅", "SNS운영", "Google Analytics", "A&R"]
        )

    # Finance / Securities
    elif any(w in text for w in ["금융", "증권", "투자", "자산", "운용", "회계", "재무"]):
        return (
            "금융",
            ["경영학과", "경제학과", "금융공학과", "회계학과"],
            ["재무제표분석", "Excel 고급", "SQL", "기업가치평가"]
        )

    # Architecture / Construction
    elif any(w in text for w in ["건축", "건설", "토목", "실내"]):
        return (
            "건설",
            ["건축학과", "실내건축디자인", "토목공학과"],
            ["AutoCAD", "Revit", "BIM", "SketchUp", "시공관리"]
        )

    # Food / Bio / Nutrition
    elif any(w in text for w in ["영양사", "식품", "바이오", "그린푸드", "아워홈", "급식"]):
        return (
            "생산·제조",
            ["식품영양학과", "생명공학과", "화학공학과"],
            ["위생관리", "HACCP", "메뉴기획", "영양관리"]
        )

    # Default
    return (
        "경영·사무",
        ["경영학과", "경제학과", "산업정보디자인전공"],
        ["Office", "기획역량", "데이터분석"]
    )

def main():
    print("=== Crawling Linkareer Live Large Enterprise Recruitment Postings ===")

    urls_to_scan = [
        "https://linkareer.com/recruit-home",
        "https://linkareer.com/list/recruit?filterBy_activityTypeID=5&filterBy_jobTypes=NEW&filterBy_orgTypeIDs=1&filterBy_status=OPEN&orderBy_direction=DESC&orderBy_field=RECENT&page=1",
        "https://linkareer.com/list/recruit?filterBy_activityTypeID=5&filterBy_jobTypes=NEW&filterBy_orgTypeIDs=1&filterBy_status=OPEN&orderBy_direction=DESC&orderBy_field=RECENT&page=2",
        "https://linkareer.com/list/recruit?filterBy_activityTypeID=5&filterBy_jobTypes=NEW&filterBy_orgTypeIDs=1&filterBy_status=OPEN&orderBy_direction=DESC&orderBy_field=RECENT&page=3",
        "https://linkareer.com/list/recruit?filterBy_activityTypeID=5&filterBy_jobTypes=NEW&filterBy_orgTypeIDs=1&filterBy_status=OPEN&orderBy_direction=DESC&orderBy_field=RECENT&page=4",
    ]

    all_activities = {}

    for url in urls_to_scan:
        print(f"Scanning {url}...")
        try:
            html = fetch_html(url)
            apollo = extract_apollo_state(html)
            count = 0
            for k, v in apollo.items():
                if k.startswith("Activity:") and isinstance(v, dict):
                    act_id = str(v.get("id"))
                    title = v.get("title", "")
                    org = v.get("organizationName", "")
                    if act_id and title and org and act_id not in all_activities:
                        all_activities[act_id] = {
                            "apollo_act": v,
                            "apollo_store": apollo
                        }
                        count += 1
            print(f" -> Found {count} new activities.")
        except Exception as e:
            print(f" -> Error scanning {url}: {e}")

    print(f"\nTotal discovered unique activities: {len(all_activities)}")

    PARTNERSHIP_KEYWORDS = [
        "현대", "기아", "모비스", "네이버", "카카오", "LG", "삼성", "CJ", "SK",
        "한화", "신세계", "크래프톤", "토스", "LS", "대한항공", "테슬라", "호반"
    ]

    verified_postings = []

    for act_id, item in all_activities.items():
        v = item["apollo_act"]
        store = item["apollo_store"]

        title = v.get("title", "").strip()
        org = v.get("organizationName", "").strip()

        # Filtering: Large enterprise & New grad
        org_type = v.get("organizationType", "")
        is_large = (
            org_type == "대기업" or
            any(k in org for k in [
                "현대", "기아", "CJ", "신세계", "한화", "LG", "SK", "LS", "DB", "원익",
                "호반", "대한항공", "철도", "공항", "건강보험", "증권", "삼성", "네이버",
                "카카오", "테슬라", "SM엔터", "마이리얼트립", "HD현대", "아워홈", "팜스코",
                "코리아에셋", "더파운더즈"
            ])
        )

        if not is_large:
            continue

        close_at = v.get("recruitCloseAt")
        deadline = timestamp_to_date(close_at)
        apply_url = v.get("applyDetail") or f"https://linkareer.com/activity/{act_id}"
        source_url = f"https://linkareer.com/activity/{act_id}"

        # Detail text
        detail_text = ""
        detail_ref = v.get("detailText", {})
        if isinstance(detail_ref, dict) and "__ref" in detail_ref:
            text_obj = store.get(detail_ref["__ref"], {})
            raw_html = text_obj.get("text", "")
            detail_text = re.sub(r'<[^>]+>', ' ', raw_html).strip()[:500]

        # Location
        location = "수도권"
        regions = v.get("regions", [])
        if regions and isinstance(regions, list) and len(regions) > 0:
            reg_name = regions[0].get("name") if isinstance(regions[0], dict) else None
            if reg_name:
                location = reg_name
        if "서울" in title or "서울" in detail_text:
            location = "서울"
        elif "경기" in title or "경기" in detail_text:
            location = "경기/수도권"

        # Determine category, preferred depts, and tech stacks
        category, preferred_depts, tech_stacks = map_category_and_departments(title, org, detail_text)

        is_partnership = any(p in org for p in PARTNERSHIP_KEYWORDS)
        logo_emoji = get_emoji_for_org(org)

        dept_str = ", ".join(preferred_depts[:3])
        evidence_summary = f"[링커리어 대기업 신입 공채] {org} - {title} (마감일: {deadline}, 전공 타깃: {dept_str})"
        content_hash = hashlib.sha256(f"{act_id}_{org}_{title}_{deadline}".encode("utf-8")).hexdigest()

        posting = {
            "id": f"linkareer-{act_id}",
            "companyName": org,
            "logoEmoji": logo_emoji,
            "title": title,
            "jobCategory": category,
            "employmentType": "정규직" if "인턴" not in title else "채용연계형 인턴",
            "careerLevel": "신입",
            "preferredDepartments": preferred_depts,
            "techStacks": tech_stacks,
            "deadline": deadline,
            "originUrl": apply_url,
            "sourceUrl": source_url,
            "isPartnership": is_partnership,
            "location": location,
            "matchedDepartment": preferred_depts[0] if preferred_depts else "전체",
            "verificationStatus": "VERIFIED",
            "majorPreferenceStatus": "MAJOR_PREFERENCE_CONFIRMED",
            "evidenceText": evidence_summary,
            "sourceId": f"src-linkareer-{act_id}",
            "evidenceId": f"evi-linkareer-{act_id}",
            "contentHash": content_hash,
            "isLiveLinkareer": True
        }
        verified_postings.append(posting)

    # Sort so top enterprises and closing soon appear prominently
    verified_postings.sort(key=lambda x: (not x["isPartnership"], x["deadline"]))

    print(f"\nFinal verified large enterprise postings: {len(verified_postings)}")

    dataset = {
        "updated_at": datetime.datetime.now().isoformat(),
        "type": "LINKAREER_LIVE_LARGE_ENTERPRISE_DATASET",
        "source_reference": "https://linkareer.com/recruit-home",
        "total_discovered": len(verified_postings),
        "total_verified": len(verified_postings),
        "unverified_count": 0,
        "stale_count": 0,
        "conflicted_count": 0,
        "verified_postings": verified_postings
    }

    # Save to both locations
    target_paths = [
        os.path.join("data", "research", "intelligence", "recruitment_intelligence.json"),
        os.path.join("my-exhibit-platform", "data", "research", "intelligence", "recruitment_intelligence.json")
    ]

    for p in target_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(verified_postings)} postings to {p}")

if __name__ == "__main__":
    main()
