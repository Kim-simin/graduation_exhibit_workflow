import os
import sys
import json
import urllib.request
import re

sys.stdout.reconfigure(encoding='utf-8')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

dest_dir = 'my-exhibit-platform/public/captures/UNIV-2025-서울대학교-디자인과'
os.makedirs(dest_dir, exist_ok=True)

with open('scripts/snu_projects_final.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print(f"Total projects to process: {len(projects)}")

success_count = 0
fail_count = 0

for i, p in enumerate(projects):
    thumb_url = p.get('thumbnailUrl', '')
    p_id = p.get('id', f'proj_{i}')
    # Extract file extension from URL if possible, default to .webp or .jpg
    ext = '.jpg'
    if '.png' in thumb_url.lower():
        ext = '.png'
    elif '.webp' in thumb_url.lower():
        ext = '.webp'
    elif '.jpeg' in thumb_url.lower():
        ext = '.jpeg'
    
    filename = f"work_{i+1:02d}_{p_id[:8]}{ext}"
    local_path = os.path.join(dest_dir, filename)
    rel_path = f"captures/UNIV-2025-서울대학교-디자인과/{filename}"
    
    if thumb_url.startswith('http'):
        try:
            req = urllib.request.Request(thumb_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp, open(local_path, 'wb') as out_f:
                out_f.write(resp.read())
            p['local_image'] = rel_path
            success_count += 1
            if (i + 1) % 15 == 0 or i == len(projects) - 1:
                print(f"[{i+1}/{len(projects)}] Downloaded {filename} ({os.path.getsize(local_path)} bytes)")
        except Exception as e:
            print(f"Failed to download project {i+1} ({thumb_url[:50]}...): {e}")
            p['local_image'] = "uploads/UNIV-2025-서울대학교-디자인과/main_poster_2025.png"
            fail_count += 1
    else:
        # Fallback to poster
        p['local_image'] = "uploads/UNIV-2025-서울대학교-디자인과/main_poster_2025.png"

print(f"\nDone: {success_count} downloaded, {fail_count} failed, total: {len(projects)}")

with open('scripts/snu_projects_with_local_images.json', 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)
print("Saved to scripts/snu_projects_with_local_images.json")
