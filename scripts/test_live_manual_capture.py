"""
scripts/test_live_manual_capture.py
Tests crawl_and_capture_exhibition_async directly on KKU with dry-run output dir.
"""
import sys
import os
import asyncio
import shutil

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))
from manual_capture import crawl_and_capture_exhibition_async

async def main():
    test_out = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_captures_tmp"))
    if os.path.exists(test_out):
        shutil.rmtree(test_out, ignore_errors=True)
    os.makedirs(test_out, exist_ok=True)

    target_url = "https://kku2026mid.com/project"
    card_id = "TEST-KKU-DEDUP"
    univ = "건국대학교"
    dept = "시각영상디자인학과"

    print("[*] Running crawl_and_capture_exhibition_async...")
    res = await crawl_and_capture_exhibition_async(
        target_url=target_url,
        card_id=card_id,
        univ=univ,
        dept=dept,
        out_dir=os.path.join(test_out, card_id)
    )

    print(f"[*] Total captured works: {len(res.get('works', []))}")
    works = res.get('works', [])

    titles = [w.get('title') for w in works]
    print(f"[*] Sample titles (first 10): {titles[:10]}")

    # Check for duplicates
    dupe_titles = [t for t in set(titles) if titles.count(t) > 1 and not t.startswith('작품 #')]
    print(f"[*] Duplicate titles count: {len(dupe_titles)} -> {dupe_titles}")

    fallbacks = [w for w in works if w.get('title', '').startswith('작품 #')]
    print(f"[*] Fallback '작품 #' count: {len(fallbacks)}")

    # Check 'Click to Dive'
    dive = [w for w in works if 'dive' in w.get('title', '').lower()]
    print(f"[*] 'Click to Dive' entries ({len(dive)}):")
    for d in dive:
        print(f"    - Title: {d.get('title')}, Author: {d.get('author')}, Detail: {d.get('detail_url')}")

    # Clean up test output directory
    shutil.rmtree(test_out, ignore_errors=True)
    print("[*] Cleanup finished. All tests complete!")

if __name__ == "__main__":
    asyncio.run(main())
