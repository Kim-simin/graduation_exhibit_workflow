import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

req = urllib.request.Request('https://art.snu.ac.kr/design/', headers=headers)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

with open('scripts/art_snu_design.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Find all links
links = re.findall(r'href="([^"]+)"', html)
faculty_links = [l for l in links if 'faculty' in l or 'people' in l or 'prof' in l or 'member' in l]
print("Faculty-related links:", set(faculty_links))

# Check for professors in html
profs = ["안성모", "이장섭", "김신혜", "배민기", "이성용", "이준원", "임승빈", "조상은"]
for p in profs:
    print(p, "in html?", p in html)
