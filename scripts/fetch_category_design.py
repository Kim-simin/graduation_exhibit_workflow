import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

req = urllib.request.Request('https://art.snu.ac.kr/category/design/', headers=headers)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print("Fetched length:", len(html))
with open('scripts/art_category_design.html', 'w', encoding='utf-8') as f:
    f.write(html)

links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.DOTALL)
print(f"Total links: {len(links)}")
for href, text in links:
    clean_t = re.sub(r'<[^>]+>', '', text).strip()
    if clean_t and ('교수' in clean_t or 'faculty' in href.lower() or 'people' in href.lower()):
        print(f"[{clean_t}] -> {href}")

profs = ["안성모", "이장섭", "김신혜", "배민기", "이성용", "이준원", "임승빈", "조상은"]
for p in profs:
    print(p, "in html?", p in html)
