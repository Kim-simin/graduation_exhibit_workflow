import json
from collections import Counter

with open("scripts/designers_list.json", "r", encoding="utf-8") as f:
    designers = json.load(f)

projects = []
for d in designers:
    for p in d.get("projects", []):
        if isinstance(p, dict):
            p_copy = dict(p)
            p_copy["designer_name"] = d.get("koreanName")
            p_copy["designer_email"] = d.get("email")
            projects.append(p_copy)

# Deduplicate projects by _id or name+designer
unique_projects = {}
for p in projects:
    pid = p.get("_id") or (p.get("name", "") + "_" + p.get("designer_name", ""))
    if pid not in unique_projects:
        unique_projects[pid] = p

print(f"Total extracted projects: {len(projects)}")
print(f"Total unique projects: {len(unique_projects)}")

cat_counts = Counter(p.get("category") for p in unique_projects.values())
print("\nCategory distribution:")
for cat, count in cat_counts.most_common():
    print(f" - {cat}: {count} items")
