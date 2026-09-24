import re
import urllib.request
import json

def extract_bundle():
    url = "https://hongiksidi.com/gs/2025/assets/index-O_Fsl0BK.js"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8", errors="ignore")

    print(f"Total bundle length: {len(content)}")

    # Search for Village A or work arrays
    # Look for patterns like classId: "A" or id: "A" or student names
    for v in ["Village A", "17 Ways to Take Off", "Hyojin An"]:
        pos = content.find(v)
        print(f"Pos of '{v}': {pos}")
    with open("scripts/hongik_dump.txt", "w", encoding="utf-8") as f:
        f.write(content[900000:960000])
    print("Wrote 60000 chars around Village A to scripts/hongik_dump.txt")


if __name__ == "__main__":
    extract_bundle()
