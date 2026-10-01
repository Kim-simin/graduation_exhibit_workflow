import os
import ssl
import json
import re
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup

def crawl_all_46_projects():
    upload_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    os.makedirs(upload_dir, exist_ok=True)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    track_map = {}
    # 1~30: Digital Fabrication
    for i in range(1, 31):
        track_map[i] = ("DIGITAL FABRICATION과", "Digital Fabrication")
    # 31~40: UX Design
    for i in range(31, 41):
        track_map[i] = ("UX DESIGN과", "UX Design")
    # 41~46: BX Design
    for i in range(41, 47):
        track_map[i] = ("BX DESIGN과", "BX Design")

    # Fetch track pages to get designer names from list if available
    track_pages = [("ux", "UX Design"), ("df", "Digital Fabrication"), ("bx", "BX Design")]
    card_names = {}
    for t_val, _ in track_pages:
        t_url = f"https://swuid2025.com/projects?track={t_val}"
        try:
            req = urllib.request.Request(t_url, headers=headers)
            html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            for a in soup.find_all('a'):
                href = a.get('href', '')
                if '/project/' in href:
                    pid_str = href.split('/')[-1]
                    if pid_str.isdigit():
                        pid = int(pid_str)
                        card_names[pid] = a.get_text(strip=True)
        except Exception as e:
            print(f"Error fetching track page {t_val}: {e}")

    artworks = []

    for pid in range(1, 47):
        dept_code, track_name = track_map[pid]
        url = f"https://swuid2025.com/project/{pid}"
        print(f"Processing #{pid} ({track_name})...")

        title = ""
        students = ""
        desc = ""

        try:
            req = urllib.request.Request(url, headers=headers)
            html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')

            # Extract title
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text(strip=True)

            # If not in h1, look for h2
            if not title:
                h2 = soup.find('h2')
                if h2:
                    title = h2.get_text(strip=True)

            # Extract descriptions
            paragraphs = [p.get_text(strip=True) for p in soup.find_all('p') if p.get_text(strip=True) and '@' not in p.get_text() and 'Copyright' not in p.get_text() and 'Design' not in p.get_text() and 'Project' not in p.get_text()]
            if paragraphs:
                desc = "\n\n".join(paragraphs[:3])

            # Extract designer names
            # Look for student names near 'Designer' header or email lines
            designer_h3 = None
            for h in soup.find_all(['h3', 'h4', 'span', 'p']):
                if 'Designer' in h.get_text():
                    designer_h3 = h
                    break
            
            # Often names appear in the card_names list or as text
            if card_names.get(pid):
                raw = card_names[pid]
                if title and title in raw:
                    rem = raw.replace(title, '').strip()
                    if rem:
                        students = rem

        except Exception as e:
            print(f"  Error fetching page for #{pid}: {e}")

        # Fallback for title if empty
        if not title:
            title = f"Project #{pid}"

        # Image download
        local_img_name = f"artwork_{pid}.png"
        local_img_path = os.path.join(upload_dir, local_img_name)

        if not os.path.exists(local_img_path) or os.path.getsize(local_img_path) < 1000:
            banner_url = f"https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1920,c_limit,q_auto,f_auto/swuid2025/project/{pid}/banner.png"
            downloaded = False
            try:
                img_req = urllib.request.Request(banner_url, headers=headers)
                with urllib.request.urlopen(img_req, context=ctx) as resp, open(local_img_path, 'wb') as f:
                    f.write(resp.read())
                downloaded = True
                print(f"  Saved #{pid} banner ({os.path.getsize(local_img_path)} bytes)")
            except Exception as e:
                print(f"  Banner failed for #{pid}: {e}, trying detail/1...")
                detail_url = f"https://res.cloudinary.com/dnlzsjt9c/image/upload/c_limit,w_1920,q_auto,f_auto/swuid2025/project/{pid}/detail/1"
                try:
                    img_req = urllib.request.Request(detail_url, headers=headers)
                    with urllib.request.urlopen(img_req, context=ctx) as resp, open(local_img_path, 'wb') as f:
                        f.write(resp.read())
                    downloaded = True
                    print(f"  Saved #{pid} detail 1 ({os.path.getsize(local_img_path)} bytes)")
                except Exception as e2:
                    print(f"  All image downloads failed for #{pid}: {e2}")

        rel_path = f"uploads/UNIV-2025-서울여자대학교-산업디자인학과/{local_img_name}"

        # MANDATORY RULE: 상세 학과명/전공명 department 필드에 고정
        artworks.append({
            "title": f"[{track_name}] {title}",
            "student_name": students or "서울여자대학교 산업디자인과 디자이너",
            "department": dept_code,
            "image": rel_path,
            "thumbnail": rel_path,
            "description": desc or f"2025 서울여자대학교 산업디자인학과 {track_name} 트랙 졸업작품 《{title}》.",
            "inferred_role": "디자이너"
        })

    # Save to a temporary json for verification
    with open("c:/Users/graduation_exhibit_workflow/scripts/crawled_artworks_46.json", "w", encoding="utf-8") as f:
        json.dump(artworks, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully crawled {len(artworks)} artworks!")

if __name__ == '__main__':
    crawl_all_46_projects()
