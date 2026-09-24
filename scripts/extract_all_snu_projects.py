import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works_stream.txt', 'r', encoding='utf-8') as f:
    stream = f.read()

# 1. First, let's map all referenced IDs like 15:T...,URL or 15:"URL"
# In Next.js RSC, lines look like:
# 15:T81d,https://hhhyejaaa.notion.site/image/...
# or XX:"..."
ref_map = {}
for line in stream.split('\n'):
    line = line.strip()
    # Match id:T...,URL or id:"URL"
    m = re.match(r'^([0-9a-fA-F]+):T[0-9a-fA-F]+,(https?://[^\s]+)', line)
    if m:
        ref_id = m.group(1)
        url = m.group(2)
        ref_map[f"${ref_id}"] = url
    else:
        m2 = re.match(r'^([0-9a-fA-F]+):"([^"]+)"', line)
        if m2:
            ref_id = m2.group(1)
            val = m2.group(2)
            ref_map[f"${ref_id}"] = val

print(f"Total resolved references: {len(ref_map)}")

# 2. Extract initialProjects JSON array
m = re.search(r'"initialProjects":(\[\{.*?\}\])(,\s*"|\}\])', stream)
if not m:
    # Let's find start of initialProjects and match balanced brackets
    idx = stream.find('"initialProjects":[')
    if idx != -1:
        start_bracket = idx + len('"initialProjects":')
        bracket_count = 0
        end_bracket = -1
        in_string = False
        escape = False
        for i in range(start_bracket, len(stream)):
            c = stream[i]
            if escape:
                escape = False
                continue
            if c == '\\':
                escape = True
                continue
            if c == '"':
                in_string = not in_string
                continue
            if not in_string:
                if c == '[':
                    bracket_count += 1
                elif c == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_bracket = i + 1
                        break
        raw_projects_json = stream[start_bracket:end_bracket]
    else:
        raw_projects_json = None
else:
    raw_projects_json = m.group(1)

print(f"Extracted raw projects string length: {len(raw_projects_json) if raw_projects_json else 0}")

# Parse JSON
projects_raw = json.loads(raw_projects_json)
print(f"Parsed {len(projects_raw)} projects!")

# Helper to fix mojibake (latin1 -> utf-8)
def fix_text(s):
    if not isinstance(s, str):
        return s
    try:
        return s.encode('latin1').decode('utf-8')
    except:
        return s

clean_projects = []
for p in projects_raw:
    thumb = p.get('thumbnailUrl', '')
    if thumb.startswith('$') and thumb in ref_map:
        thumb = ref_map[thumb]
    
    clean_p = {
        "id": p.get("id"),
        "projectType": p.get("projectType"),
        "filterIndex": p.get("filterIndex"),
        "nameKo": fix_text(p.get("nameKo")),
        "nameEn": p.get("nameEn"),
        "studentNameKo": fix_text(p.get("studentNameKo")),
        "studentNameEn": p.get("studentNameEn"),
        "thumbnailUrl": thumb,
        "email": p.get("email"),
        "instagram": p.get("instagram"),
        "isIntegratedProject": p.get("isIntegratedProject") == True
    }
    clean_projects.append(clean_p)

with open('scripts/snu_projects_parsed.json', 'w', encoding='utf-8') as f:
    json.dump(clean_projects, f, ensure_ascii=False, indent=2)

print("Saved cleaned projects to scripts/snu_projects_parsed.json")
if clean_projects:
    print("Sample project 0:", clean_projects[0])
    print("Sample project 1:", clean_projects[1])
