# scripts/inspect_sejong_files.py
import os
from PIL import Image

admin_sejong = "admin/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공"
if os.path.exists(admin_sejong):
    files = sorted(os.listdir(admin_sejong))
    print(f"Total files in admin Sejong: {len(files)}")
    print("Files:", files[:10])
    for f in files[:5]:
        if f.endswith('.jpg') or f.endswith('.png'):
            im = Image.open(os.path.join(admin_sejong, f))
            print(f"  {f} -> size: {im.size}, aspect(H/W): {im.size[1]/im.size[0]:.2f}")
