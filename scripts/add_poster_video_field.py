import json
import os

queue_files = [
    os.path.abspath("data/university_queue.json"),
    os.path.abspath("my-exhibit-platform/data/university_queue.json")
]

for file_path in queue_files:
    if not os.path.exists(file_path):
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    original_count = len(data)
    updated = False

    for item in data:
        if "세종" in item.get("university", "") and "디자인이노베이션" in item.get("department", ""):
            item["poster_video"] = "uploads/UNIV-2025-세종대학교-디자인이노베이션전공/motion_poster.mp4"
            item["motion_poster_url"] = "http://sj-di.com/wp-content/uploads/2025/10/final-web.mp4"
            updated = True
            print(f"[{os.path.basename(file_path)}] Updated Sejong record with poster_video.")

    if updated:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 검증
        with open(file_path, "r", encoding="utf-8") as f:
            verified_data = json.load(f)

        assert len(verified_data) == original_count, f"Count mismatch! {len(verified_data)} vs {original_count}"
        print(f"[{os.path.basename(file_path)}] Integrity verified: {len(verified_data)} records preserved.")

print("All university queue files safely updated and verified!")
