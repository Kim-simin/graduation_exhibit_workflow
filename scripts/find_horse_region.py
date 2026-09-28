from PIL import Image
import numpy as np

frame = Image.open("scripts/debug_frames/frame_4s.jpg")
poster = Image.open("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg")

fw, fh = frame.size # 1920, 1080
pw, ph = poster.size # 1684, 2384

# Let's find where non-white pixels are in frame
arr = np.array(frame.convert("L"))
# In frame_4s, background is white (255)
non_white = np.where(arr < 250)
if len(non_white[0]) > 0:
    min_y, max_y = np.min(non_white[0]), np.max(non_white[0])
    min_x, max_x = np.min(non_white[1]), np.max(non_white[1])
    print(f"Non-white bounding box in video: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
    print(f"Width: {max_x - min_x}, Height: {max_y - min_y}")

# In the video, the horse and graphics:
# Let's see what happens if we crop with aspect ratio 4:5 or 0.706 (poster aspect ratio):
# Height is 1080.
# If height is 1080, width for 4:5 (0.8) is 1080 * 0.8 = 864.
# If height is 1080, width for poster aspect ratio (0.7064) is 1080 * 0.7064 = 763.
# Where is the horse horizontally?
# Let's generate crops centered around different x coordinates and save them to inspect!
for center_x in [1300, 1350, 1400, 1450, 1485, 1520]:
    crop_w = int(1080 * 0.8) # 864
    x1 = max(0, min(fw - crop_w, center_x - crop_w // 2))
    x2 = x1 + crop_w
    cropped = frame.crop((x1, 0, x2, fh))
    cropped.save(f"scripts/debug_frames/crop_cx_{center_x}_w864.jpg")
    print(f"Saved crop for center_x={center_x}: [{x1}, 0, {x2}, {fh}]")

