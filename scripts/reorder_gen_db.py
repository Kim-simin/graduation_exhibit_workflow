import json
import os

WORKSPACE_ROOT = r"c:\Users\graduation_exhibit_workflow"
DATA_FILE = os.path.join(WORKSPACE_ROOT, "data", "generated_contents.json")
PLATFORM_FILE = os.path.join(WORKSPACE_ROOT, "my-exhibit-platform", "data", "generated_contents.json")

with open(DATA_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

contents = data.get("contents", [])

# Find cnt-9c33482d2b
c_primary = None
others = []
for c in contents:
    if c.get("content_id") == "cnt-9c33482d2b":
        c_primary = c
    else:
        others.append(c)

if c_primary:
    c_primary["status"] = "WAITING_FOR_APPROVAL"
    c_primary["approval_status"] = "WAITING_FOR_APPROVAL"
    c_primary["approved_by"] = None
    c_primary["approved_at"] = None
    c_primary["rejected_by"] = None
    c_primary["rejected_at"] = None
    c_primary["rejection_reason"] = None
    new_contents = [c_primary] + others
else:
    new_contents = contents

data["contents"] = new_contents
data["latest_content"] = new_contents[0] if new_contents else None

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open(PLATFORM_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Reordered gen_contents: primary is", new_contents[0].get("content_id"))
