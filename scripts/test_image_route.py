import urllib.request
import urllib.parse

# Test fetching image through /api/images/
encoded_path = urllib.parse.quote("captures/UNIV-2026-인천대학교-컴퓨터공학부-7899/work_1.png")
url = f"http://localhost:3000/api/images/{encoded_path}"

print(f"Requesting: {url}")
try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        print(f"Status: {resp.status}")
        print(f"Content-Type: {resp.headers.get('Content-Type')}")
        data = resp.read()
        print(f"Read {len(data)} bytes successfully!")
except Exception as e:
    print(f"Error: {e}")
