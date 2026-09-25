import json
import os

targets = [
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

def map_daejin_dept(title: str, role: str = "") -> str:
    combined = (title + " " + role).upper()
    if "[ED]" in combined or "EDITORIAL" in combined:
        return "EDITORIAL DESIGN"
    elif "[IN]" in combined or "INTERACTIVE" in combined:
        return "INTERACTIVE DESIGN"
    elif "[PA]" in combined or "PACKAGE" in combined:
        return "PACKAGE DESIGN"
    elif "[VI]" in combined or "VISUAL" in combined:
        return "VISUAL DESIGN"
    return "VISUAL DESIGN"

for target in targets:
    if not os.path.exists(target):
        print(f"File not found: {target}")
        continue
        
    with open(target, "r", encoding="utf-8") as f:
        queue = json.load(f)
        
    updated_count = 0
    dept_counts = {}
    
    for item in queue:
        if "대진대" in item.get("university", ""):
            artworks = item.get("artworks", [])
            for art in artworks:
                title = art.get("title", "")
                role = art.get("inferred_role", "")
                dept = map_daejin_dept(title, role)
                art["department"] = dept
                updated_count += 1
                dept_counts[dept] = dept_counts.get(dept, 0) + 1
                
    with open(target, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
        
    print(f"[{target}] Updated {updated_count} Daejin artworks: {dept_counts}")

print("Daejin department classification completed successfully!")
