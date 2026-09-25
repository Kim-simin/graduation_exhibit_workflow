import json
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

for c in queue:
    if "인천" in c.get("university", "") or "인천" in c.get("title", ""):
        print("Root queue:")
        print(f"ID: {c.get('id')}")
        print(f"University: {c.get('university')}")
        print(f"Department: {c.get('department')}")
        print(f"Year: {c.get('year')}")
        print(f"Title: {c.get('title')}")
        print(f"Exhibition Title: {c.get('exhibition_title')}")
        print(f"Artworks count: {len(c.get('artworks', []))}")
        print("-" * 40)

with open("my-exhibit-platform/data/university_queue.json", "r", encoding="utf-8") as f:
    p_queue = json.load(f)

for c in p_queue:
    if "인천" in str(c.get("university", "")) or "인천" in str(c.get("title", "")):
        print("Platform queue:")
        print(f"ID: {c.get('id')}")
        print(f"University: {c.get('university')}")
        print(f"Department: {c.get('department')}")
        print(f"Year: {c.get('year')}")
        print(f"Title: {c.get('title')}")
        print(f"Artworks count: {len(c.get('artworks', []))}")
        print("=" * 40)
