import subprocess

for t in [0.2, 1.5, 2.5, 3.5, 4.5]:
    out_frame = f"scripts/debug_frames/final_test_{t}s.jpg"
    subprocess.run(["ffmpeg", "-y", "-ss", str(t), "-i", "scripts/debug_frames/horse_centered.mp4", "-vframes", "1", out_frame], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("Saved:", out_frame)
