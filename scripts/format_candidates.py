"""
Display candidates in readable text.
"""

import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
CAND_FILE = WORKSPACE / "scripts" / "candidate_items.json"
OUT_FILE = WORKSPACE / "scripts" / "candidate_details.txt"

with open(CAND_FILE, "r", encoding="utf-8") as f:
    items = json.load(f)

lines = []
for it in items:
    lines.append(f"ID: {it['id']}")
    lines.append(f"Type: {it.get('type')}")
    lines.append(f"Title: {it.get('title')}")
    lines.append(f"Provider: {it.get('providerName')}")
    lines.append(f"Target: {it.get('targetStudents')}")
    lines.append(f"Scope: {it.get('accessScope')}")
    lines.append(f"Source: {it.get('sourceUrl')}")
    rec = it.get("recruitmentEvidence")
    if rec:
        lines.append(f"Recruitment Evidence: {rec}")
    lines.append(f"Description: {it.get('description', '')[:200]}")
    lines.append("-" * 60)

with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Details written to {OUT_FILE}")
