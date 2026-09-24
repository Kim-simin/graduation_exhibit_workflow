import urllib.request
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def fetch(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode('utf-8', errors='ignore')

def main():
    endpoints = ['https://2025.snudesignweek.com/about', 'https://2025.snudesignweek.com/people', 'https://2025.snudesignweek.com/works']
    for ep in endpoints:
        html = fetch(ep)
        print(f"=== {ep} ===")
        print("HTML length:", len(html))
        # Look for scripts or RSC chunks
        scripts = re.findall(r'<script[^>]*src="([^"]+)"', html)
        print("Scripts:", scripts[:5])
        # Look for push payloads
        pushes = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html)
        print(f"Found {len(pushes)} Next.js RSC pushes")
        sample_text = re.sub(r'<[^>]+>', ' ', html[:2000])
        print("Snippet:", ' '.join(sample_text.split()[:50]))

if __name__ == '__main__':
    main()
