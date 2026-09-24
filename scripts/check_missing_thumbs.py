import json

with open('scripts/snu_projects_final.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

for i, p in enumerate(projects):
    if not p['thumbnailUrl'].startswith('http'):
        print(f"Project {i}: {p['nameKo']} by {p['studentNameKo']} -> thumbnail: {p['thumbnailUrl']}")
