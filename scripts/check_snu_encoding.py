import urllib.request
import gzip

req = urllib.request.Request(
    'https://2025.snudesignweek.com/about',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
)

with urllib.request.urlopen(req) as resp:
    headers = dict(resp.headers)
    raw = resp.read()
    print("Content-Type:", headers.get('Content-Type'))
    print("Content-Encoding:", headers.get('Content-Encoding'))
    if headers.get('Content-Encoding') == 'gzip' or raw[:2] == b'\x1f\x8b':
        raw = gzip.decompress(raw)
    
    # Try utf-8 decode
    text = raw.decode('utf-8', errors='replace')
    print("Decoded length:", len(text))
    print("Contains '디자인'?", '디자인' in text)
    print("Contains '서울대'?", '서울대' in text)
    with open('scripts/snu_about_clean.html', 'w', encoding='utf-8') as f:
        f.write(text)
