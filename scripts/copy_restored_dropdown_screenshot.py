import shutil
import os

src = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26\.system_generated\steps\13303\media_0.png"
dst = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26\step_18_restored_dropdown.png"

if os.path.exists(src):
    shutil.copy2(src, dst)
    print(f"Copied screenshot to {dst} ({os.path.getsize(dst)} bytes)")
else:
    print(f"Source file not found: {src}")
