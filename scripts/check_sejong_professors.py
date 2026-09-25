import requests
from bs4 import BeautifulSoup
import re
import json

# Check sj-di.com home page
r = requests.get("http://sj-di.com/", headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
r.encoding = 'utf-8'
soup = BeautifulSoup(r.text, "html.parser")

links = [a['href'] for a in soup.find_all("a", href=True)]
print("sj-di.com home title:", soup.title.string if soup.title else "")
print("sj-di.com home links:", set(links))

# Check if there is professor or faculty mentioned in sj-di.com
prof_keywords = ["교수", "지도교수", "faculty", "professor", "지도"]
matches = []
for p in soup.find_all(text=True):
    for kw in prof_keywords:
        if kw in p:
            matches.append(p.strip())
print("Matches in home:", matches)

# Check sejong_2025-info.html
with open("scripts/sejong_2025-info.html", "r", encoding="utf-8") as f:
    info_html = f.read()
info_soup = BeautifulSoup(info_html, "html.parser")
info_matches = []
for p in info_soup.find_all(text=True):
    for kw in prof_keywords:
        if kw in p:
            info_matches.append(p.strip())
print("Matches in 2025-info:", info_matches)

# Check sejong_2025-contact.html
with open("scripts/sejong_2025-contact.html", "r", encoding="utf-8") as f:
    contact_html = f.read()
contact_soup = BeautifulSoup(contact_html, "html.parser")
contact_matches = []
for p in contact_soup.find_all(text=True):
    for kw in prof_keywords:
        if kw in p:
            contact_matches.append(p.strip())
print("Matches in 2025-contact:", contact_matches)
