from PIL import Image
import numpy as np

frame = Image.open("scripts/debug_frames/frame_4s.jpg")
arr = np.array(frame.convert("L"))

# Upper right area: y from 100 to 500, x from 1400 to 1920
head_area = arr[100:500, 1400:1920]
head_pixels = np.where(head_area < 200)

if len(head_pixels[0]) > 0:
    min_x = 1400 + np.min(head_pixels[1])
    max_x = 1400 + np.max(head_pixels[1])
    min_y = 100 + np.min(head_pixels[0])
    max_y = 100 + np.max(head_pixels[0])
    print(f"Horse head bounding box: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")

# Poster head bounding box:
poster = Image.open("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg")
parr = np.array(poster.convert("L"))
pw, ph = poster.size
phead = parr[int(ph*0.05):int(ph*0.35), int(pw*0.5):pw]
phpix = np.where(phead < 200)
if len(phpix[0]) > 0:
    p_min_x = int(pw*0.5) + np.min(phpix[1])
    p_max_x = int(pw*0.5) + np.max(phpix[1])
    print(f"Poster head relative x: [{p_min_x/pw:.3f}, {p_max_x/pw:.3f}]")
