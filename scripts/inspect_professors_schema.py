import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('data/professors.json', 'r', encoding='utf-8') as f:
    profs = json.load(f)

print(f"Total professors in data/professors.json: {len(profs)}")
print("Sample professor 0:")
print(json.dumps(profs[0], ensure_ascii=False, indent=2))

with open('my-exhibit-platform/data/professors.json', 'r', encoding='utf-8') as f:
    p_profs = json.load(f)
print(f"Total professors in platform: {len(p_profs)}")
print("Sample professor from daejin:")
daejin_p = next((p for p in p_profs if '대진대' in p.get('university', '')), None)
if daejin_p:
    print(json.dumps(daejin_p, ensure_ascii=False, indent=2))
