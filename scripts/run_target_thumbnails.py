"""
scripts/run_target_thumbnails.py
TARGET A (2025 서울여대 산업디자인학과) 및 TARGET B (2025 세종대 디자인이노베이션전공)
출품작 세로형 보드 이미지 썸네일 일괄 생성 및 DB 동기화 스크립트
"""

import os
import sys
import json
import shutil

# Windows 콘솔 utf-8 설정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.abspath('.'))
from research.thumbnail_processor import (
    process_exhibition_artworks,
    update_json_file_safely,
    is_software_engineering_exhibition
)

TARGET_IDS = [
    "UNIV-2025-서울여자대학교-산업디자인학과",
    "UNIV-2025-세종대학교-디자인이노베이션전공-firstchase"
]

DB_FILES = [
    "web/data/exhibitions.json",
    "web/data/published/exhibitions.json",
    "admin/data/exhibitions_all.json",
    "data/university_queue.json",
    "my-exhibit-platform/data/university_queue.json"
]

def run():
    print("=================================================================")
    print("[START] Processing Target Exhibitions Thumbnails")
    print(f"Target IDs: {TARGET_IDS}")
    print("=================================================================")

    # 1. Primary source: web/data/exhibitions.json
    source_file = "web/data/exhibitions.json"
    with open(source_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    target_map = {}
    stats = {}

    for item in data:
        item_id = item.get("id")
        if item_id in TARGET_IDS:
            print(f"\nProcessing Exhibition: {item.get('title')} ({item_id})")
            print(f" - Artworks count: {len(item.get('artworks', []))}")
            res = process_exhibition_artworks(item, force_recreate=False)
            stats[item_id] = res
            target_map[item_id] = item
            print(f" - Result: {res}")

    print("\n-----------------------------------------------------------------")
    print("Processing Summary:")
    for tid, st in stats.items():
        print(f"  * [{tid}]: Processed {st['processed_count']} / {st['total_artworks']} (Tall boards: {st['tall_board_count']}, Missing: {st['missing_count']})")
    print("-----------------------------------------------------------------")

    # 2. Update all DB files safely
    for db_path in DB_FILES:
        if os.path.exists(db_path):
            # Backup first
            bak_path = f"{db_path}.bak"
            shutil.copy2(db_path, bak_path)
            
            # Count records before
            with open(db_path, 'r', encoding='utf-8') as f:
                before_data = json.load(f)
            before_count = len(before_data if isinstance(before_data, list) else (before_data.get('exhibitions') or before_data.get('queue') or []))

            # Update
            updated = update_json_file_safely(db_path, TARGET_IDS, target_map)

            # Count records after
            with open(db_path, 'r', encoding='utf-8') as f:
                after_data = json.load(f)
            after_count = len(after_data if isinstance(after_data, list) else (after_data.get('exhibitions') or after_data.get('queue') or []))

            assert before_count == after_count, f"Record count mismatch in {db_path}: before {before_count} vs after {after_count}"
            print(f"  [OK] Verified {db_path}: Records intact ({after_count} items).")

    print("\n=================================================================")
    print("[SUCCESS] ALL TARGET EXHIBITION THUMBNAILS CREATED AND SAFELY SYNCED!")
    print("=================================================================")

if __name__ == '__main__':
    run()
