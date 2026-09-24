import json
import re
import urllib.request

def analyze_bundle():
    url = "https://hongiksidi.com/gs/2025/assets/index-O_Fsl0BK.js"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8", errors="ignore")
    
    print(f"Bundle length: {len(content)} chars")
    
    # Check for S3 URLs or JSON paths
    s3_matches = set(re.findall(r'https?://[a-zA-Z0-9.-]+\.amazonaws\.com/[^\s"\'`)]+', content))
    print("S3 matches:", len(s3_matches))
    for s in list(s3_matches)[:20]:
        print("  S3:", s)

    # Check for routes
    routes = set(re.findall(r'path:\s*["\']([^"\']+)["\']', content))
    print("Routes:", routes)

    # Check for keywords
    keywords = ["교수", "지도", "전시", "일정", "장소", "about", "works", "professor", "지도교수", "홍익"]
    for kw in keywords:
        matches = [m.start() for m in re.finditer(kw, content)]
        print(f"Keyword '{kw}': {len(matches)} occurrences")
        for pos in matches[:3]:
            snippet = content[max(0, pos-100):min(len(content), pos+150)]
            print(f"   [{kw} snippet]:", repr(snippet))

if __name__ == "__main__":
    analyze_bundle()
