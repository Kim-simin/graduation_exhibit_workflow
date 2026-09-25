import os
import glob

temp_patterns = [
    "scripts/sejong_*.html",
    "scripts/sejong_*.txt",
    "scripts/sejong_*.json"
]

for pat in temp_patterns:
    for f in glob.glob(pat):
        try:
            os.remove(f)
            print(f"Removed temp file: {f}")
        except Exception as e:
            print(f"Error removing {f}: {e}")
