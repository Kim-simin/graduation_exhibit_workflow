from PIL import Image
import numpy as np
import cv2

poster = Image.open("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg")
frame = Image.open("scripts/debug_frames/frame_4s.jpg")

# Video frame size: 1920x1080
# dx = 896, dy = 0, width = 768, height = 1080 (768 is divisible by 16 for H.264)
# Let's crop frame at (896, 0, 896+768, 1080)
crop_w = 768
crop_h = 1080
dx = 896
frame_cropped = frame.crop((dx, 0, dx + crop_w, crop_h))

# Poster resized to 768x1080
poster_resized = poster.resize((crop_w, crop_h), Image.Resampling.LANCZOS)

# Test 1: Just cropped video
frame_cropped.save("scripts/debug_frames/test_frame_cropped.jpg")

# Test 2: Composite poster text onto cropped video:
# Poster has black text on white areas. In frame_cropped, those areas are white.
# If we do dark-minimum: np.minimum(video, poster), the black text from poster will be preserved,
# and any dark pixels from the video (the horse motion) will also be preserved!
v_arr = np.array(frame_cropped)
p_arr = np.array(poster_resized)
composite = np.minimum(v_arr, p_arr)
composite_img = Image.fromarray(composite)
composite_img.save("scripts/debug_frames/test_composite_with_text.jpg")

print("Saved test_frame_cropped.jpg and test_composite_with_text.jpg")
