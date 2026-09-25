import json
import os

targets = [
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

def map_snu_dept(title: str) -> str:
    title_upper = title.upper()
    # Check Industrial tags
    if any(tag in title_upper for tag in ["[PRODUCT INTERACTION]", "[PRODUCT]", "[LIVING]", "[SPACE]", "[MOBILITY]"]):
        return "INDUSTRIAL DESIGN과"
    # Check Visual tags
    elif any(tag in title_upper for tag in ["[GRAPHIC]", "[BRAND]", "[MEDIA]", "[UI/UX]"]):
        return "VISUAL DESIGN과"
    # Fallback default
    return "VISUAL DESIGN과"

for target in targets:
    if not os.path.exists(target):
        print(f"File not found: {target}")
        continue
        
    with open(target, "r", encoding="utf-8") as f:
        queue = json.load(f)
        
    updated_count = 0
    visual_count = 0
    industrial_count = 0
    
    for item in queue:
        # Check SNU card
        if item.get("id") == "UNIV-2025-서울대학교-디자인과-snu-design" or ("서울대" in item.get("university", "") and item.get("id", "").startswith("UNIV-2025")):
            artworks = item.get("artworks", [])
            for art in artworks:
                title = art.get("title", "")
                dept = map_snu_dept(title)
                art["department"] = dept
                updated_count += 1
                if "VISUAL" in dept:
                    visual_count += 1
                elif "INDUSTRIAL" in dept:
                    industrial_count += 1
                    
    with open(target, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
        
    print(f"[{target}] Updated {updated_count} SNU artworks (Visual: {visual_count}, Industrial: {industrial_count})")

print("SNU department update completed successfully!")
