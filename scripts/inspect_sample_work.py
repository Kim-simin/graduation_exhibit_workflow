import requests
from bs4 import BeautifulSoup
import urllib.parse
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

url = "http://sj-di.com/%ea%b3%a0%eb%8b%a4%ec%98%81-i"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

r = requests.get(url, headers=headers, timeout=15)
r.encoding = 'utf-8'
soup = BeautifulSoup(r.text, "html.parser")

print("Title:", soup.title.string if soup.title else "")
text = soup.get_text(separator="\n", strip=True)
print("Text preview:\n", text[:1500])

images = []
for img in soup.find_all("img"):
    src = img.get('src') or img.get('data-src')
    if src:
        images.append(src)
print("Images count:", len(images))
for img in images[:10]:
    print(" -", img)

with open("scripts/sejong_sample_work.html", "w", encoding="utf-8") as f:
    f.write(r.text)

