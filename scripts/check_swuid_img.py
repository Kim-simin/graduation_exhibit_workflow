import urllib.request
import re

def check_images():
    base = "https://swuid2025.com"
    candidates = [
        "/images/bg/mobile_main.webp",
        "/images/bg/main.webp",
        "/images/bg/main.png",
        "/images/bg/desktop_main.webp",
        "/images/bg/water-ring-with-vector.png",
        "/images/bg/about-wave.png",
    ]
    for c in candidates:
        url = base + c
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
            res = urllib.request.urlopen(req)
            print(f"Found {c}: {res.status} {res.headers.get('Content-Length')} bytes, type: {res.headers.get('Content-Type')}")
        except Exception as e:
            print(f"Not found {c}: {e}")

if __name__ == '__main__':
    check_images()
