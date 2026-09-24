import json

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    queue = json.load(f)

categories = set(item.get("category") for item in queue if item.get("category"))
print("Categories in queue:", categories)
