# scripts/analyze_target_images.py
import json
import os
from PIL import Image

def analyze_exhibition(exhibitions_file, target_id):
    if not os.path.exists(exhibitions_file):
        print(f"File not found: {exhibitions_file}")
        return

    with open(exhibitions_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    items = data if isinstance(data, list) else data.get('exhibitions', [])
    target = next((item for item in items if item.get('id') == target_id), None)
    if not target:
        print(f"Target ID {target_id} not found in {exhibitions_file}")
        return

    print(f"\n========================================================")
    print(f"Target: {target.get('title')} ({target.get('id')})")
    artworks = target.get('artworks', [])
    print(f"Total Artworks: {len(artworks)}")

    aspect_ratios = []
    missing_files = []
    tall_count = 0

    base_dirs = [
        "web/public",
        "admin/public",
        "my-exhibit-platform/public"
    ]

    for idx, art in enumerate(artworks):
        img_rel = art.get('imagePath') or art.get('image') or ""
        resolved_path = None
        for b in base_dirs:
            cand = os.path.join(b, img_rel.replace('/', os.sep))
            if os.path.exists(cand):
                resolved_path = cand
                break

        if not resolved_path:
            missing_files.append((idx, art.get('title'), img_rel))
            continue

        try:
            with Image.open(resolved_path) as im:
                w, h = im.size
                ratio = h / w  # aspect ratio (height / width)
                aspect_ratios.append((w, h, ratio))
                if ratio > 1.3:
                    tall_count += 1
                if idx < 5 or idx % 10 == 0:
                    print(f" Art[{idx:02d}]: '{art.get('title')}' -> Size: {w}x{h}, Aspect(H/W): {ratio:.2f}, File: {os.path.basename(resolved_path)}")
        except Exception as e:
            print(f" Error opening {resolved_path}: {e}")

    print(f"Summary for {target.get('id')}:")
    print(f" - Found images: {len(aspect_ratios)} / {len(artworks)}")
    print(f" - Missing images: {len(missing_files)}")
    print(f" - Tall images (H/W > 1.3): {tall_count} (out of {len(aspect_ratios)})")
    if aspect_ratios:
        max_ratio = max(r[2] for r in aspect_ratios)
        min_ratio = min(r[2] for r in aspect_ratios)
        avg_ratio = sum(r[2] for r in aspect_ratios) / len(aspect_ratios)
        print(f" - Aspect Ratio Min: {min_ratio:.2f}, Max: {max_ratio:.2f}, Avg: {avg_ratio:.2f}")

    if missing_files:
        print(f" First 3 missing: {missing_files[:3]}")

if __name__ == '__main__':
    analyze_exhibition('web/data/exhibitions.json', 'UNIV-2025-서울여자대학교-산업디자인학과')
    analyze_exhibition('web/data/exhibitions.json', 'UNIV-2025-세종대학교-디자인이노베이션전공-firstchase')
