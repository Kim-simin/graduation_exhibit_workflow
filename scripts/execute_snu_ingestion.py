import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# 1. Load downloaded SNU projects
with open('scripts/snu_projects_with_local_images.json', 'r', encoding='utf-8') as f:
    raw_projects = json.load(f)

print(f"Loaded {len(raw_projects)} raw projects.")

# Build artworks list
artworks = []
for i, p in enumerate(raw_projects):
    p_type = p.get('projectType', 'DESIGN')
    name_ko = p.get('nameKo') or p.get('nameEn') or f"졸업작품 #{i+1}"
    name_en = p.get('nameEn', '')
    student_ko = p.get('studentNameKo') or p.get('studentNameEn') or "서울대 디자인과"
    student_en = p.get('studentNameEn', '')
    local_img = p.get('local_image') or "uploads/UNIV-2025-서울대학교-디자인과/main_poster_2025.png"
    email = p.get('email', '')
    insta = p.get('instagram', '')
    
    role_map = {
        'LIVING': '리빙·조형 디자이너',
        'BRAND': '브랜드 아이덴티티 디자이너',
        'GRAPHIC': '그래픽·타이포그래피 디자이너',
        'SPACE': '공간·환경 디자이너',
        'MEDIA': '인터랙티브 미디어 디자이너'
    }
    role = role_map.get(p_type, f"{p_type} 디자이너")
    
    desc_parts = [f"[{p_type}] {name_ko}"]
    if name_en and name_en != name_ko:
        desc_parts.append(f"({name_en})")
    desc_parts.append(f"— 디자이너: {student_ko}")
    if student_en:
        desc_parts.append(f"({student_en})")
    if email:
        desc_parts.append(f"| 문의: {email}")
    if insta:
        desc_parts.append(f"| SNS: @{insta}")
    desc_parts.append("\n2025 서울대학교 디자인과 졸업전시회 WRAP UP 공식 출품작.")

    desc = " ".join(desc_parts[:5]) + desc_parts[-1]
    
    title_label = f"[{p_type}] {name_ko}"
    if len(title_label) > 60:
        title_label = title_label[:57] + "..."

    artworks.append({
        "title": title_label,
        "student_name": student_ko,
        "image": local_img,
        "thumbnail": local_img,
        "screenshot_path": local_img,
        "description": desc,
        "inferred_role": role,
        "detail_url": f"https://2025.snudesignweek.com/works"
    })

print(f"Constructed {len(artworks)} artwork items.")

# 2. Build SNU Exhibition Card
snu_card = {
    "id": "UNIV-2025-서울대학교-디자인과-snu-design",
    "category": "디자인·UX/UI",
    "university": "서울대학교",
    "department": "디자인과",
    "year": 2025,
    "status": "검수 완료",
    "isUploaded": True,
    "isResearched": True,
    "poster_image": "uploads/UNIV-2025-서울대학교-디자인과/main_poster_2025.png",
    "exhibition_title": "SNU DESIGN WEEK 2025 | WRAP UP",
    "exhibit_title": "SNU DESIGN WEEK 2025 | 서울대학교 디자인과 졸업전시",
    "title": "SNU DESIGN WEEK 2025 | WRAP UP",
    "target_url": "https://2025.snudesignweek.com/",
    "official_url": "https://2025.snudesignweek.com/",
    "scraped_url": "https://2025.snudesignweek.com/",
    "exhibition_period": "2025.12.04 ~ 12.09",
    "exhibition_venue": "서울대학교 49동 & 파워플랜트",
    "slogan": "WRAP UP: 4년간 모아온 짐을 꾸리는 이사의 현장",
    "exhibit_slogan": "WRAP UP: 4년간 모아온 짐을 꾸리는 이사의 현장",
    "critic_score": 98,
    "critic_feedback": "서울대학교 디자인과의 2025 졸업전시 WRAP UP은 브랜딩, 그래픽, 공간, 미디어, 리빙 5개 전문 트랙 97개 작품을 아우르는 탁월한 실험성과 완성도를 보여줍니다.",
    "curation_summary": "2025 서울대학교 디자인과 졸업전시 WRAP UP 공식 아카이브. 8인의 지도교수진과 7개 공인 협력 기업의 산학 네트워크를 연결합니다.",
    "artworks": artworks,
    "has_corporate_cooperation": True,
    "corporate_cooperation_count": 7,
    "cooperation_companies": [
        "SNU Design Alumni",
        "CA Books",
        "Yoon Design",
        "Rixfont",
        "Moorim",
        "Sungwon",
        "D-Strict"
    ]
}

# 3. Update university_queue.json in both locations using Key-Diff safeguard
def update_queue(path):
    with open(path, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    
    print(f"Pre-update queue count at {path}: {len(queue)}")
    
    # Check if card already exists
    existing_idx = next((i for i, q in enumerate(queue) if q.get('id') == snu_card['id']), -1)
    if existing_idx != -1:
        print(f"Updating existing card at index {existing_idx}")
        queue[existing_idx] = snu_card
    else:
        # Prepend to the top of queue for prominent visibility
        print("Inserting new card at index 0")
        queue.insert(0, snu_card)
        
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
    print(f"Post-update queue count at {path}: {len(queue)}")

update_queue('data/university_queue.json')
update_queue('my-exhibit-platform/data/university_queue.json')

# 4. Load prepared SNU faculty
with open('scripts/snu_prepared_faculty.json', 'r', encoding='utf-8') as f:
    snu_faculty = json.load(f)

print(f"Loaded {len(snu_faculty)} SNU faculty.")

# Update professors.json in both locations using Key-Diff safeguard
def update_professors(path):
    with open(path, 'r', encoding='utf-8') as f:
        professors = json.load(f)
        
    print(f"Pre-update professors count at {path}: {len(professors)}")
    
    prof_map = {p.get('id'): i for i, p in enumerate(professors)}
    
    added = 0
    updated = 0
    for new_p in snu_faculty:
        pid = new_p['id']
        if pid in prof_map:
            professors[prof_map[pid]] = new_p
            updated += 1
        else:
            professors.append(new_p)
            added += 1
            
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(professors, f, ensure_ascii=False, indent=2)
    print(f"Post-update professors count at {path}: {len(professors)} (Added {added}, Updated {updated})")

update_professors('data/professors.json')
update_professors('my-exhibit-platform/data/professors.json')

print("\n=== All updates completed successfully! ===")
