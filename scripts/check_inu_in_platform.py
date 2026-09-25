import json

with open("my-exhibit-platform/data/university_queue.json", "r", encoding="utf-8") as f:
    p_queue = json.load(f)

card = next((c for c in p_queue if c.get("id") == "UNIV-2026-인천대학교-컴퓨터공학부-7899"), None)
print("In platform queue:", bool(card))
