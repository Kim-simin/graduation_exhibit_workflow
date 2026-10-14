"""
Script to audit opportunities in admin/data/opportunities.json and web/data/published/opportunities.json
Checks student eligibility, hiring notice patterns, corporate recruitment, and verification fields.
"""

import json
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parent.parent
ADMIN_OPP = WORKSPACE / "admin" / "data" / "opportunities.json"
WEB_OPP = WORKSPACE / "web" / "data" / "published" / "opportunities.json"
ROOT_OPP = WORKSPACE / "data" / "opportunities.json"

def audit_file(path: Path):
    if not path.exists():
        print(f"File not found: {path}")
        return []
    
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    print(f"\nAuditing {path} (Total items: {len(data)})")
    
    exclusion_keywords = [
        "정규직", "계약직", "위촉직", "채용", "직원", "연구원 채용", "공개채용",
        "창업기업", "입주기업", "참여기업", "지원기업", "기업모집", "수요기업", "공급기업"
    ]
    
    suspicious = []
    by_type = {}
    
    for item in data:
        item_type = item.get("type", "UNKNOWN")
        by_type[item_type] = by_type.get(item_type, 0) + 1
        
        title = item.get("title", "")
        desc = item.get("description", "")
        target = item.get("targetStudents", "")
        provider = item.get("providerName", "")
        
        full_text = f"{title} {desc} {target} {provider}"
        
        matched_kw = [kw for kw in exclusion_keywords if kw in full_text]
        if matched_kw:
            suspicious.append({
                "id": item.get("id"),
                "title": title,
                "type": item_type,
                "provider": provider,
                "targetStudents": target,
                "matched": matched_kw,
                "current_approval": item.get("approvalStatus"),
                "current_status": item.get("status"),
                "studentParticipationVerified": item.get("studentParticipationVerified")
            })
            
    print(f"Type breakdown: {by_type}")
    print(f"Items matching exclusion keywords: {len(suspicious)}")
    for s in suspicious[:25]:
        print(f"- [{s['type']}] {s['id']}: {s['title']} | target: {s['targetStudents']} | matched: {s['matched']}")
        
    return data

if __name__ == "__main__":
    audit_file(ADMIN_OPP)
