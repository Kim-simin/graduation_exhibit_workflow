import urllib.request
import urllib.error

urls = [
    "http://localhost:3000/opportunities",
    "http://localhost:3000/",
    "http://localhost:3000/students",
    "http://localhost:3000/professors",
]

for u in urls:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as resp:
            print(f"{u} -> {resp.status} (length: {len(resp.read())})")
    except urllib.error.HTTPError as e:
        print(f"{u} -> HTTPError {e.code} ({e.reason})")
    except Exception as e:
        print(f"{u} -> Error: {e}")
