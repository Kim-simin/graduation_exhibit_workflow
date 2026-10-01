#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/verify_discovery_results.py
Verification of database integrity, log snapshots, and synchronization.
"""

import os
import sys
import json
import hashlib

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(WORKSPACE, "data")
PLATFORM_DATA_DIR = os.path.join(WORKSPACE, "my-exhibit-platform", "data")
LOGS_DIR = os.path.join(DATA_DIR, "logs", "source_discovery")

def get_hash(filepath):
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()

print("--- 1. Snapshot Files Check ---")
snapshots = ["nst_latest.json", "uniall_latest.json", "iris_latest.json", "ntis_latest.json", "zeus_latest.json", "etube_latest.json", "kstartup_latest.json"]
for s in snapshots:
    p = os.path.join(LOGS_DIR, s)
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
            count = len(data) if isinstance(data, list) else 1
            print(f"  [OK] {s}: {count} records, {os.path.getsize(p)} bytes")
    else:
        print(f"  [MISSING] {s}")

print("\n--- 2. Dual Sync & Database Safeguard Check ---")
dbs = ["opportunities.json", "equipment.json", "schedules.json", "professors.json", "students.json", "university_queue.json"]
for db in dbs:
    root_p = os.path.join(DATA_DIR, db)
    plat_p = os.path.join(PLATFORM_DATA_DIR, db)
    
    root_exists = os.path.exists(root_p)
    plat_exists = os.path.exists(plat_p)
    
    if root_exists and plat_exists:
        root_h = get_hash(root_p)
        plat_h = get_hash(plat_p)
        with open(root_p, "r", encoding="utf-8") as f:
            data = json.load(f)
            count = len(data) if isinstance(data, list) else len(data.keys())
        match_str = "MATCH" if root_h == plat_h else "MISMATCH"
        print(f"  [{match_str}] {db}: {count} items, SHA256 synced: {root_h[:8]}...")
    else:
        print(f"  [FAIL] {db}: root={root_exists}, plat={plat_exists}")

print("\n--- 3. Opportunity Categories & Approval Status ---")
with open(os.path.join(DATA_DIR, "opportunities.json"), "r", encoding="utf-8") as f:
    opps = json.load(f)

types = {}
statuses = {}
approvals = {}
for o in opps:
    t = o.get("type", "UNKNOWN")
    types[t] = types.get(t, 0) + 1
    s = o.get("status", "UNKNOWN")
    statuses[s] = statuses.get(s, 0) + 1
    a = o.get("approvalStatus", "UNKNOWN")
    approvals[a] = approvals.get(a, 0) + 1

print(f"Total Opportunities: {len(opps)}")
print(f"Types: {types}")
print(f"Statuses: {statuses}")
print(f"Approvals: {approvals}")

active_rnd = [o for o in opps if o.get("type") == "RND" and o.get("studentParticipationVerified") and o.get("officialSourceVerified") and o.get("recruitmentStatus") == "OPEN"]
print(f"Active Student R&D (saved in DB): {len(active_rnd)}")
for a in active_rnd:
    print(f"  - [{a['id']}] {a['title']} ({a['providerName']}) | Deadline: {a.get('recruitmentEndAt')} | D-Day: {a.get('dDayText')}")
