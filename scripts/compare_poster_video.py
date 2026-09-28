import cv2
import numpy as np

# Load poster and frame
from PIL import Image

poster_img = Image.open("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg")
frame_img = Image.open("scripts/debug_frames/frame_4s.jpg")

pw, ph = poster_img.size
fw, fh = frame_img.size

print(f"Poster aspect ratio (w/h): {pw/ph:.4f} ({pw}x{ph})")
print(f"Video aspect ratio (w/h): {fw/fh:.4f} ({fw}x{fh})")
