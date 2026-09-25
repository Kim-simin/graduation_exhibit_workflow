import json
import io
import sys
from collections import Counter
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

kmu = next((c for c in queue if c.get("id") == "UNIV-2026-국민대학교-소프트웨어학부-kmu-expo"), None)
if not kmu:
    print("KMU card not found!")
    sys.exit(1)

artworks = kmu.get("artworks", [])
print(f"Total KMU artworks: {len(artworks)}")

for i, a in enumerate(artworks):
    t = a.get("title", "")
    r = a.get("inferred_role", "")
    prefix = t[:4] if t.startswith("[") else "None"
    print(f"[{i+1:02d}] Title: {t:35s} | Prefix: {prefix} | Role: {r}")
