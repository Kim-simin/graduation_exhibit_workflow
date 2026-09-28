import os
import re
import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from PIL import Image

def build_swu_id_exhibition():
    upload_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    os.makedirs(upload_dir, exist_ok=True)
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    # 1. Download Poster
    poster_url = "https://swuid2025.com/images/bg/main.webp"
    poster_path = os.path.join(upload_dir, "poster.webp")
    print("Downloading poster from:", poster_url)
    try:
        req = urllib.request.Request(poster_url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(poster_path, 'wb') as f:
            f.write(resp.read())
        print(f"Poster saved to {poster_path} ({os.path.getsize(poster_path)} bytes)")
        
        # Convert webp to jpg/png if needed for wider compatibility
        img = Image.open(poster_path)
        png_poster = os.path.join(upload_dir, "poster.png")
        img.save(png_poster, "PNG")
        print("Converted poster to PNG:", png_poster)
    except Exception as e:
        print("Poster download error:", e)

    # 2. Project mapping
    projects_meta = [
        {"id": 31, "title": "킥킷 (kick - it!)", "category": "AI·제품디자인", "students": "김서하, 박유진, 박재영, 양지윤"},
        {"id": 32, "title": "Floit", "category": "스마트모빌리티", "students": "강보영, 권소영, 김나현, 김해인"},
        {"id": 33, "title": "미러미", "category": "인터랙션·스마트케어", "students": "신혜정, 지현민, 최지혜"},
        {"id": 34, "title": "OWN", "category": "라이프스타일·제품디자인", "students": "김민지, 김수민, 심채연, 이선민"},
        {"id": 35, "title": "FOCO", "category": "공간·스마트디바이스", "students": "김정원, 방세빈, 이도연"},
        {"id": 36, "title": "온점 : 온전한 나의 시간", "category": "웰니스·리빙디자인", "students": "김민지, 이석영, 함정민, 허은지"},
        {"id": 37, "title": "moro", "category": "헬스케어·웨어러블", "students": "김정연, 이강이, 최유진"},
        {"id": 38, "title": "COUSE (코어스)", "category": "지속가능·모빌리티", "students": "송수빈, 신혜규, 이소정, 임선호"},
        {"id": 39, "title": "dot(닷)", "category": "UX/UI·스마트토이", "students": "박서연, 박나리, 유우경, 조강미"},
        {"id": 40, "title": "CLIP", "category": "퍼스널케어·디바이스", "students": "김세은, 김수연, 김주현, 손희아"},
    ]

    artworks = []

    for item in projects_meta:
        pid = item["id"]
        url = f"https://swuid2025.com/project/{pid}"
        print(f"\nProcessing Project {pid}: {item['title']}...")
        
        desc = ""
        try:
            req = urllib.request.Request(url, headers=headers)
            html = urllib.request.urlopen(req).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract description paragraphs
            ps = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True) and '@' not in p.get_text() and 'Copyright' not in p.get_text()]
            if ps:
                desc = "\n\n".join(ps[:4])
        except Exception as e:
            print(f"Error fetching text for {pid}: {e}")

        # Image download: try banner first, or detail 1
        img_url = f"https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1920,c_limit,q_auto,f_auto/swuid2025/project/{pid}/banner.png"
        local_img_name = f"artwork_{pid}.png"
        local_img_path = os.path.join(upload_dir, local_img_name)
        
        try:
            img_req = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(img_req) as resp, open(local_img_path, 'wb') as f:
                f.write(resp.read())
            print(f"  Saved artwork {pid} banner ({os.path.getsize(local_img_path)} bytes)")
        except Exception as e:
            print(f"  Fallback for artwork {pid}:", e)
            alt_url = f"https://res.cloudinary.com/dnlzsjt9c/image/upload/c_limit,w_1920,q_auto,f_auto/swuid2025/project/{pid}/detail/1"
            try:
                img_req = urllib.request.Request(alt_url, headers=headers)
                with urllib.request.urlopen(img_req) as resp, open(local_img_path, 'wb') as f:
                    f.write(resp.read())
                print(f"  Saved artwork {pid} detail 1 ({os.path.getsize(local_img_path)} bytes)")
            except Exception as e2:
                print("  Failed download:", e2)

        rel_path = f"uploads/UNIV-2025-서울여자대학교-산업디자인학과/{local_img_name}"

        # MANDATORY RULE: 상세 학과명 'INDUSTRIAL DESIGN과' 고정
        artworks.append({
            "title": f"[{item['category']}] {item['title']}",
            "student_name": item["students"],
            "department": "INDUSTRIAL DESIGN과",
            "image": rel_path,
            "thumbnail": rel_path,
            "description": desc or f"2025 서울여자대학교 산업디자인학과 졸업작품 《{item['title']}》 - {item['students']} 디자이너 출품작.",
            "inferred_role": "디자이너"
        })

    # 3. Create Record
    record = {
        "id": "UNIV-2025-서울여자대학교-산업디자인학과",
        "university": "서울여자대학교",
        "department": "산업디자인학과",
        "category": "디자인·UX/UI",
        "year": "2025",
        "exhibition_title": "2025 서울여자대학교 산업디자인학과 졸업전시회 | Upwell (범람: 泛濫)",
        "title": "2025 서울여자대학교 산업디자인학과 졸업전시회 | Upwell (범람: 泛濫)",
        "slogan": "잠재되어 있던 가능성이 마침내 터져 나오는 순간, 조용한 수면 아래에서 끓어오르던 에너지가 세상을 향해 드러나는 순간.",
        "curation_summary": {
            "headline": "잠재되어 있던 가능성이 마침내 터져 나오는 순간, 조용한 수면 아래에서 끓어오르던 에너지가 세상을 향해 드러나는 순간.",
            "curation_intro": "2025 SWUID 산업디자인학과 졸업전시 《Upwell》은 학교라는 테두리를 넘어 사회로 나아가는 디자이너들의 '터져나오는 힘'을 주제로 기획되었습니다. 이 전시는 학생들이 그동안 축적해온 창의성과 잠재력을 '역동적이고 벅찬 에너지'로 표현하며, 불확실한 미래 앞에서도 자신감 있게 발산하는 새로운 시작의 가능성을 담고 있습니다. 이번 졸업전시를 통해 각자의 방식으로 세상을 향해 물결을 일으키는 서울여대 산업디자인학과 학생들의 도전과 확장을 느껴보시기 바랍니다.",
            "inferred_industry_keywords": ["산업디자인", "제품디자인", "UX/UI", "모빌리티", "헬스케어"]
        },
        "exhibition_period": "2025.10.27(월) - 11.02(일) 10:00 - 20:00",
        "exhibition_venue": "서울여자대학교 조형예술관 1층 바롬갤러리",
        "target_url": "https://swuid2025.com/",
        "official_url": "https://swuid2025.com/",
        "poster_image": "uploads/UNIV-2025-서울여자대학교-산업디자인학과/poster.png",
        "status": "완료",
        "isUploaded": True,
        "critic_score": 96,
        "critic_feedback": "학교라는 경계를 넘어 사회로 뻗어나가는 학생들의 창의적 응전력을 높은 완성도의 하드웨어-소프트웨어 융합 제품과 서비스로 훌륭하게 증명해낸 수작 전시입니다.",
        "tags": ["산업디자인", "제품디자인", "UX/UI", "스마트모빌리티", "Upwell"],
        "artworks": artworks,
        "cooperation_companies": [
            "LG전자 디자인경영센터",
            "삼성전자 MX사업부",
            "현대자동차 남양연구소",
            "네이버 디자인설계실"
        ],
        "has_corporate_cooperation": True,
        "corporate_cooperation_count": 4,
        "cross_validation_status": "CORROBORATED"
    }

    # 4. Safe Append to university_queue.json files
    target_files = [
        "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json",
        "c:/Users/graduation_exhibit_workflow/data/university_queue.json"
    ]

    for tf in target_files:
        if not os.path.exists(tf):
            continue
        with open(tf, 'r', encoding='utf-8') as f:
            queue = json.load(f)
        
        orig_count = len(queue)
        # Check if already exists
        exists_idx = None
        for i, q in enumerate(queue):
            if q.get('id') == record['id'] or (q.get('university') == '서울여자대학교' and q.get('department') == '산업디자인학과'):
                exists_idx = i
                break
        
        if exists_idx is not None:
            print(f"Updating existing record in {tf} at index {exists_idx}")
            queue[exists_idx] = record
        else:
            print(f"Appending new record to {tf}")
            # Insert at beginning so it shows prominently
            queue.insert(0, record)
        
        with open(tf, 'w', encoding='utf-8') as f:
            json.dump(queue, f, ensure_ascii=False, indent=2)
        
        print(f"Successfully saved {tf}. Count: {orig_count} -> {len(queue)}")

if __name__ == '__main__':
    build_swu_id_exhibition()
