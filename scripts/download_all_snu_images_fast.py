import os
import sys
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

dest_dir = 'my-exhibit-platform/public/captures/UNIV-2025-서울대학교-디자인과'
os.makedirs(dest_dir, exist_ok=True)

with open('scripts/snu_projects_clean_urls.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

def download_one(idx, p):
    url = p.get('thumbnailUrl', '')
    p_id = p.get('id', f'proj_{idx}')
    filename = f"work_{idx+1:02d}_{p_id[:8]}.webp"
    local_path = os.path.join(dest_dir, filename)
    rel_path = f"captures/UNIV-2025-서울대학교-디자인과/{filename}"
    
    if not url.startswith('http'):
        p['local_image'] = "uploads/UNIV-2025-서울대학교-디자인과/main_poster_2025.png"
        return idx, False, 0
    
    # If already downloaded and size > 0
    if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
        p['local_image'] = rel_path
        return idx, True, os.path.getsize(local_path)
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp, open(local_path, 'wb') as f_out:
            data = resp.read()
            f_out.write(data)
        p['local_image'] = rel_path
        return idx, True, len(data)
    except Exception as e:
        print(f"Error downloading {idx+1}: {e}")
        p['local_image'] = "uploads/UNIV-2025-서울대학교-디자인과/main_poster_2025.png"
        return idx, False, 0

print(f"Starting parallel download of {len(projects)} images...")

success = 0
failed = 0
with ThreadPoolExecutor(max_workers=8) as executor:
    futures = [executor.submit(download_one, i, p) for i, p in enumerate(projects)]
    for f in as_completed(futures):
        idx, ok, size = f.result()
        if ok:
            success += 1
        else:
            failed += 1
        if (success + failed) % 15 == 0 or (success + failed) == len(projects):
            print(f"Progress: {success + failed}/{len(projects)} ({success} ok, {failed} fail)")

print(f"\nFinal: {success} succeeded, {failed} fallbacked.")

with open('scripts/snu_projects_with_local_images.json', 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

print("Saved projects with local image paths to scripts/snu_projects_with_local_images.json")
