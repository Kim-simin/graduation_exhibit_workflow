import subprocess
import os

video_path = os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")

# Extract frame at 2.0s, 2.5s, 8.0s, 8.4s
for t in [2.0, 2.5, 8.0, 8.4]:
    out_frame = f"scripts/debug_frames/loop_check_{t}s.jpg"
    subprocess.run(["ffmpeg", "-y", "-ss", str(t), "-i", video_path, "-vframes", "1", out_frame], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Saved: {out_frame}")
