"""Read-only inventory for the local admin cleanup."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main():
    for name in ("students", "industry_challenges", "opportunities", "equipment"):
        data = json.loads((ROOT / "admin/data" / f"{name}.json").read_text(encoding="utf-8"))
        groups = {name: data} if isinstance(data, list) else {k: v for k, v in data.items() if isinstance(v, list)}
        for group, records in groups.items():
            print(f"\n{group}: {len(records)}")
            for record in records:
                if group == "majorCategories":
                    continue
                print(json.dumps({k: record[k] for k in ("id", "title", "equipment_name", "sourceUrl", "source_url", "officialUrl", "eligibilityStatus", "dataOrigin", "isMock", "verification_status") if k in record}, ensure_ascii=False))

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    main()
