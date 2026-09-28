import os
import ssl
import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from PIL import Image

def download_with_ssl_bypass():
    upload_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    os.makedirs(upload_dir, exist_ok=True)
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

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
            html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            
            ps = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True) and '@' not in p.get_text() and 'Copyright' not in p.get_text()]
            if ps:
                desc = "\n\n".join(ps[:4])
        except Exception as e:
            print(f"Error fetching text for {pid}: {e}")

        # Image download: try banner first, or detail 1
        img_url = f"https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1920,c_limit,q_auto,f_auto/swuid2025/project/{pid}/banner.png"
        local_img_name = f"artwork_{pid}.png"
        local_img_path = os.path.join(upload_dir, local_img_name)
        
        download_success = False
        try:
            img_req = urllib.request.Request(img_url, headers=headers)
            with urllib.request.urlopen(img_req, context=ctx) as resp, open(local_img_path, 'wb') as f:
                f.write(resp.read())
            print(f"  Saved artwork {pid} banner ({os.path.getsize(local_img_path)} bytes)")
            download_success = True
        except Exception as e:
            print(f"  Banner download failed for {pid}: {e}, trying detail/1...")
            alt_url = f"https://res.cloudinary.com/dnlzsjt9c/image/upload/c_limit,w_1920,q_auto,f_auto/swuid2025/project/{pid}/detail/1"
            try:
                img_req = urllib.request.Request(alt_url, headers=headers)
                with urllib.request.urlopen(img_req, context=ctx) as resp, open(local_img_path, 'wb') as f:
                    f.write(resp.read())
                print(f"  Saved artwork {pid} detail 1 ({os.path.getsize(local_img_path)} bytes)")
                download_success = True
            except Exception as e2:
                print(f"  Failed detail download for {pid}: {e2}")

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

    # Update university_queue.json with actual artworks
    target_files = [
        "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json",
        "c:/Users/graduation_exhibit_workflow/data/university_queue.json"
    ]

    for tf in target_files:
        if not os.path.exists(tf):
            continue
        with open(tf, 'r', encoding='utf-8') as f:
            queue = json.load(f)
        
        for q in queue:
            if q.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과":
                q['artworks'] = artworks
                break
        
        with open(tf, 'w', encoding='utf-8') as f:
            json.dump(queue, f, ensure_ascii=False, indent=2)
        print(f"Updated artworks in {tf}")

if __name__ == '__main__':
    download_with_ssl_bypass()
