import os
import sys
import yaml

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

skills_dir = r"c:\Users\graduation_exhibit_workflow\.agents\skills"
skills = [
    "ecosystem-primer",
    "langgraph-fundamentals",
    "langgraph-persistence",
    "langgraph-human-in-the-loop",
    "langgraph-dependencies",
    "langgraph-cli",
]

print("=" * 85)
print("📋 [LANGCHAIN OFFICIAL AGENT SKILLS VERIFICATION REPORT]")
print("=" * 85)

seen_names = set()
all_valid = True

for s in skills:
    s_path = os.path.join(skills_dir, s, "SKILL.md")
    exists = os.path.exists(s_path)
    if not exists:
        print(f"❌ FAIL | Skill: {s} -> SKILL.md not found at {s_path}")
        all_valid = False
        continue

    with open(s_path, "r", encoding="utf-8") as f:
        content = f.read()

    size = len(content)
    is_non_empty = size > 0

    name = None
    description = None

    # Parse YAML frontmatter between ---
    parts = content.split("---")
    if len(parts) >= 3:
        fm_raw = parts[1]
        try:
            data = yaml.safe_load(fm_raw)
            if isinstance(data, dict):
                name = data.get("name")
                description = data.get("description")
        except Exception as e:
            print(f"YAML Parse error in {s}: {e}")

    is_duplicate = name in seen_names if name else False
    if name:
        seen_names.add(name)

    passed = exists and is_non_empty and bool(name) and bool(description) and not is_duplicate
    if not passed:
        all_valid = False

    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} | Skill: {s}")
    print(f"   - Path        : {s_path}")
    print(f"   - Name        : {name}")
    print(f"   - Description : {str(description)[:90]}...")
    print(f"   - Size (Bytes): {size:,} bytes")
    print(f"   - Duplicate   : {is_duplicate}")
    print("-" * 85)

print(f"Total skills checked: {len(skills)} | All valid: {all_valid}")
print("=" * 85)

sys.exit(0 if all_valid else 1)
