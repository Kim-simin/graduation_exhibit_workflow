# scripts/inspect_png_vs_full.py
import os
from PIL import Image

admin_swu = "admin/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
if os.path.exists(admin_swu):
    files = sorted(os.listdir(admin_swu))
    print(f"Total files in admin SWU: {len(files)}")
    sample_pngs = [f for f in files if f.endswith('.png') and not f.endswith('_full.png')][:5]
    for p in sample_pngs:
        p_path = os.path.join(admin_swu, p)
        im = Image.open(p_path)
        print(f"PNG sample: {p} -> size: {im.size}, aspect: {im.size[1]/im.size[0]:.2f}")
        # check if matching _full exists
        base_num = p.replace('artwork_', '').replace('.png', '')
        full_cand = f"artwork_{base_num}_full.jpg"
        if full_cand in files:
            im_full = Image.open(os.path.join(admin_swu, full_cand))
            print(f"   Matching FULL: {full_cand} -> size: {im_full.size}, aspect: {im_full.size[1]/im_full.size[0]:.2f}")
