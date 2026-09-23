"""
scripts/test_kookmin_assets.py
Tests accessibility of Kookmin Expo images, posters, and PDFs.
"""

import urllib.request

BASE_URL = "https://expo.cs.kookmin.ac.kr"

test_urls = [
    "/images/posters/poster-2026.jpg",
    "/teams/preview/team-01.png",
    "/teams/preview/team-02.webp",
    "/teams/preview/team-07.webp",
    "/teams/pdf/team-02.pdf",
    "/teams/preview/team-40.webp"
]

print("Testing asset accessibility on https://expo.cs.kookmin.ac.kr...")
for path in test_urls:
    full_url = BASE_URL + path
    try:
        req = urllib.request.Request(full_url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "")
            content_len = resp.headers.get("Content-Length", "unknown")
            print(f"  [OK] {resp.status} - {path} ({content_type}, {content_len} bytes)")
    except Exception as e:
        print(f"  [ERR] {path} -> {e}")
