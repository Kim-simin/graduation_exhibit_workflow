import json
import os

targets = [
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

def get_dept(title: str, curr_dept: str = "") -> str:
    title_upper = title.upper()
    if "[ED]" in title_upper or "EDITORIAL" in title_upper:
        return "EDITORIAL DESIGN"
    elif "[IN]" in title_upper or "INTERACTIVE" in title_upper:
        return "INTERACTIVE DESIGN"
    elif "[PA]" in title_upper or "PACKAGE" in title_upper:
        return "PACKAGE DESIGN"
    elif "[VI]" in title_upper or "VISUAL" in title_upper:
        return "VISUAL DESIGN"
    return curr_dept or "VISUAL DESIGN"

for target in targets:
    if not os.path.exists(target):
        print(f"Target not found: {target}")
        continue
        
    with open(target, "r", encoding="utf-8") as f:
        queue = json.load(f)
        
    updated = 0
    dept_stats = {}
    for item in queue:
        if "대진대" in item.get("university", ""):
            artworks = item.get("artworks", [])
            for art in artworks:
                dept = get_dept(art.get("title", ""), art.get("department", ""))
                art["department"] = dept
                updated += 1
                dept_stats[dept] = dept_stats.get(dept, 0) + 1
                
    with open(target, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
        
    print(f"[{target}] Updated {updated} Daejin artworks. Stats: {dept_stats}")

print("Both JSON files successfully updated with Daejin departments!")
