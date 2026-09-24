import urllib.request
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode('utf-8', errors='ignore')

def inspect_people():
    html = fetch('https://2025.snudesignweek.com/people')
    # Save raw html for inspection
    with open('scripts/snu_people.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Saved snu_people.html")

    # Extract all text or json snippets
    # Look for professor or faculty sections
    print("\n--- Searching for professors / faculty in /people ---")
    matches = re.findall(r'(교수|faculty|professor|지도교수|director|위원장|학부장)', html, re.I)
    print("Keyword matches in /people:", len(matches), set(matches))

def inspect_about():
    html = fetch('https://2025.snudesignweek.com/about')
    with open('scripts/snu_about.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Saved snu_about.html")
    matches = re.findall(r'(교수|faculty|professor|지도교수|director|위원장|학부장)', html, re.I)
    print("Keyword matches in /about:", len(matches), set(matches))

def inspect_works():
    html = fetch('https://2025.snudesignweek.com/works')
    with open('scripts/snu_works.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Saved snu_works.html")

if __name__ == '__main__':
    inspect_about()
    inspect_people()
    inspect_works()
