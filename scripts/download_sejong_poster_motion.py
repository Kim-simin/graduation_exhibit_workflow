import urllib.request
import os

url = "http://sj-di.com/wp-content/uploads/2025/10/final-web.mp4"
dest_paths = [
    os.path.abspath("my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4"),
    os.path.abspath("public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4")
]

print(f"Downloading from {url}...")
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=30) as response:
    data = response.read()
    print(f"Downloaded {len(data)} bytes.")

for p in dest_paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(data)
    print(f"Saved to {p} ({os.path.getsize(p)} bytes)")

print("Done!")
