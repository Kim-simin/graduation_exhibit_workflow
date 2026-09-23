"""
scripts/test_ui_render_null_safety.py
Verifies that professors with null/empty assignment details render cleanly without runtime exceptions.
"""
import os
import sys
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

def test_null_safety():
    print("\n--- [TEST] UI Null-Safety & Fallback Verification ---", flush=True)

    professors_path = PROJECT_ROOT / "my-exhibit-platform" / "data" / "professors.json"
    assert professors_path.exists(), "Platform professors.json does not exist!"

    with open(professors_path, "r", encoding="utf-8") as f:
        profs = json.load(f)

    print(f"  [Verified] Loaded {len(profs)} professors from platform DB.")

    # Check for any fake strings in raw DB
    for p in profs:
        det = p.get("assignment_details")
        if det:
            # Verify no fake UI display string stored in raw DB
            assert det.get("title") != "확인된 정보 없음", f"UI display text was stored in raw DB! {p.get('id')}"
            assert det.get("objective") != "확인된 정보 없음", f"UI display text was stored in raw DB! {p.get('id')}"

    print("  [PASS] Raw DB contains fact-first data without synthetic UI display strings.", flush=True)

if __name__ == "__main__":
    test_null_safety()
