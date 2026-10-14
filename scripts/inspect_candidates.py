"""
Detailed Inspector for Non-NST/NTIS items (PBL, Capstone, Competitions, Education, Facilities)
"""

import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ADMIN_OPP = WORKSPACE / "admin" / "data" / "opportunities.json"

with open(ADMIN_OPP, "r", encoding="utf-8") as f:
    items = json.load(f)

print(f"Total: {len(items)}")

candidates = []
for it in items:
    # Filter out nst and ntis and uniall pbanc
    iid = it["id"]
    if not (iid.startswith("opp_nst_") or iid.startswith("opp_ntis_") or iid.startswith("opp_uniall_pbanc_")):
        candidates.append(it)

print(f"Candidate items: {len(candidates)}")
out_path = WORKSPACE / "scripts" / "candidate_items.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(candidates, f, indent=2, ensure_ascii=False)

print(f"Dumped candidates to {out_path}")
