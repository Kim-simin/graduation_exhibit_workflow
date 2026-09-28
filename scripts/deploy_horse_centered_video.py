import subprocess
import os
import shutil

src_original = os.path.abspath("scripts/debug_frames/test_cropped.mp4") # wait, let's use the full source or downloaded mp4
# Let's check original source
original_backup = os.path.abspath("scripts/debug_frames/original_motion.mp4")
target_mp4 = os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")

if not os.path.exists(original_backup):
    shutil.copy2(target_mp4, original_backup)
    print("Backed up original video to:", original_backup)

# Process from original backup:
# Crop: width=864, height=1080, x=948, y=0
# Trim: 2.8s to 8.45s
temp_out = os.path.abspath("scripts/debug_frames/final_motion_poster.mp4")
cmd = [
    "ffmpeg", "-y",
    "-ss", "2.8",
    "-to", "8.45",
    "-i", original_backup,
    "-vf", "crop=864:1080:988:0",
    "-c:v", "libx264",
    "-crf", "18",
    "-preset", "slow",
    "-pix_fmt", "yuv420p",
    temp_out
]
res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
print("FFmpeg exit code:", res.returncode)

if res.returncode == 0 and os.path.exists(temp_out):
    shutil.copy2(temp_out, target_mp4)
    file_size = os.path.getsize(target_mp4)
    print(f"Successfully deployed centered horse video to {target_mp4} ({file_size / 1024 / 1024:.2f} MB)")
else:
    print("Failed to encode video!")
