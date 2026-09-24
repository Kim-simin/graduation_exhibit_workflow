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
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode('utf-8', errors='replace')

html = fetch("https://www.daejin.ac.kr/vvd/sub01_03.do")
print("VVD HTML len:", len(html))
print("Preview:\n", html[:1000])

# Look for professors or faculty links in the page
links = set(re.findall(r'href="([^"]+)"', html))
for l in sorted(links):
    if 'sub' in l or 'prof' in l or 'fac' in l or '0' in l:
        print("Link:", l)
