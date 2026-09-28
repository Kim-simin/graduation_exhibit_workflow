import subprocess
import os

video_path = os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")
out_dir = os.path.abspath("scripts/debug_frames")
os.makedirs(out_dir, exist_ok=True)

# 1. Probe video info using ffmpeg
cmd = ["ffmpeg", "-i", video_path]
res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
print("=== FFMPEG INFO ===")
for line in res.stderr.splitlines():
    if "Stream" in line or "Duration" in line:
        print(line)

# 2. Extract frames at 0s, 2s, 4s, 6s
for sec in [0, 1, 2, 4, 6]:
    out_frame = os.path.join(out_dir, f"frame_{sec}s.jpg")
    subprocess.run(["ffmpeg", "-y", "-ss", str(sec), "-i", video_path, "-vframes", "1", out_frame], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Saved: {out_frame} (exists: {os.path.exists(out_frame)})")
