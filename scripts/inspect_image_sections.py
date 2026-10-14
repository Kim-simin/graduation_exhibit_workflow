# scripts/inspect_image_sections.py
import os
import cv2
import numpy as np
from PIL import Image

def inspect_sample(img_path, label):
    if not os.path.exists(img_path):
        print(f"File not found: {img_path}")
        return

    im = Image.open(img_path)
    w, h = im.size
    print(f"\n[{label}] {os.path.basename(img_path)} ({w}x{h}, H/W={h/w:.2f})")

    # Convert to grayscale numpy array for edge and row-variance analysis
    # To be fast and memory efficient, just load the top min(h, 4000) pixels
    top_h = min(h, int(w * 3))
    crop_top = im.crop((0, 0, w, top_h))
    top_np = np.array(crop_top.convert('RGB'))

    # Calculate row-by-row standard deviation (content activity)
    row_std = np.std(top_np, axis=(1, 2))  # shape: (top_h,)
    
    # Find leading blank margin (std < 3)
    non_blank_rows = np.where(row_std > 5)[0]
    first_content_row = non_blank_rows[0] if len(non_blank_rows) > 0 else 0
    print(f"  First content row (y_start): {first_content_row}")

    # Look for candidate section breaks in range [w*0.8, w*1.6]
    # A section break often has a sharp drop in edge density or a local minimum in row variance / color transition
    min_cand_h = int(w * 0.9)
    max_cand_h = int(w * 1.5)
    print(f"  Candidate crop height range: [{min_cand_h}, {max_cand_h}]")

    # Also check if there is an existing thumbnail or poster
    # Check 1:1 aspect crop vs 3:4 or 4:5
    for ratio_name, target_ratio in [("1:1 (Square)", 1.0), ("4:5 (Standard)", 1.25), ("3:4 (Portrait)", 1.33)]:
        cand_h = int(w * target_ratio)
        if first_content_row + cand_h <= h:
            print(f"  Option {ratio_name}: y0={first_content_row}, y1={first_content_row + cand_h}, size={w}x{cand_h}")

# Inspect first 3 samples of SWU
swu_dir = "web/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과"
if os.path.exists(swu_dir):
    for f in sorted(os.listdir(swu_dir))[:3]:
        if f.endswith('_full.jpg') or f.endswith('.png'):
            inspect_sample(os.path.join(swu_dir, f), "SWU")

# Inspect first 3 samples of Sejong
sejong_dir = "web/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공"
if os.path.exists(sejong_dir):
    for f in sorted(os.listdir(sejong_dir))[:3]:
        if f.endswith('.jpg') and not f.startswith('main_poster'):
            inspect_sample(os.path.join(sejong_dir, f), "Sejong")
