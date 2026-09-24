import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

pattern = r'([0-9a-fA-F]+):T[0-9a-fA-F]+,(https://hhhyejaaa\.notion\.site/image/[^\s"\']+\?table=block&id=[0-9a-fA-F-]+&cache=v2)'
matches = re.findall(pattern, stream)
print(f"Matched {len(matches)} notion image references with pattern!")

ref_map = {f"${k}": v for k, v in matches}

# Let's check projects
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

# Print missing if any
missing = [p['thumbnailUrl'] for p in projects if not p['thumbnailUrl'].startswith('http')]
print(f"Missing count: {len(missing)}")
if missing:
    print("Missing sample:", missing[:5])

# Save updated projects
with open('scripts/snu_projects_final.json', 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)
