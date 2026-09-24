import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

url = 'https://art.snu.ac.kr/category/design/?catemenu=Faculty&type=major'
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print("Fetched faculty page length:", len(html))
with open('scripts/art_snu_faculty.html', 'w', encoding='utf-8') as f:
    f.write(html)

profs = ["안성모", "이장섭", "김신혜", "배민기", "이성용", "이준원", "임승빈", "조상은"]
for p in profs:
    print(p, "in html?", p in html)

# Let's find all text blocks or names in the faculty page
names = re.findall(r'<h[234][^>]*>(.*?)</h[234]>', html)
print("Headings:", [re.sub(r'<[^>]+>', '', n).strip() for n in names if re.sub(r'<[^>]+>', '', n).strip()])
