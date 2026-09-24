import json
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

with open("scripts/unescaped_projects.txt", "r", encoding="utf-8") as f:
    content = f.read()

idx = content.find('"projects":[')
sub = content[idx + len('"projects":'):]

depth = 0
in_string = False
escape = False
end_idx = -1

for i, char in enumerate(sub):
    if escape:
        escape = False
        continue
    if char == '\\':
        escape = True
        continue
    if char == '"':
        in_string = not in_string
        continue
    if not in_string:
        if char == '[':
            depth += 1
        elif char == ']':
            depth -= 1
            if depth == 0:
                end_idx = i
                break

projects = json.loads(sub[:end_idx + 1])
print(f"Total projects: {len(projects)}")

category_count = {}
for p in projects:
    cat = p.get('category', 'OTHER')
    category_count[cat] = category_count.get(cat, 0) + 1

print("Categories:", category_count)

for i, p in enumerate(projects[:20]):
    name = p.get('name')
    cat = p.get('category')
    designers = [d.get('koreanName', '') for d in p.get('designers', []) if isinstance(d, dict)]
    cover_ref = p.get('coverImage', {}).get('asset', {}).get('_ref', '')
    print(f"[{i+1}] {name} ({cat}) - {', '.join(designers)} | Ref: {cover_ref[:35]}...")
