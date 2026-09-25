import json
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

for p in ["data/university_queue.json", "my-exhibit-platform/data/university_queue.json"]:
    with open(p, "r", encoding="utf-8") as f:
        queue = json.load(f)
    print(f"\n=== {p} ===")
    dc = next((c for c in queue if "대진대" in c.get("university", "")), None)
    if dc:
        print("ID:", dc.get("id"))
        print("University:", dc.get("university"))
        print("Department:", dc.get("department"))
        print("Artworks total:", len(dc.get("artworks", [])))
        for a in dc.get("artworks", [])[:5]:
            print(" - Title:", a.get("title"), "| Dept field:", a.get("department"), "| Role:", a.get("inferred_role"))
    else:
        print("Daejin card NOT found!")
