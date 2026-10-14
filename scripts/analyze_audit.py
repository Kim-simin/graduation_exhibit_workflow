"""
Evaluate and categorize all 70 items according to the user's Student Eligibility Gate.
Writes detailed UTF-8 report to scripts/analyze_summary.txt.
"""

import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ADMIN_OPP = WORKSPACE / "admin" / "data" / "opportunities.json"
REPORT_FILE = WORKSPACE / "scripts" / "opportunities_audit_report.json"
OUTPUT_FILE = WORKSPACE / "scripts" / "analyze_summary.txt"

with open(REPORT_FILE, "r", encoding="utf-8") as f:
    items = json.load(f)

lines = []
lines.append(f"Total items: {len(items)}\n")

categories = {}
for it in items:
    itype = it["type"]
    categories.setdefault(itype, []).append(it)

for cat, cat_items in categories.items():
    lines.append(f"=== {cat} ({len(cat_items)} items) ===")
    for item in cat_items:
        lines.append(f"  [{item['id']}] {item['title']}")
        lines.append(f"    - Target: {item.get('targetStudents')}")
        lines.append(f"    - Provider: {item.get('providerName')}")
        lines.append(f"    - Source: {item.get('sourceUrl')}")
    lines.append("")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Summary written to {OUTPUT_FILE}")
