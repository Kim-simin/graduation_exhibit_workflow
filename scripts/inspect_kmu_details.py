import json
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

for path in ["data/university_queue.json", "my-exhibit-platform/data/university_queue.json"]:
    with open(path, "r", encoding="utf-8") as f:
        queue = json.load(f)
    print(f"\n=== {path} ===")
    kmu_cards = [c for c in queue if "국민대" in c.get("university", "")]
    print(f"Total KMU cards: {len(kmu_cards)}")
    for c in kmu_cards:
        print(" - ID:", c.get("id"))
        print("   Title:", c.get("title") or c.get("exhibition_title"))
        print("   Univ:", c.get("university"))
        print("   Dept:", c.get("department"))
        artworks = c.get("artworks", [])
        print(f"   Artworks count: {len(artworks)}")
        # print sample 10 artworks
        for i, a in enumerate(artworks[:10]):
            print(f"     [{i+1}] Title: {a.get('title')} | Dept: {a.get('department')} | Role: {a.get('inferred_role')} | Student: {a.get('student_name')}")
