import shutil
import os

ARTIFACT_DIR = r"C:\Users\USER\.gemini\antigravity\brain\b230d1db-c8fe-4832-a784-442bd1dddf26"
SOURCE_DIR = r"C:\Users\USER\AppData\Local\Programs\antigravity"

files = ["step_11_approval_queue.png", "step_11_content_inspector.png"]

for f in files:
    src = os.path.join(SOURCE_DIR, f)
    dst = os.path.join(ARTIFACT_DIR, f)
    if os.path.exists(src):
        shutil.copyfile(src, dst)
        print(f"Copied {src} -> {dst}")
    else:
        print(f"File not found: {src}")
