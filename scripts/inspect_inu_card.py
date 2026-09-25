import json
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

inu = next((c for c in queue if c.get("id") == "UNIV-2026-인천대학교-컴퓨터공학부-7899"), None)
if inu:
    print(f"ID: {inu.get('id')}")
    print(f"University: {inu.get('university')}")
    print(f"Department: {inu.get('department')}")
    print(f"Year: {inu.get('year')}")
    print(f"Title: {inu.get('title')}")
    print(f"Poster: {inu.get('poster_image')}")
    print(f"Artworks count: {len(inu.get('artworks', []))}")
    for idx, a in enumerate(inu.get("artworks", [])[:5], 1):
        print(f"  Art #{idx}: title={a.get('title')}, image={a.get('image')}, author={a.get('student_name')}")
else:
    print("Not found")
