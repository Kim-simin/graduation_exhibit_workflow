import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/art_snu_design.html', 'r', encoding='utf-8') as f:
    html = f.read()

links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
print(f"Total links: {len(links)}")
for href, text in links:
    clean_t = re.sub(r'<[^>]+>', '', text).strip()
    if clean_t:
        print(f"[{clean_t}] -> {href}")
