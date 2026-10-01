import os
import sys
import json
import ssl
import urllib.request

def main():
    upload_dir = "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
    os.makedirs(upload_dir, exist_ok=True)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    with open('all_46_parsed_preview.json', 'r', encoding='utf-8') as f:
        parsed_data = json.load(f)

    print(f"Loaded {len(parsed_data)} parsed projects.")

    artworks = []
    success_downloads = 0

    for item in parsed_data:
        pid = item['id']
        dept = item['department']  # 'DIGITAL FABRICATION과', 'UX DESIGN과', 'BX DESIGN과'
        track = item['track']      # 'Digital Fabrication', 'UX Design', 'BX Design'
        title = item['title']
        student_name = item['student_name']
        
        # Build description
        all_p = item.get('all_paragraphs', [])
        desc_candidates = [p for p in all_p if '@' not in p and 'Copyright' not in p and '©' not in p and p != student_name]
        if desc_candidates:
            description = "\n\n".join(desc_candidates)
        else:
            description = f"2025 서울여자대학교 산업디자인학과 {track} 트랙 졸업작품 《{title}》. 디자이너 {student_name} 출품작."

        # Image download
        local_filename = f"artwork_{pid}.png"
        local_path = os.path.join(upload_dir, local_filename)

        if not os.path.exists(local_path) or os.path.getsize(local_path) < 5000:
            urls_to_try = [
                f"https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1920,c_limit,q_auto,f_auto/swuid2025/project/{pid}/banner.png",
                f"https://res.cloudinary.com/dnlzsjt9c/image/upload/c_limit,w_1920,q_auto,f_auto/swuid2025/project/{pid}/detail/1",
                f"https://res.cloudinary.com/dnlzsjt9c/image/upload/w_1200,h_1200,c_fill,q_auto,f_auto/swuid2025/project/{pid}/thumbnail"
            ]
            downloaded = False
            for u in urls_to_try:
                try:
                    req = urllib.request.Request(u, headers=headers)
                    with urllib.request.urlopen(req, context=ctx) as resp:
                        content = resp.read()
                        if len(content) > 1000:
                            with open(local_path, 'wb') as img_f:
                                img_f.write(content)
                            downloaded = True
                            success_downloads += 1
                            break
                except Exception as e:
                    continue
            if not downloaded:
                print(f"Warning: Failed downloading image for PID {pid}")
        else:
            success_downloads += 1

        rel_path = f"uploads/UNIV-2025-서울여자대학교-산업디자인학과/{local_filename}"

        artworks.append({
            "title": f"[{track}] {title}",
            "student_name": student_name,
            "department": dept,
            "image": rel_path,
            "thumbnail": rel_path,
            "description": description,
            "inferred_role": "디자이너",
            "detail_url": f"https://swuid2025.com/project/{pid}"
        })

    print(f"Total downloaded/verified artworks: {success_downloads}/46")
    print(f"Total artworks compiled: {len(artworks)}")

    # Update both university_queue.json files
    target_files = [
        "c:/Users/graduation_exhibit_workflow/my-exhibit-platform/data/university_queue.json",
        "c:/Users/graduation_exhibit_workflow/data/university_queue.json"
    ]

    for tf in target_files:
        if not os.path.exists(tf):
            print(f"File not found: {tf}")
            continue
        with open(tf, 'r', encoding='utf-8') as f:
            queue = json.load(f)

        original_count = len(queue)
        found = False
        for q in queue:
            if q.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과":
                q['artworks'] = artworks
                q['critic_score'] = 98
                q['slogan'] = "Upwell (범람: 泛濫) - 잠재되어 있던 가능성이 마침내 터져 나오는 순간"
                found = True
                break

        if not found:
            print(f"Error: Record UNIV-2025-서울여자대학교-산업디자인학과 not found in {tf}")
            continue

        with open(tf, 'w', encoding='utf-8') as f:
            json.dump(queue, f, ensure_ascii=False, indent=2)

        # Integrity verification
        with open(tf, 'r', encoding='utf-8') as f:
            reloaded = json.load(f)
            assert len(reloaded) == original_count, f"Record count changed from {original_count} to {len(reloaded)}"
            swu_rec = next(item for item in reloaded if item.get('id') == "UNIV-2025-서울여자대학교-산업디자인학과")
            assert len(swu_rec['artworks']) == 46, f"Expected 46 artworks, got {len(swu_rec['artworks'])}"

        print(f"Successfully updated and verified {tf} (artworks: 46, total records: {original_count})")

if __name__ == '__main__':
    main()
