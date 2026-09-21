import sys
import json
import requests

def test_manual():
    print("Testing /api/research/manual...")
    url = "http://127.0.0.1:3000/api/research/manual"
    payload = {
        "card_id": "TEST-HONGIK-2026",
        "target_url": "https://sidi.hongik.ac.kr",
        "univ": "홍익대학교",
        "dept": "시각디자인과",
        "year": "2026",
        "category": "디자인·UX/UI"
    }
    try:
        res = requests.post(url, json=payload, timeout=60)
        print(f"Status Code: {res.status_code}")
        data = res.json()
        print(f"Status: {data.get('status')}")
        if data.get("status") == "SUCCESS":
            cap = data.get("capture_data", {})
            print(f"Page Title: {cap.get('page_title')}")
            print(f"Main Poster: {cap.get('main_poster')}")
            print(f"Works Count: {len(cap.get('works', []))}")
            return True
        else:
            print(f"Error: {data.get('error')}")
            return False
    except Exception as e:
        print(f"Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_manual()
    sys.exit(0 if success else 1)
