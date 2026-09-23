import json

with open(r"c:\Users\graduation_exhibit_workflow\data\professors.json", "r", encoding="utf-8") as f:
    profs = json.load(f)

print(f"Total professors: {len(profs)}")
for p in profs[:10]:
    print(f"- {p.get('name')} | {p.get('university')} | {p.get('department')} | {p.get('major')}")
