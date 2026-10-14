"""
scripts/sync_thumbnails_to_published.py
Safely syncs the thumbnail fields of Sejong (2025) and SWU (2025) from data/university_queue.json
into admin/data/university_queue.json, web/data/published/exhibitions.json, and data/published/exhibitions.json.
Maintains exact record count and schema integrity (JSON DB Safeguard).
"""

import json
import os
import sys

def sync():
    print("[1] Reading data/university_queue.json...")
    with open("data/university_queue.json", "r", encoding="utf-8") as f:
        data_queue = json.load(f)

    # Build mapping for target universities by exhibition ID and artwork index/image
    target_by_id = {}
    for item in data_queue:
        eid = item.get("id")
        if eid in ("UNIV-2025-서울여자대학교-산업디자인학과", "UNIV-2025-세종대학교-디자인이노베이션전공-firstchase"):
            target_by_id[eid] = item.get("artworks", [])
            print(f"Loaded {len(item.get('artworks', []))} artworks for {eid}")

    # [2] Update admin/data/university_queue.json
    admin_queue_path = "admin/data/university_queue.json"
    if os.path.exists(admin_queue_path):
        with open(admin_queue_path, "r", encoding="utf-8") as f:
            admin_queue = json.load(f)
        orig_count = len(admin_queue)
        updated_count = 0
        for item in admin_queue:
            eid = item.get("id")
            if eid in target_by_id:
                source_arts = target_by_id[eid]
                admin_arts = item.get("artworks", [])
                for i, art in enumerate(admin_arts):
                    if i < len(source_arts):
                        src_art = source_arts[i]
                        for field in ["thumbnail", "thumbnail_url", "thumbnail_crop_coordinates", "thumbnail_generated_at", "thumbnail_status", "thumbnail_review_status"]:
                            if field in src_art:
                                art[field] = src_art[field]
                        updated_count += 1
        assert len(admin_queue) == orig_count, "Admin queue count mismatch!"
        with open(admin_queue_path, "w", encoding="utf-8") as f:
            json.dump(admin_queue, f, ensure_ascii=False, indent=2)
        print(f"[OK] Updated {updated_count} artworks in {admin_queue_path} (Total records: {orig_count})")

    # [3] Update web/data/published/exhibitions.json and data/published/exhibitions.json
    for pub_path in ["web/data/published/exhibitions.json", "data/published/exhibitions.json"]:
        if os.path.exists(pub_path):
            with open(pub_path, "r", encoding="utf-8") as f:
                pub_data = json.load(f)
            orig_count = len(pub_data)
            updated_art_count = 0
            for item in pub_data:
                eid = item.get("id")
                if eid in target_by_id:
                    source_arts = target_by_id[eid]
                    pub_arts = item.get("artworks", [])
                    for i, art in enumerate(pub_arts):
                        if i < len(source_arts):
                            src_art = source_arts[i]
                            if src_art.get("thumbnail"):
                                art["thumbnail"] = src_art["thumbnail"]
                                art["thumbnail_url"] = src_art.get("thumbnail_url") or src_art["thumbnail"]
                            for field in ["thumbnail_crop_coordinates", "thumbnail_generated_at", "thumbnail_status", "thumbnail_review_status"]:
                                if field in src_art:
                                    art[field] = src_art[field]
                            updated_art_count += 1
            assert len(pub_data) == orig_count, f"{pub_path} count mismatch!"
            with open(pub_path, "w", encoding="utf-8") as f:
                json.dump(pub_data, f, ensure_ascii=False, indent=2)
            print(f"[OK] Updated {updated_art_count} artworks in {pub_path} (Total records: {orig_count})")

if __name__ == "__main__":
    sync()
