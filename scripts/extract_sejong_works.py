import json
from bs4 import BeautifulSoup
import os
import re

categories = [
    ("Identity Design", "scripts/sejong_2025-identity-design.html", "시각디자인"),
    ("Digital Media Project", "scripts/sejong_2025-digital-media-project.html", "시각디자인"),
    ("Product & Transportation Design", "scripts/sejong_2025-product-transportation-design.html", "공업디자인"),
    ("Product System Design", "scripts/sejong_2025-product-system-design.html", "공업디자인")
]

all_works = []

for cat_name, file_path, broad_cat in categories:
    if not os.path.exists(file_path):
        continue
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()
    soup = BeautifulSoup(html, "html.parser")
    
    # Check elements: WordPress usually has blocks or post items or entry content
    # Let's inspect links and parent containers
    # Find all articles, figures, or links with images
    content = soup.find(id="content") or soup.find(class_="site-content") or soup
    
    # Look for links that link to project pages
    proj_links = []
    for a in content.find_all("a", href=True):
        href = a['href']
        if href in ["#content", "http://sj-di.com/", "http://sj-di.com/2025-firstchase"]:
            continue
        if "2025-info" in href or "2025-contact" in href or "instagram.com" in href or "behance.net" in href or "vimeo.com" in href:
            continue
        if "2025-identity-design" in href or "2025-digital-media-project" in href or "2025-product-transportation-design" in href or "2025-product-system-design" in href:
            continue
        
        # This might be a project page link!
        img = a.find("img")
        img_src = ""
        if img:
            img_src = img.get("src") or img.get("data-src") or ""
        
        text = a.get_text(strip=True)
        proj_links.append({
            "category": cat_name,
            "broad_category": broad_cat,
            "url": href,
            "text": text,
            "img_src": img_src
        })
    
    print(f"{cat_name}: found {len(proj_links)} project links")
    all_works.extend(proj_links)

print(f"Total works found via links: {len(all_works)}")
with open("scripts/sejong_works_links.json", "w", encoding="utf-8") as f:
    json.dump(all_works, f, ensure_ascii=False, indent=2)
