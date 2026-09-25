import json
import os
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT_QUEUE_PATH = os.path.abspath("data/university_queue.json")
PLATFORM_QUEUE_PATH = os.path.abspath("my-exhibit-platform/data/university_queue.json")
TARGET_CARD_ID = "UNIV-2026-인천대학교-컴퓨터공학부-7899"

def update_root_queue():
    with open(ROOT_QUEUE_PATH, "r", encoding="utf-8") as f:
        queue = json.load(f)

    target = next((c for c in queue if c.get("id") == TARGET_CARD_ID), None)
    if not target:
        print(f"[ERROR] {TARGET_CARD_ID} not found in root queue!")
        return None

    target["disable_artwork_zoom"] = True
    print(f"[OK] Added disable_artwork_zoom: True to {TARGET_CARD_ID} in root queue.")

    temp_path = ROOT_QUEUE_PATH + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
    os.replace(temp_path, ROOT_QUEUE_PATH)
    print(f"[OK] Successfully saved {ROOT_QUEUE_PATH} (items={len(queue)})")
    return target

def update_platform_queue(target_card):
    with open(PLATFORM_QUEUE_PATH, "r", encoding="utf-8") as f:
        queue = json.load(f)

    existing = next((c for c in queue if c.get("id") == TARGET_CARD_ID), None)
    if existing:
        existing["disable_artwork_zoom"] = True
        print(f"[OK] Updated existing {TARGET_CARD_ID} in platform queue.")
    else:
        # Append target_card
        queue.append(target_card)
        print(f"[OK] Appended {TARGET_CARD_ID} to platform queue.")

    temp_path = PLATFORM_QUEUE_PATH + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
    os.replace(temp_path, PLATFORM_QUEUE_PATH)
    print(f"[OK] Successfully saved {PLATFORM_QUEUE_PATH} (items={len(queue)})")
    return True

def main():
    target = update_root_queue()
    if target:
        update_platform_queue(target)
        print("[SUCCESS] All queues updated with disable_artwork_zoom!")

if __name__ == "__main__":
    main()
