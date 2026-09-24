import urllib.request
import re

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8', errors='replace')

html = fetch("https://dju26-design.co.kr/project/KANGSIN4")
print("HTML preview:")
# remove long base64
clean_html = re.sub(r'data:image/[^;]+;base64,[^"\']+', '[BASE64]', html)
print(clean_html[:2000])
with open("scripts/project_detail_sample.html", "w", encoding="utf-8") as f:
    f.write(clean_html)
