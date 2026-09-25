import json
import os

with open("scripts/sejong_artworks_formatted.json", "r", encoding="utf-8") as f:
    artworks = json.load(f)

sejong_card = {
    "id": "UNIV-2025-세종대학교-디자인이노베이션전공-firstchase",
    "category": "디자인·UX/UI",
    "university": "세종대학교",
    "department": "디자인이노베이션전공",
    "year": 2025,
    "status": "리서치 완료",
    "isUploaded": True,
    "isResearched": True,
    "poster_image": "uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg",
    "exhibition_title": "2025 세종대학교 디자인이노베이션전공 졸업전시회 | First Chase",
    "exhibit_title": "2025 세종대학교 디자인이노베이션전공 졸업전시회 | First Chase",
    "title": "2025 세종대학교 디자인이노베이션전공 졸업전시회 | First Chase",
    "target_url": "http://sj-di.com/2025-firstchase",
    "official_url": "http://sj-di.com/2025-firstchase",
    "scraped_url": "http://sj-di.com/2025-firstchase",
    "exhibition_period": "2025.10.31 - 2025.11.10 (10:00 - 18:00)",
    "exhibition_venue": "세종대학교 광개토관 B1 세종뮤지엄갤러리 3관",
    "slogan": "트랙을 넘어 세상으로의 첫 질주",
    "exhibit_slogan": "트랙을 넘어 세상으로의 첫 질주",
    "critic_score": 97,
    "critic_feedback": "세종대학교 디자인이노베이션전공 제44회 졸업전시 'First Chase'는 시각디자인(아이덴티티 디자인, 디지털 미디어 프로젝트)과 공업디자인(제품·운송 디자인, 제품 시스템 디자인)의 경계를 허물고 혁신적인 조형 언어와 인터랙티브 솔루션을 조화롭게 제시합니다.",
    "curation_summary": {
        "headline": "제44회 디자인이노베이션 졸업전시회 | 트랙을 넘어 세상으로의 첫 질주",
        "curation_intro": "졸업은 단순한 끝이 아닌 새로운 트랙의 시작입니다. 우리는 지금 막 그 출발선 앞에 서 있습니다. 지난 시간 속 우리의 경험과 흔적은 서로 겹치고 쌓이며 앞으로 나아가게 하는 추진력이 되었습니다. 우리는 속도를 높여 눈앞의 트랙을 넘어 더 큰 무대로 달려갑니다. First Chase, 우리의 첫 질주는 곧 새로운 시작이 됩니다.",
        "inferred_industry_keywords": [
            "디자인이노베이션",
            "세종대학교",
            "FirstChase",
            "아이덴티티디자인",
            "디지털미디어",
            "제품운송디자인",
            "제품시스템디자인"
        ]
    },
    "cooperation_companies": [
        "세종대학교 창의소프트학부",
        "세종뮤지엄갤러리",
        "세종대학교 디자인이노베이션 졸업준비위원회"
    ],
    "has_corporate_cooperation": True,
    "corporate_cooperation_count": 3,
    "cross_validation_status": "CORROBORATED",
    "artworks": artworks
}

targets = [
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

for target in targets:
    if not os.path.exists(target):
        print(f"Warning: {target} not found")
        continue
    with open(target, "r", encoding="utf-8") as f:
        queue = json.load(f)
    
    initial_len = len(queue)
    # Check if exists
    filtered = [item for item in queue if item.get("id") != sejong_card["id"]]
    filtered.insert(0, sejong_card)
    
    with open(target, "w", encoding="utf-8") as f:
        json.dump(filtered, f, ensure_ascii=False, indent=2)
        
    print(f"[{target}] Initially: {initial_len}, Now: {len(filtered)}, Artworks: {len(sejong_card['artworks'])}")
