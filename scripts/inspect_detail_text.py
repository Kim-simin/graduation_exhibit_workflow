import urllib.request
import re
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8', errors='replace')

html = fetch("https://dju26-design.co.kr/project/KANGSIN4")
# find all visible texts or paragraphs
paras = re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL)
print("Paragraphs found:", len(paras))
for p in paras:
    clean = re.sub(r'<[^>]+>', '', p).strip()
    if clean:
        print("P:", clean)

# Also check headings
headings = re.findall(r'<h[1-6][^>]*>(.*?)</h[1-6]>', html, re.DOTALL)
print("Headings:", len(headings))
for h in headings:
    clean = re.sub(r'<[^>]+>', '', h).strip()
    if clean:
        print("H:", clean)

# Check any other text containers
div_texts = re.findall(r'<div class="[^"]*(?:desc|summary|info|detail|intro|content)[^"]*">(.*?)</div>', html, re.DOTALL | re.IGNORECASE)
print("Div texts:", len(div_texts))
for d in div_texts[:5]:
    clean = re.sub(r'<[^>]+>', '', d).strip()
    if clean:
        print("DIV:", clean)

