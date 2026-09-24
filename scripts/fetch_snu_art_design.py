import urllib.request
import re
import json

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

def fetch(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        return f"Error: {e}"

def main():
    pages = [
        'https://art.snu.ac.kr/design/',
        'https://art.snu.ac.kr/design/faculty/',
        'https://art.snu.ac.kr/design/people/',
        'https://art.snu.ac.kr/faculty/',
        'https://art.snu.ac.kr/people/faculty/'
    ]
    for p in pages:
        res = fetch(p)
        print(f"{p} -> length: {len(res)}")
        if "안성모" in res or "이장섭" in res:
            print("MATCH FOUND IN:", p)
            with open('scripts/snu_art_faculty.html', 'w', encoding='utf-8') as f:
                f.write(res)
            break

if __name__ == '__main__':
    main()
