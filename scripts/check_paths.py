import os

paths = [
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json",
    "data/professors.json",
    "my-exhibit-platform/data/professors.json"
]

for p in paths:
    print(f"Path: {p}, exists: {os.path.exists(p)}, size: {os.path.getsize(p) if os.path.exists(p) else 0}")
