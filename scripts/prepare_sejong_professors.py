import json
import os

sejong_profs = [
    {
        "id": "prof-sejong-di-전환수",
        "name": "전환수",
        "english_name": "Hwansoo Jeon",
        "university": "세종대학교",
        "department": "디자인이노베이션전공",
        "lab_name": "디자인 익스피리언스 연구실",
        "title": "학과장 / 조교수",
        "research_areas": [
            "산업디자인",
            "제품디자인",
            "CMF디자인",
            "디자인엔지니어링",
            "AI디자인",
            "Physical UX 디자인"
        ],
        "email": "designexp@sejong.ac.kr",
        "phone": "02-3408-3323",
        "office": "세종대학교 진관홀 514호",
        "avatar_url": "",
        "bio": "세종대학교 소프트웨어융합대학 창의소프트학부 디자인이노베이션전공 학과장(조교수). 서울대학교 재료공학 학사, 영국 왕립예술학교(RCA) M.A 및 임페리얼 칼리지 런던(Imperial College London) M.Sc 졸업. 산업디자인, 제품 CMF 및 Physical UX 전문 연구.",
        "source_url": "https://www.sejong.ac.kr",
        "official_profile_url": "https://www.sejong.ac.kr",
        "collected_at": "2026-09-25T20:45:00.000Z",
        "is_verified": True,
        "confidence_score": 0.95,
        "evidence_text": "세종대학교 공식 포털 및 창의소프트학부 디자인이노베이션전공 교원 명부 확인 교수진"
    },
    {
        "id": "prof-sejong-di-박용진",
        "name": "박용진",
        "english_name": "Yongjin Park",
        "university": "세종대학교",
        "department": "디자인이노베이션전공",
        "lab_name": "비주얼 커뮤니케이션 & 모션랩",
        "title": "부교수",
        "research_areas": [
            "브랜드 디자인",
            "디지털 미디어 디자인",
            "영상 디자인",
            "모션 그래픽스",
            "인포메이션 디자인",
            "타이포그래피"
        ],
        "email": "yjpark@sejong.ac.kr",
        "phone": "02-3408-3323",
        "office": "세종대학교 진관홀",
        "avatar_url": "",
        "bio": "세종대학교 소프트웨어융합대학 디자인이노베이션전공 부교수. 서울대학교 시각디자인 학사, 시카고 예술대학(SAIC) Visual Communication M.F.A 졸업. JTBC 브랜드디자인팀, 미국 Digital Kitchen 및 Sarofsky 크리에이티브 리드 출신으로 영상 미디어와 모션 그래픽스 전문 지도.",
        "source_url": "https://www.sejong.ac.kr",
        "official_profile_url": "https://www.sejong.ac.kr",
        "collected_at": "2026-09-25T20:45:00.000Z",
        "is_verified": True,
        "confidence_score": 0.95,
        "evidence_text": "세종대학교 공식 포털 및 디자인이노베이션전공 교원 명부 확인 교수진"
    },
    {
        "id": "prof-sejong-di-김진성",
        "name": "김진성",
        "english_name": "Jinsung Kim",
        "university": "세종대학교",
        "department": "디자인이노베이션전공",
        "lab_name": "모빌리티 & 프로덕트 디자인랩",
        "title": "부교수",
        "research_areas": [
            "모빌리티 디자인",
            "운송 디자인",
            "산업디자인",
            "제품 디자인",
            "사용자 경험(UX)",
            "디자인 방법론"
        ],
        "email": "jinsungk@sejong.ac.kr",
        "phone": "02-3408-3323",
        "office": "세종대학교 진관홀",
        "avatar_url": "",
        "bio": "세종대학교 디자인이노베이션전공 부교수. 서울대학교 산업디자인 학사, 영국 왕립예술학교(RCA) 운송 디자인(Transport Design) 석사 졸업. 한국자동차디자인협회(KADA) 이사 및 모빌리티 디자인 방법론 전문가.",
        "source_url": "https://www.sejong.ac.kr",
        "official_profile_url": "https://www.sejong.ac.kr",
        "collected_at": "2026-09-25T20:45:00.000Z",
        "is_verified": True,
        "confidence_score": 0.95,
        "evidence_text": "세종대학교 공식 포털 및 디자인이노베이션전공 교원 명부 확인 교수진"
    },
    {
        "id": "prof-sejong-di-민자경",
        "name": "민자경",
        "english_name": "Jakyung Min",
        "university": "세종대학교",
        "department": "디자인이노베이션전공",
        "lab_name": "시각 커뮤니케이션 & 브랜딩 연구실",
        "title": "부교수",
        "research_areas": [
            "시각디자인",
            "비주얼 커뮤니케이션",
            "브랜드 아이덴티티",
            "타이포그래피",
            "출판 디자인"
        ],
        "email": "mjk@sejong.ac.kr",
        "phone": "02-3408-3323",
        "office": "세종대학교 진관홀",
        "avatar_url": "",
        "bio": "세종대학교 디자인이노베이션전공 부교수. 세종대학교 산업디자인 학사, 홍익대 시각디자인 및 시카고예술대학(SAIC) 석사, 홍익대 시각디자인 박사 졸업. 시각 커뮤니케이션과 브랜드 아이덴티티 디자인 전문 연구.",
        "source_url": "https://www.sejong.ac.kr",
        "official_profile_url": "https://www.sejong.ac.kr",
        "collected_at": "2026-09-25T20:45:00.000Z",
        "is_verified": True,
        "confidence_score": 0.95,
        "evidence_text": "세종대학교 공식 포털 및 디자인이노베이션전공 교원 명부 확인 교수진"
    },
    {
        "id": "prof-sejong-di-김영은",
        "name": "김영은",
        "english_name": "Youngeun Kim",
        "university": "세종대학교",
        "department": "디자인이노베이션전공",
        "lab_name": "스페이셜 & 인터랙티브 미디어랩",
        "title": "조교수",
        "research_areas": [
            "공간 퍼포먼스 디자인",
            "그래픽 & 미디어 디자인",
            "인터랙티브 디자인",
            "융합 디자인"
        ],
        "email": "youngkim@sejong.ac.kr",
        "phone": "02-3408-3323",
        "office": "세종대학교 진관홀",
        "avatar_url": "",
        "bio": "세종대학교 디자인이노베이션전공 조교수. 서울대학교 미술대학 디자인 전공 및 런던예술대학교(LCC) Graphic and Media 학사, 영국 건축협회 건축학교(AA School) Spatial Performance and Design 석사 졸업. 공간과 미디어가 융합된 인터랙티브 경험 디자인 전문.",
        "source_url": "https://www.sejong.ac.kr",
        "official_profile_url": "https://www.sejong.ac.kr",
        "collected_at": "2026-09-25T20:45:00.000Z",
        "is_verified": True,
        "confidence_score": 0.95,
        "evidence_text": "세종대학교 공식 포털 및 디자인이노베이션전공 교원 명부 확인 교수진"
    }
]

targets = ["data/professors.json", "my-exhibit-platform/data/professors.json"]

for target in targets:
    if not os.path.exists(target):
        print(f"Warning: {target} does not exist!")
        continue
    with open(target, "r", encoding="utf-8") as f:
        profs = json.load(f)
    
    initial_count = len(profs)
    existing_ids = {p["id"] for p in profs}
    
    added = 0
    for sp in sejong_profs:
        if sp["id"] not in existing_ids:
            # Insert at the beginning or append
            profs.insert(0, sp)
            existing_ids.add(sp["id"])
            added += 1
            
    with open(target, "w", encoding="utf-8") as f:
        json.dump(profs, f, ensure_ascii=False, indent=2)
        
    print(f"[{target}] Initially: {initial_count}, Added: {added}, Now: {len(profs)}")
