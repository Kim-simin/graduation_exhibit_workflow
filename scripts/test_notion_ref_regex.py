import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# Match ref_id:T...,URL
# The URL starts with https://hhhyejaaa.notion.site/image/
# and ends with &cache=v2
pattern = r'([0-9a-fA-F]+):T[0-9a-zA-Z]+,(https://hhhyejaaa\.notion\.site/image/[^\s"\']+\?table=block&id=[0-9a-fA-F-]+&cache=v2)'
matches = re.findall(pattern, stream)
print(f"Matched {len(matches)} notion image references!")
for k, v in matches[:10]:
    print(f"${k} -> {v[:90]}...")

# Also check how many total projects we have
with open('scripts/snu_projects_parsed.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

print(f"Total projects: {len(projects)}")
unresolved = [p['thumbnailUrl'] for p in projects if p['thumbnailUrl'].startswith('$')]
print(f"Unresolved thumbnail references in projects: {len(unresolved)}")

ref_dict = {f"${k}": v for k, v in matches}
resolved_count = sum(1 for p in projects if p['thumbnailUrl'] in ref_dict)
print(f"Can resolve: {resolved_count} / {len(projects)}")
