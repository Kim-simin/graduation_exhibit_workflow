import urllib.request
import json
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_api():
    url = "http://localhost:3000/api/research/antigravity-intake"
    # First test GET
    try:
        req = urllib.request.Request(url, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("[GET /api/research/antigravity-intake] Status:", resp.status)
            print("Response:", json.dumps(data, ensure_ascii=False, indent=2)[:300])
    except Exception as e:
        print("[GET] Server not running or error:", e)

if __name__ == "__main__":
    test_api()
