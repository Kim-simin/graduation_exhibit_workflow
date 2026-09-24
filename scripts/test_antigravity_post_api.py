import urllib.request
import json
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def test_post_api():
    url = "http://localhost:3000/api/research/antigravity-intake"
    payload = {
        "target_url": "https://expo.cs.kookmin.ac.kr/",
        "university": "국민대학교",
        "department": "소프트웨어학부",
        "year": "2026",
        "max_artworks": 5
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        print("[POST /api/research/antigravity-intake] Sending request...")
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_body = json.loads(resp.read().decode('utf-8'))
            print("Status:", resp.status)
            print("Response:", json.dumps(resp_body, ensure_ascii=False, indent=2)[:500])
    except Exception as e:
        print("Error during POST:", e)

if __name__ == "__main__":
    test_post_api()
