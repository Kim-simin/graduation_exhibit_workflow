import urllib.request
import re

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8', errors='replace')

html = fetch("https://dju26-design.co.kr/designer/kwon-min-soo21")
clean_html = re.sub(r'data:image/[^;]+;base64,[^"\']+', '[BASE64]', html)
with open("scripts/designer_sample.html", "w", encoding="utf-8") as f:
    f.write(clean_html)

# Look for designer name, email, instagram, statement
texts = re.findall(r'>([^<]{2,})<', clean_html)
print("Designer page visible texts:")
for t in texts[:30]:
    t = t.strip()
    if t and not t.startswith('{') and not t.startswith('function'):
        print(" ", t)
