"""
Comprehensive Inspection Script for Opportunities Data
Outputs detailed UTF-8 report of all 70 items.
"""

import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ADMIN_OPP = WORKSPACE / "admin" / "data" / "opportunities.json"
REPORT_FILE = WORKSPACE / "scripts" / "opportunities_audit_report.json"

def inspect_all():
    with open(ADMIN_OPP, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    report = []
    for item in data:
        report.append({
            "id": item.get("id"),
            "type": item.get("type"),
            "title": item.get("title"),
            "providerName": item.get("providerName"),
            "targetStudents": item.get("targetStudents"),
            "eligibleAudience": item.get("eligibleAudience"),
            "accessScope": item.get("accessScope"),
            "sourceUrl": item.get("sourceUrl"),
            "approvalStatus": item.get("approvalStatus"),
            "status": item.get("status"),
            "recruitmentEvidence": item.get("recruitmentEvidence"),
            "description": item.get("description", "")[:120]
        })
        
    with open(REPORT_FILE, "w", encoding="utf-8") as out:
        json.dump(report, out, indent=2, ensure_ascii=False)
        
    print(f"Audit completed: {len(report)} items dumped to {REPORT_FILE}")

if __name__ == "__main__":
    inspect_all()
