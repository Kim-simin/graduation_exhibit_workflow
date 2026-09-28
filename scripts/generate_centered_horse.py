import subprocess
import os

src_video = os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")
test_out = os.path.abspath("scripts/debug_frames/horse_centered.mp4")

# Crop width=864, height=1080, x=948, y=0
# Trim from 2.8s to 8.4s (5.6s of continuous horse motion)
cmd = [
    "ffmpeg", "-y",
    "-ss", "2.8",
    "-to", "8.45",
    "-i", src_video,
    "-vf", "crop=864:1080:948:0",
    "-c:v", "libx264",
    "-crf", "18",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    test_out
]
res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print("Return code:", res.returncode)

# Check duration and frames
cmd2 = ["ffmpeg", "-i", test_out]
res2 = subprocess.run(cmd2, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
for line in res2.stderr.splitlines():
    if "Duration" in line or "Stream" in line:
        print(line)
