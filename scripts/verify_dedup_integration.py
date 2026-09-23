"""
scripts/verify_dedup_integration.py
Verifies that run_queue_agent.py and manual_capture.py import properly and run smoothly.
"""
import sys
import os

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(__file__))

try:
    import run_queue_agent
    print("[PASS] Successfully imported run_queue_agent")
    assert hasattr(run_queue_agent, 'normalize_title'), "normalize_title missing"
    assert hasattr(run_queue_agent, 'normalize_url'), "normalize_url missing"
    assert hasattr(run_queue_agent, 'normalize_img_src'), "normalize_img_src missing"
    assert hasattr(run_queue_agent, 'filter_top_level_card_elements'), "filter_top_level_card_elements missing"
    print("[PASS] All deduplication helper functions present in run_queue_agent")
except Exception as e:
    print(f"[FAIL] run_queue_agent import failed: {e}")
    sys.exit(1)

try:
    import manual_capture
    print("[PASS] Successfully imported manual_capture")
except Exception as e:
    print(f"[FAIL] manual_capture import failed: {e}")
    sys.exit(1)

# Test helper functions with actual cases
title1 = "Click to Dive"
title2 = "  Click  to  Dive! "
assert run_queue_agent.normalize_title(title1) == run_queue_agent.normalize_title(title2), "Title normalization mismatch"

url1 = "https://kku2026mid.com/project/202023442/1/"
url2 = "https://kku2026mid.com/project/202023442/1?ref=test#section"
assert run_queue_agent.normalize_url(url1) == run_queue_agent.normalize_url(url2), "URL normalization mismatch"

img1 = "/images/students/202023442/1/thumbnail.jpg"
img2 = "https://kku2026mid.com/images/students/202023442/1/thumbnail.jpg?w=640"
assert run_queue_agent.normalize_img_src(img1, "https://kku2026mid.com") == run_queue_agent.normalize_img_src(img2, "https://kku2026mid.com"), "Image normalization mismatch"

print("[PASS] All unit tests passed!")
