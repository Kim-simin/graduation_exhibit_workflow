import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/snu_works.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract every push([1, "..."])
# Note: we need to parse JSON of each push or regex match the string argument
# Regex: r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)'
chunks = re.findall(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', html)
print(f"Found {len(chunks)} chunks")

full_stream = ""
for c in chunks:
    # unescape JSON string
    try:
        u = json.loads(f'"{c}"')
        full_stream += u
    except Exception as e:
        # fallback
        full_stream += c

print(f"Full stream length: {len(full_stream)}")

# Now find all lines starting with XX:T or \nXX:T
# In Next.js RSC, lines are:
# <id>:T<len>,<text>
# or <id>:<json>
ref_map = {}
for line in full_stream.split('\n'):
    line = line.strip()
    m = re.match(r'^([0-9a-fA-F]+):T[0-9a-fA-F]+,(https?://.+)$', line)
    if m:
        ref_id = m.group(1)
        url = m.group(2)
        ref_map[f"${ref_id}"] = url

print(f"Parsed {len(ref_map)} refs via newline splitting!")
for k in list(ref_map.keys())[:10]:
    print(k, "->", ref_map[k][:70])

# Now let's load initialProjects from full_stream
m = re.search(r'"initialProjects":(\[\{.*?\}\])(,\s*"|\}\])', full_stream)
if not m:
    idx = full_stream.find('"initialProjects":[')
    start_bracket = idx + len('"initialProjects":')
    bracket_count = 0
    end_bracket = -1
    in_string = False
    escape = False
    for i in range(start_bracket, len(full_stream)):
        ch = full_stream[i]
        if escape:
            escape = False
            continue
        if ch == '\\':
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string:
            if ch == '[':
                bracket_count += 1
            elif ch == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    end_bracket = i + 1
                    break
    raw_projects = full_stream[start_bracket:end_bracket]
else:
    raw_projects = m.group(1)

projects = json.loads(raw_projects)
print(f"Parsed {len(projects)} projects!")

# Check how many thumbnails resolved
resolved = 0
for p in projects:
    t = p.get('thumbnailUrl', '')
    if t in ref_map:
        resolved += 1
print(f"Resolved {resolved} / {len(projects)} thumbnails!")

# Update projects with resolved thumbnails
for p in projects:
    t = p.get('thumbnailUrl', '')
    if t in ref_map:
        p['thumbnailUrl'] = ref_map[t]

with open('scripts/snu_projects_final.json', 'w', encoding='utf-8') as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)

print("Saved to scripts/snu_projects_final.json")
