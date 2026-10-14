"""Remove known demo records from LOCAL ADMIN only, with recoverable backups.

User explicitly requested deletion of fake information on 2026-10-04.
Unverified collected records are quarantined, not declared factually false.
Run without --apply to preview. No root/public database synchronization.
"""
import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
ADMIN = ROOT / "admin/data"
STUDENTS = {f"stu-{i:02d}" for i in range(1, 13)}
CHALLENGES = {"challenge-" + suffix for suffix in (
    "shipbuilding-llm", "shipbuilding-safety-iot", "shipbuilding-dashboard",
    "ocean-cruise-branding", "hospital-fall-monitoring", "chronic-care-lifelog",
    "isolation-robot-interface", "bems-energy-optimization", "battery-recycling-safety",
    "uam-vertiport-space-ux", "local-esg-smart-market",
)}
PARENTS = {"parent-shipbuilding", "parent-smart-hospital", "parent-smart-city"}

def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

def atomic_bytes(path, content):
    temp = path.with_name(path.name + ".tmp." + uuid4().hex)
    try:
        with temp.open("xb") as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)

def reason(group, record):
    identifier = record.get("id", "")
    if group == "students" and identifier in STUDENTS:
        return "UI test/seed profile; no source for identity, contacts or portfolio"
    if group == "challenges" and identifier in CHALLENGES:
        return "Demo challenge: company homepage is not evidence of this recruitment, team capacity or reward"
    if group == "parentChallenges" and identifier in PARENTS:
        return "Demo parent project without an official project announcement"
    if group == "opportunities":
        if identifier.startswith(("opp_ks_", "opp_uniall_team_")):
            return "Collector uses hardcoded records and synthesized eligibility instead of detail extraction"
        if identifier.startswith(("opp_nst_", "opp_ntis_", "opp_uniall_pbanc_")):
            return "QUARANTINE: discovered title may be real; audience, benefits and recruitment fields were synthesized"
        if identifier == "opp_pnu_vspace_infra":
            return "QUARANTINE: source could not be rechecked; access and detailed claims not verified"
    if group == "equipment" and identifier.startswith(("eq_pnu_vspace_", "eq_unist_", "eq_zeus_")):
        return "QUARANTINE: hand-authored equipment/access/specification details lack record-level evidence"
    return None

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    originals, updates, removed = {}, {}, {}
    for name in ("students", "industry_challenges", "opportunities", "equipment"):
        path = ADMIN / f"{name}.json"
        originals[path] = path.read_bytes()
        data = json.loads(originals[path])
        groups = {name: data} if isinstance(data, list) else {key: data[key] for key in ("parentChallenges", "challenges")}
        for group, records in groups.items():
            if not isinstance(records, list) or any(not isinstance(item, dict) for item in records):
                raise ValueError(f"Invalid dataset: {group}")
            selected = [{"id": item["id"], "reason": reason(group, item)} for item in records if reason(group, item)]
            removed[group] = selected
            ids = {item["id"] for item in selected}
            kept = [item for item in records if item.get("id") not in ids]
            assert len(kept) + len(selected) == len(records)
            if isinstance(data, list):
                data = kept
            else:
                data[group] = kept
            print(f"{group}: {len(records)} -> {len(kept)} (removed/quarantined {len(selected)})")
        updates[path] = encode(data)

    if not args.apply:
        print("Preview only; no data modified.")
        return
    if not any(removed.values()):
        print("Already clean; no changes.")
        return
    backup = ROOT / "outputs/admin-cleanup" / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid4().hex[:8])
    backup.mkdir(parents=True)
    for path, content in originals.items():
        (backup / path.name).write_bytes(content)
    manifest_path = ADMIN / "removed_demo_content.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    for group, entries in removed.items():
        combined = {item["id"]: item for item in manifest.get(group, [])}
        combined.update({item["id"]: item for item in entries})
        manifest[group] = list(combined.values())
    (backup / "report.json").write_bytes(encode({"removed": removed, "sha256": {path.name: hashlib.sha256(raw).hexdigest() for path, raw in originals.items()}}))
    # Refuse concurrent edits before committing. Backups remain available after any failure.
    for path, raw in originals.items():
        if path.read_bytes() != raw:
            raise RuntimeError(f"Concurrent modification: {path}")
    atomic_bytes(manifest_path, encode(manifest))
    for path, content in updates.items():
        if path.read_bytes() != originals[path]:
            raise RuntimeError(f"Concurrent modification: {path}")
        atomic_bytes(path, content)
        assert json.loads(path.read_bytes()) == json.loads(content)
    print(f"Local admin cleanup completed. Backup: {backup}")

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    main()
