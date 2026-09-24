import urllib.request
import re
import json

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')

html = fetch("https://dju26-design.co.kr/designer")
unescaped = html.replace('\\"', '"').replace('\\\\', '\\')
# Search for patterns
matches = re.findall(r'"([a-zA-Z0-9_]+)":\s*\[', unescaped)
print("Keys with arrays:", set(matches))
korean_names = set(re.findall(r'"koreanName":\s*"([^"]+)"', unescaped))
print(f"Korean names found ({len(korean_names)}):", sorted(list(korean_names)))
