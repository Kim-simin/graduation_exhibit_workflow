import json

for p in ["data/university_queue.json", "my-exhibit-platform/data/university_queue.json"]:
    with open(p, "r", encoding="utf-8") as f:
        data = json.load(f)
    kmu = next((c for c in data if c.get("university") == "국민대학교"), None)
    if kmu:
        print(f"[{p}]")
        print("  Poster:", kmu.get("poster_image"))
        print("  Artworks count:", len(kmu.get("artworks", [])))
        print("  Cooperation companies:", kmu.get("cooperation_companies"))
    else:
        print(f"[{p}] KMU card not found!")
