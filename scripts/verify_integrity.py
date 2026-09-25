import json

files_to_check = [
    "data/professors.json",
    "my-exhibit-platform/data/professors.json",
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

all_ok = True
for fpath in files_to_check:
    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"[OK] {fpath}: Valid JSON, count = {len(data)}")
    except Exception as e:
        print(f"[ERROR] {fpath}: {e}")
        all_ok = False

if all_ok:
    print("All JSON databases integrity checks PASSED!")
