import urllib.request
import re

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read().decode('utf-8', errors='replace')

html = fetch("https://dju26-design.co.kr/project")
print(f"Total HTML len: {len(html)}")

# Find script contents or large blocks
scripts = re.findall(r'<script([^>]*)>(.*?)</script>', html, re.DOTALL)
print(f"Found {len(scripts)} scripts")
for i, (attrs, content) in enumerate(scripts):
    print(f"Script {i} (len {len(content)}): attrs='{attrs}' preview='{content[:150]}'")

# Check if there are base64 strings or SVG or data
svgs = re.findall(r'<svg[^>]*>.*?</svg>', html, re.DOTALL)
print(f"SVGs found: {len(svgs)}, total svg length: {sum(len(s) for s in svgs)}")

# Also look for Unicode escape sequences like \uac00
unicode_escapes = re.findall(r'\\u[0-9a-fA-F]{4}', html)
print(f"Unicode escape sequences found: {len(unicode_escapes)}")
if unicode_escapes:
    # let's decode some
    sample_text = html[html.find('\\u'):html.find('\\u') + 500]
    try:
        decoded = sample_text.encode('utf-8').decode('unicode_escape')
        print(f"Decoded sample: {decoded[:200]}")
    except Exception as e:
        print("Decode error:", e)
