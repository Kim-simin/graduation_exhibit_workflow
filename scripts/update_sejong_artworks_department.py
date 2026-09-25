import json
import os

targets = [
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

def map_dept(title: str, curr_dept: str = "") -> str:
    title_lower = title.lower()
    if "identity design" in title_lower or "digital media" in title_lower:
        return "VISUAL DESIGN과"
    elif "product" in title_lower or "transportation" in title_lower or "system design" in title_lower:
        return "INDUSTRIAL DESIGN과"
    return curr_dept or "디자인이노베이션전공"

for target in targets:
    if not os.path.exists(target):
        print(f"File not found: {target}")
        continue
        
    with open(target, "r", encoding="utf-8") as f:
        queue = json.load(f)
        
    updated_artworks_count = 0
    visual_count = 0
    industrial_count = 0
    
    for item in queue:
        # Check Sejong University card
        if item.get("id") == "UNIV-2025-세종대학교-디자인이노베이션전공-firstchase" or "세종대" in item.get("university", ""):
            artworks = item.get("artworks", [])
            for art in artworks:
                title = art.get("title", "")
                dept = map_dept(title)
                art["department"] = dept
                updated_artworks_count += 1
                if "VISUAL" in dept:
                    visual_count += 1
                elif "INDUSTRIAL" in dept:
                    industrial_count += 1
                    
    with open(target, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
        
    print(f"[{target}] Updated {updated_artworks_count} artworks (Visual: {visual_count}, Industrial: {industrial_count})")

print("Department update completed successfully without any external research!")
