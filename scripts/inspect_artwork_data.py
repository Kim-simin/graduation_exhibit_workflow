import json
import os

queue_path = r"c:\Users\graduation_exhibit_workflow\data\university_queue.json"
if not os.path.exists(queue_path):
    queue_path = r"c:\Users\graduation_exhibit_workflow\my-exhibit-platform\data\university_queue.json"

with open(queue_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total items in queue: {len(data)}")
item0 = data[0]
print(f"Item 0: {item0.get('university')} - {item0.get('department')}")
if item0.get("artworks"):
    for idx, art in enumerate(item0["artworks"][:3]):
        print(f"--- Artwork #{idx+1} ---")
        for k, v in art.items():
            print(f"  {k}: {v}")

