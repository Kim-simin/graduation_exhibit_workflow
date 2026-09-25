import json
import os
import requests
from bs4 import BeautifulSoup
import urllib.parse
import time
import re

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

output_dir = "my-exhibit-platform/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공"
os.makedirs(output_dir, exist_ok=True)

# 1. Download poster
poster_url = "http://sj-di.com/wp-content/uploads/2025/10/251013-최종-포스터.jpg"
poster_local_path = os.path.join(output_dir, "main_poster_2025.jpg")
if not os.path.exists(poster_local_path):
    print("Downloading poster...")
    try:
        r = requests.get(poster_url, headers=headers, timeout=20)
        if r.status_code == 200:
            with open(poster_local_path, "wb") as f:
                f.write(r.content)
            print("Poster saved, size:", len(r.content))
        else:
            print("Poster download failed with status", r.status_code)
    except Exception as e:
        print("Poster download error:", e)

# 2. Load works links
with open("scripts/sejong_works_links.json", "r", encoding="utf-8") as f:
    raw_works = json.load(f)

# Deduplicate works by URL
unique_works = []
seen_urls = set()
for w in raw_works:
    u = w['url']
    if u not in seen_urls:
        seen_urls.add(u)
        unique_works.append(w)

print(f"Total unique works to scrape: {len(unique_works)}")

scraped_artworks = []

for idx, item in enumerate(unique_works):
    url = item['url']
    cat = item['category']
    broad_cat = item['broad_category']
    thumb_url = item.get('img_src', '')
    link_text = item.get('text', '')
    
    print(f"[{idx+1}/{len(unique_works)}] Scraping {url}...")
    work_data = {
        "index": idx + 1,
        "category": cat,
        "broad_category": broad_cat,
        "detail_url": url,
        "title": link_text,
        "subtitle": "",
        "designer": "",
        "email": "",
        "description": "",
        "image_urls": [],
        "local_image": "",
        "local_thumbnail": ""
    }
    
    try:
        r = requests.get(url, headers=headers, timeout=15)
        r.encoding = 'utf-8'
        soup = BeautifulSoup(r.text, "html.parser")
        
        # In a standard page on sj-di.com:
        # Title might be in entry-title or h1
        h1 = soup.find("h1")
        if h1 and h1.get_text(strip=True):
            work_data["title"] = h1.get_text(strip=True)
            
        # Look for content area
        content = soup.find(class_="entry-content") or soup.find(id="primary") or soup
        
        # Extract images
        page_images = []
        for img in content.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if src and "Favicon" not in src and "wp-includes" not in src:
                page_images.append(src)
        work_data["image_urls"] = page_images
        
        # Extract text lines
        lines = [s.strip() for s in content.stripped_strings]
        # Filter out common menu items
        menu_items = {"Identity Design", "Digital Media Project", "Product & Transportation Design", "Product System Design", "INFO", "CONTACT", "콘텐츠로 건너뛰기"}
        meaningful_lines = [l for l in lines if l not in menu_items and l != work_data["title"]]
        
        # Parse fields
        for line in meaningful_lines:
            if "@" in line and "." in line and not work_data["email"]:
                work_data["email"] = line
            elif len(line) <= 6 and not work_data["designer"] and not any(char.isdigit() for char in line):
                work_data["designer"] = line
            elif not work_data["subtitle"] and len(line) < 40:
                work_data["subtitle"] = line
            elif not work_data["description"]:
                work_data["description"] = line
            else:
                work_data["description"] += "\n" + line
                
        # Download at least one primary image for each work
        target_img_url = ""
        if page_images:
            target_img_url = page_images[0]
        elif thumb_url:
            target_img_url = thumb_url
            
        if target_img_url:
            ext = ".jpg"
            if ".png" in target_img_url.lower():
                ext = ".png"
            elif ".webp" in target_img_url.lower():
                ext = ".webp"
                
            img_filename = f"work_{idx+1:02d}_{re.sub(r'[^a-zA-Z0-9]', '', work_data['title'])[:20]}{ext}"
            local_img_path = os.path.join(output_dir, img_filename)
            rel_path = f"uploads/UNIV-2025-세종대학교-디자인이노베이션전공/{img_filename}"
            
            if not os.path.exists(local_img_path):
                try:
                    img_resp = requests.get(target_img_url, headers=headers, timeout=20)
                    if img_resp.status_code == 200:
                        with open(local_img_path, "wb") as img_f:
                            img_f.write(img_resp.content)
                        work_data["local_image"] = rel_path
                        work_data["local_thumbnail"] = rel_path
                    else:
                        work_data["local_image"] = target_img_url
                        work_data["local_thumbnail"] = target_img_url
                except Exception as img_err:
                    print(f"Error downloading image for {work_data['title']}: {img_err}")
                    work_data["local_image"] = target_img_url
                    work_data["local_thumbnail"] = target_img_url
            else:
                work_data["local_image"] = rel_path
                work_data["local_thumbnail"] = rel_path
        else:
            work_data["local_image"] = "uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg"
            work_data["local_thumbnail"] = "uploads/UNIV-2025-세종대학교-디자인이노베이션전공/main_poster_2025.jpg"
            
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        
    scraped_artworks.append(work_data)
    time.sleep(0.1) # Be gentle

with open("scripts/sejong_artworks_complete.json", "w", encoding="utf-8") as f:
    json.dump(scraped_artworks, f, ensure_ascii=False, indent=2)

print(f"Scraped and saved {len(scraped_artworks)} artworks successfully!")
