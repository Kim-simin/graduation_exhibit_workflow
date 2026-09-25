import json
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("data/professors.json", "r", encoding="utf-8") as f:
    profs = json.load(f)

daejin_profs = [p for p in profs if "대진대" in p.get("university", "")]
print(f"Total Daejin professors in professors.json: {len(daejin_profs)}")
for p in daejin_profs:
    print(f" - {p.get('name')} | {p.get('title')} | Lab: {p.get('lab_name')} | Areas: {p.get('research_areas')} | Email: {p.get('email')}")
