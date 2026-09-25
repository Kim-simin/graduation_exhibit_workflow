import json
import os
import sys

# Ensure UTF-8 output encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

def check_card(item):
    return bool(
        item.get("disable_artwork_zoom") or
        item.get("disableArtworkZoom") or
        item.get("id") == "UNIV-2026-인천대학교-컴퓨터공학부-7899" or
        ("인천대" in item.get("university", "") and "컴퓨터공학부" in item.get("department", "") and "2026" in str(item.get("year", ""))) or
        "인천대학교 2026년 컴퓨터공학부 졸업전시회" in item.get("exhibition_title", "") or
        "인천대학교 2026년 컴퓨터공학부 졸업전시회" in item.get("title", "")
    )

with open("data/university_queue.json", "r", encoding="utf-8") as f:
    cards = json.load(f)

print(f"Total cards in root queue: {len(cards)}")
inu_found = False
for c in cards:
    zoom_disabled = check_card(c)
    cid = c.get("id")
    univ = c.get("university")
    dept = c.get("department")
    year = c.get("year")
    title = c.get("title") or c.get("exhibition_title")
    if zoom_disabled:
        print(f"[ZOOM DISABLED]: {cid} | {univ} | {dept} | {year} | {title}")
        if "인천대" in univ and "컴퓨터공학부" in dept:
            inu_found = True
    else:
        # Check if accidentally disabled
        if "인천대" in univ and "컴퓨터공학부" in dept:
            print(f"[ERROR! INU NOT DISABLED]: {cid}")

if inu_found:
    print("\n[VERIFICATION SUCCESS] Only the targeted Incheon National University exhibition has zoom disabled!")
else:
    print("\n[FAILURE] Target card was not found or not disabled!")
