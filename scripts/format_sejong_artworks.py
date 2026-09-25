import json
import re

with open("scripts/sejong_artworks_complete.json", "r", encoding="utf-8") as f:
    raw_list = json.load(f)

# Filter out non-project pages (like category hubs)
valid_artworks = []
for item in raw_list:
    u = item['detail_url']
    if u in [
        "http://sj-di.com/2025-product-transportation",
        "http://sj-di.com/2025-product-transportation-design",
        "http://sj-di.com/2025-product-system-design",
        "http://sj-di.com/2025-identity-design",
        "http://sj-di.com/2025-digital-media-project",
        "http://sj-di.com/2025-info",
        "http://sj-di.com/2025-contact"
    ]:
        continue
    
    # Clean description
    desc = item['description']
    # remove "TITLE - 세종대학교 디자인이노베이션전공 졸업전시회 아카이브" from description
    desc = re.sub(r'.*?세종대학교 디자인이노베이션전공 졸업전시회 아카이브\s*', '', desc).strip()
    
    # Ensure title is clean
    title = item['title'].strip()
    if not title or title in ["Identity Design", "Digital Media Project", "Product & Transportation Design", "Product System Design"]:
        continue
        
    designer = item['designer'].strip()
    if designer in ["Instagram", "Behance", "Vimeo", "Menu", ""]:
        # Try finding designer from URL or contact mapping
        # E.g. http://sj-di.com/%ea%b3%a0%eb%8b%a4%ec%98%81-i -> 고다영
        match = re.search(r'http://sj-di.com/(?:%[0-9a-fA-F]{2})+', u)
        if match:
            import urllib.parse
            decoded = urllib.parse.unquote(u.split("/")[-1]).split("-")[0]
            if len(decoded) < 15 and not decoded.startswith("http"):
                designer = decoded
                
    # Build artwork object
    sub = item['subtitle'].strip()
    full_desc = f"{sub}\n\n{desc}" if sub and sub not in desc else desc
    if item['email']:
        full_desc = f"디자이너: {designer} ({item['email']})\n\n{full_desc}"
    elif designer:
        full_desc = f"디자이너: {designer}\n\n{full_desc}"
        
    artwork_obj = {
        "title": f"[{item['category']}] {title}",
        "student_name": designer if designer else "세종대학교 디자인이노베이션전공",
        "image": item['local_image'],
        "thumbnail": item['local_thumbnail'],
        "screenshot_path": item['local_image'],
        "description": full_desc.strip(),
        "inferred_role": "디자이너" if item['broad_category'] == "시각디자인" else "제품/운송 디자이너",
        "detail_url": u
    }
    valid_artworks.append(artwork_obj)

print(f"Total valid artworks: {len(valid_artworks)}")

with open("scripts/sejong_artworks_formatted.json", "w", encoding="utf-8") as f:
    json.dump(valid_artworks, f, ensure_ascii=False, indent=2)
