import json

for path in ["data/university_queue.json", "my-exhibit-platform/data/university_queue.json"]:
    with open(path, "r", encoding="utf-8") as f:
        queue = json.load(f)
    print(f"=== {path} ===")
    matches = [c for c in queue if "대진대" in c.get("university", "")]
    print(f"Total Daejin cards: {len(matches)}")
    for c in matches:
        print(" - ID:", c.get("id"), "| Univ:", c.get("university"), "| Dept:", c.get("department"), "| Artworks:", len(c.get("artworks", [])))
        for a in c.get("artworks", []):
            print("   * Title:", a.get("title"), "| Role:", a.get("inferred_role"), "| Dept:", a.get("department"))
