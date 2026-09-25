import json
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

daejin_card = next((c for c in queue if "대진대" in c.get("university", "")), None)
if not daejin_card:
    print("Daejin card not found!")
    sys.exit(1)

print("ID:", daejin_card.get("id"))
print("University:", daejin_card.get("university"))
print("Department:", daejin_card.get("department"))
artworks = daejin_card.get("artworks", [])
print(f"Total artworks: {len(artworks)}")

for i, a in enumerate(artworks):
    print(f"[{i+1}] Title: {a.get('title')} | Student: {a.get('student_name')} | Role: {a.get('inferred_role')} | Dept: {a.get('department')}")
    # print description preview
    desc = a.get('description', '')[:100].replace('\n', ' ')
    print(f"    Desc: {desc}")
