import json
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("scripts/designers_list.json", "r", encoding="utf-8") as f:
    designers = json.load(f)

print(f"Total designers: {len(designers)}")
first = designers[0]
print("Keys of a designer object:", list(first.keys()))
print("Korean Name:", first.get("koreanName"))
print("English Name:", first.get("englishName"))
print("Email:", first.get("email"))
print("Instagram:", first.get("instagram"))
print("Projects field:", first.get("projects"))

all_projects = []
for d in designers:
    projs = d.get("projects", [])
    if projs:
        for p in projs:
            p_copy = dict(p) if isinstance(p, dict) else {"ref": p}
            p_copy["designer_name"] = d.get("koreanName")
            p_copy["designer_email"] = d.get("email")
            all_projects.append(p_copy)

print(f"Total projects extracted across all designers: {len(all_projects)}")
if all_projects:
    print("Sample project:", all_projects[0])
