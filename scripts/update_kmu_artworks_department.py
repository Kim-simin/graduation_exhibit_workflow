import json
import os
import sys

# Ensure UTF-8 output encoding for Korean characters
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT_QUEUE_PATH = os.path.abspath("data/university_queue.json")
PLATFORM_QUEUE_PATH = os.path.abspath("my-exhibit-platform/data/university_queue.json")
TARGET_CARD_ID = "UNIV-2026-국민대학교-소프트웨어학부-kmu-expo"

# Department mapping definition based on user prompt:
# M · 모바일 (7팀)
# A · 인공지능 (AI/ML) (5팀)
# G · 게임 (5팀)
# W · 웹서비스·임베디드·기타 (11팀)
# S · 사회혁신 (2팀)
CATEGORY_MAP = {
    "M": "모바일",
    "A": "인공지능 (AI/ML)",
    "G": "게임",
    "W": "웹서비스·임베디드·기타",
    "S": "사회혁신"
}

EXPECTED_COUNTS = {
    "모바일": 7,
    "인공지능 (AI/ML)": 5,
    "게임": 5,
    "웹서비스·임베디드·기타": 11,
    "사회혁신": 2
}

def update_artworks(filepath):
    print(f"Loading {filepath}...")
    if not os.path.exists(filepath):
        print(f"[ERROR] File does not exist: {filepath}")
        return False

    with open(filepath, "r", encoding="utf-8") as f:
        queue = json.load(f)

    target_card = None
    for card in queue:
        if card.get("id") == TARGET_CARD_ID:
            target_card = card
            break

    if not target_card:
        print(f"[ERROR] Card {TARGET_CARD_ID} not found in {filepath}")
        return False

    artworks = target_card.get("artworks", [])
    print(f"Found {len(artworks)} artworks for {TARGET_CARD_ID}")

    counts = {dept: 0 for dept in EXPECTED_COUNTS}
    unmapped = []

    for idx, art in enumerate(artworks, start=1):
        title = art.get("title", "").strip()
        # Look for prefix like [M1], [A1], [G1], [W1], [S1] or M1, A1, etc.
        category = None
        for prefix, dept_name in CATEGORY_MAP.items():
            if title.startswith(f"[{prefix}") or title.startswith(f"{prefix}-") or title.startswith(f"{prefix} "):
                category = dept_name
                break
            # Also check if title starts with e.g. [M 1] or similar
            if title.startswith("[") and len(title) > 1 and title[1].upper() == prefix:
                category = dept_name
                break

        if not category:
            # Fallback check on description or other fields
            for prefix, dept_name in CATEGORY_MAP.items():
                if f"[{prefix}" in title:
                    category = dept_name
                    break

        if category:
            art["department"] = category
            counts[category] += 1
            print(f"  [{idx:02d}] {title:45s} -> {category} ({art.get('student_name', '')})")
        else:
            unmapped.append((idx, title))
            print(f"  [UNMAPPED {idx:02d}] {title}")

    print("\n--- Summary of Classification ---")
    all_matched = True
    for dept, expected in EXPECTED_COUNTS.items():
        actual = counts.get(dept, 0)
        match = "OK" if actual == expected else "MISMATCH"
        if actual != expected:
            all_matched = False
        print(f"  {dept:25s}: {actual:2d} / {expected:2d} [{match}]")

    if unmapped:
        print(f"[ERROR] {len(unmapped)} artworks could not be classified automatically:")
        for idx, title in unmapped:
            print(f"    - #{idx}: {title}")
        return False

    if not all_matched:
        print("[WARNING] Track counts do not exactly match expected counts! Aborting save.")
        return False

    # Atomically save to file
    temp_path = filepath + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)
    os.replace(temp_path, filepath)
    print(f"[SUCCESS] Updated and saved {filepath} safely.\n")
    return True

def main():
    print("=== 국민대학교 소프트웨어학부 작품 상세 학과(트랙) 분류 시작 ===")
    ok1 = update_artworks(ROOT_QUEUE_PATH)
    ok2 = update_artworks(PLATFORM_QUEUE_PATH)

    if ok1 and ok2:
        print("=== 모든 데이터베이스 동기화 완료! ===")
    else:
        print("=== 업데이트 중 오류 발생! ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
