import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

pattern = r'([0-9a-fA-F]+):T[0-9a-zA-Z]+,(https://hhhyejaaa\.notion\.site/image/.*?&cache=v2)'
matches = re.findall(pattern, stream)
print(f"Matched {len(matches)} notion image references!")

ref_map = {f"${k}": v for k, v in matches}

with open('scripts/snu_projects_final.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

resolved = 0
for p in projects:
    t = p.get('thumbnailUrl', '')
    if t in ref_map:
        p['thumbnailUrl'] = ref_map[t]
        resolved += 1
    elif t.startswith('http'):
        resolved += 1

print(f"Resolved {resolved} / {len(projects)} thumbnails!")

# Update projects with resolved thumbnails
with open('scripts/snu_projects_final.json', 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

# Check sample resolved project
print("Sample project 0:", projects[0]['nameKo'], projects[0]['studentNameKo'], projects[0]['thumbnailUrl'][:80])
print("Sample project 1:", projects[1]['nameKo'], projects[1]['studentNameKo'], projects[1]['thumbnailUrl'][:80])
print("Sample project 2:", projects[2]['nameKo'], projects[2]['studentNameKo'], projects[2]['thumbnailUrl'][:80])
