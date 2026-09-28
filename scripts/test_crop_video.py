import subprocess
import os
from PIL import Image

src_video = os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")
test_out = os.path.abspath("scripts/debug_frames/test_cropped.mp4")

# Let's crop: width=864, height=1080, x=918, y=0
# Note: 864 and 918 are even numbers, which H.264 requires.
cmd = [
    "ffmpeg", "-y",
    "-i", src_video,
    "-vf", "crop=864:1080:918:0",
    "-c:v", "libx264",
    "-crf", "18",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    test_out
]
res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
print("Crop status:", res.returncode)

# Now extract frames at 1s, 3s, 5s, 7s
for sec in [1, 3, 5, 7]:
    frame_path = f"scripts/debug_frames/cropped_frame_{sec}s.jpg"
    subprocess.run(["ffmpeg", "-y", "-ss", str(sec), "-i", test_out, "-vframes", "1", frame_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Saved:", frame_path)
