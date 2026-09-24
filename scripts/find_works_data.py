import re
import urllib.request
import json

def find_works():
    url = "https://hongiksidi.com/gs/2025/assets/index-O_Fsl0BK.js"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8", errors="ignore")

    print(f"Total length: {len(content)}")

    # Search for work data patterns: studentName, title, images, workNo, etc.
    # Look for keywords like "studentName", "artist", "workNo", "thumbnail"
    matches = re.findall(r'(\w+):\s*\[\{.*?\}\]', content[:500000])
    print("Found array patterns:", len(matches))

    # Let's search for any occurrence of student names or work titles
    # Let's see where /project/:classId/:workNo is handled
    for kw in ["classId", "workNo", "works", "student", "thumbnail", "overview"]:
        pos_list = [m.start() for m in re.finditer(kw, content)]
        print(f"Keyword '{kw}': {len(pos_list)} occurrences")

    # Let's search for image filenames like .webp or .png or S3 bucket
    # In index.html og:image was "https://thedowntown.s3.ap-northeast-2.amazonaws.com/OG_image.png"
    # Is there a S3 bucket like thedowntown.s3.ap-northeast-2.amazonaws.com?
    s3_matches = set(re.findall(r'https?://thedowntown\.s3[a-zA-Z0-9.-]*\.amazonaws\.com/[^\s"\'`)]+', content))
    print(f"Direct S3 matches: {len(s3_matches)}")
    for s in list(s3_matches)[:10]:
        print("  S3:", s)

    # Let's search for relative image paths like /assets/ or /works/ or similar
    asset_paths = set(re.findall(r'["\'](/gs/2025/assets/[^"\']+)["\']', content))
    print(f"Asset paths: {len(asset_paths)}")
    for a in sorted(list(asset_paths))[:20]:
        print("  Asset:", a)

if __name__ == "__main__":
    find_works()
