import json

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

inu = next((c for c in queue if c.get("id") == "UNIV-2026-인천대학교-컴퓨터공학부-7899"), None)
if inu:
    for k, v in inu.items():
        if k != "artworks":
            print(f"{k}: {v}")
