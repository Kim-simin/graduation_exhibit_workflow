import subprocess
import os

video_path = os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")

# Let's check frames at 0.5s, 1.0s, 1.5s, 2.0s
for t in [0.5, 1.0, 1.5, 2.0]:
    out_frame = f"scripts/debug_frames/check_start_{t}s.jpg"
    subprocess.run(["ffmpeg", "-y", "-ss", str(t), "-i", video_path, "-vframes", "1", out_frame], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Saved: {out_frame}")
