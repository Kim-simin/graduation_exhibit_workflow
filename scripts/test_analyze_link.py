import sys
import json
import requests

def test_api():
    print("Testing /api/cards/analyze-link with Next.js and local Llama.cpp (Port 8080)...")
    url = "http://127.0.0.1:3000/api/cards/analyze-link"
    payload = {
        "url": "https://sidi.hongik.ac.kr",
        "year": "2026",
        "server_url": "http://127.0.0.1:8080"
    }
    try:
        res = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {res.status_code}")
        data = res.json()
        print(f"Status: {data.get('status')}")
        print(f"Engine: {data.get('engine')}")
        if data.get("status") == "SUCCESS":
            d = data.get("data", {})
            print(f"University: {d.get('university')}")
            print(f"Department: {d.get('department')}")
            print(f"Year: {d.get('year')}")
            print(f"Category: {d.get('category')}")
            print(f"Title: {d.get('title')}")
            print(f"Artworks detected: {len(d.get('artworks', []))}")
            return True
        else:
            print(f"Error: {data.get('error')}")
            return False
    except Exception as e:
        print(f"Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1)
