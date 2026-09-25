import requests
import json
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    r = requests.get("http://localhost:3000/api/exhibitions", timeout=10)
    print("Status:", r.status_code)
    data = r.json()
    exhibitions = data.get("exhibitions", [])
    print(f"Total exhibitions returned by API: {len(exhibitions)}")
    
    daejin = next((e for e in exhibitions if "대진대" in e.get("university", "")), None)
    if daejin:
        print("Daejin Univ:", daejin.get("university"))
        print("Daejin Dept:", daejin.get("department"))
        artworks = daejin.get("artworks", [])
        print(f"Daejin artworks count: {len(artworks)}")
        print("Sample 5 artworks from API:")
        for a in artworks[:5]:
            print(f" - Title: {a.get('title')} | Dept: {a.get('department')} | Author: {a.get('author')}")
    else:
        print("Daejin not found in API response!")
        
except Exception as e:
    print("API Error:", e)
