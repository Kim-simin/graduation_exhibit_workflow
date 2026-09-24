import json

with open("scripts/designers_list.json", "r", encoding="utf-8") as f:
    designers = json.load(f)

d0 = designers[0]
for k, v in d0.items():
    if k in ['projects', 'mainProfileImage', 'thumbnailProfileImage']:
        print(f"Key: {k}, type: {type(v)}, len: {len(v) if isinstance(v, list) else 'obj'}")
    else:
        print(f"Key: {k}: {v}")
