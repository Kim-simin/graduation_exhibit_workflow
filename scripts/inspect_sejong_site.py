import requests
from bs4 import BeautifulSoup
import json
import re

url = "http://sj-di.com/2025-firstchase"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

resp = requests.get(url, headers=headers, timeout=15)
resp.encoding = resp.apparent_encoding or "utf-8"
html = resp.text

soup = BeautifulSoup(html, "html.parser")

# Find all links
links = []
for a in soup.find_all("a", href=True):
    href = a['href']
    text = a.get_text(strip=True)
    links.append({"href": href, "text": text})

# Find images
images = []
for img in soup.find_all("img"):
    src = img.get('src') or img.get('data-src')
    alt = img.get('alt', '')
    if src:
        images.append({"src": src, "alt": alt})

# Text extraction
text = soup.get_text(separator="\n", strip=True)

with open("scripts/sejong_main_links.json", "w", encoding="utf-8") as f:
    json.dump(links, f, ensure_ascii=False, indent=2)

with open("scripts/sejong_main_images.json", "w", encoding="utf-8") as f:
    json.dump(images, f, ensure_ascii=False, indent=2)

with open("scripts/sejong_main_text.txt", "w", encoding="utf-8") as f:
    f.write(text)

print(f"Status: {resp.status_code}")
print(f"Links count: {len(links)}")
print(f"Images count: {len(images)}")
print(f"Text length: {len(text)}")
