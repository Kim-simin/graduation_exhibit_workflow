import requests
from bs4 import BeautifulSoup
import json
import os

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

urls = [
    "http://sj-di.com/2025-info",
    "http://sj-di.com/2025-contact",
    "http://sj-di.com/2025-identity-design",
    "http://sj-di.com/2025-digital-media-project",
    "http://sj-di.com/2025-product-transportation-design",
    "http://sj-di.com/2025-product-system-design"
]

results = {}

for u in urls:
    name = u.split("/")[-1]
    print(f"Fetching {u}...")
    try:
        r = requests.get(u, headers=headers, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")
        
        # Save raw html
        with open(f"scripts/sejong_{name}.html", "w", encoding="utf-8") as f:
            f.write(r.text)
            
        links = []
        for a in soup.find_all("a", href=True):
            links.append({"href": a['href'], "text": a.get_text(strip=True)})
            
        images = []
        for img in soup.find_all("img"):
            src = img.get('src') or img.get('data-src') or img.get('srcset')
            alt = img.get('alt', '')
            images.append({"src": src, "alt": alt})
            
        text = soup.get_text(separator="\n", strip=True)
        
        results[name] = {
            "title": soup.title.string if soup.title else "",
            "text": text[:3000], # sample
            "full_text_len": len(text),
            "links_count": len(links),
            "images_count": len(images),
            "images": images[:15]
        }
    except Exception as e:
        results[name] = {"error": str(e)}

with open("scripts/sejong_pages_summary.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Done summary!")
