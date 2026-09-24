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
    # SNU Design official domain
    url = 'https://design.snu.ac.kr/'
    html = fetch(url)
    print("Fetched design.snu.ac.kr:", len(html))
    
    # Try faculty page
    faculty_urls = [
        'https://design.snu.ac.kr/people/faculty',
        'https://design.snu.ac.kr/faculty',
        'https://design.snu.ac.kr/ko/people/faculty',
        'https://design.snu.ac.kr/about/faculty'
    ]
    for fu in faculty_urls:
        res = fetch(fu)
        print(f"{fu} -> len {len(res)}")
        if "안성모" in res or "이장섭" in res:
            print("Found professors in", fu)
            with open('scripts/snu_official_faculty.html', 'w', encoding='utf-8') as f:
                f.write(res)
            break

if __name__ == '__main__':
    main()
