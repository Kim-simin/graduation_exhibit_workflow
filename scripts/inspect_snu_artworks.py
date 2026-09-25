import json

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

snu_cards = [c for c in queue if "서울대" in c.get("university", "") or "서울대학교" in c.get("university", "")]
print(f"Found {len(snu_cards)} SNU card(s):")
for sc in snu_cards:
    print("ID:", sc.get("id"))
    print("University:", sc.get("university"))
    print("Department:", sc.get("department"))
    print("Artworks count:", len(sc.get("artworks", [])))
    # print sample 5 artworks
    artworks = sc.get("artworks", [])
    print("Sample artworks:")
    for a in artworks[:10]:
        print(" - Title:", a.get("title"), "| Student:", a.get("student_name"), "| Role:", a.get("inferred_role"), "| Dept:", a.get("department"))
