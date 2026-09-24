import urllib.request
import os

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

urls = [
    "https://dju26-design.co.kr/opengraph-image.png",
    "https://asset.dju26-design.co.kr/poster.mp4",
    "https://dju26-design.co.kr/assets/home/visual-identity.png"
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            print(f"URL {u}: status {resp.status}, length: {len(data)} bytes")
    except Exception as e:
        print(f"URL {u}: error {e}")
