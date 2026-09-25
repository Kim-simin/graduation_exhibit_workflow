import json
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

kmu = next((c for c in cards if c.get("id") == "UNIV-2026-국민대학교-소프트웨어학부-kmu-expo"), None)
if not kmu:
    print("KMU card missing!")
    sys.exit(1)

print(f"Card ID: {kmu['id']}")
print(f"University: {kmu['university']}")
print(f"Department: {kmu['department']}")
print(f"Artworks count: {len(kmu.get('artworks', []))}")
print("-" * 60)

for idx, art in enumerate(kmu.get("artworks", []), 1):
    print(f"#{idx:02d} [{art.get('department')}] {art.get('title')} ({art.get('student_name')})")
