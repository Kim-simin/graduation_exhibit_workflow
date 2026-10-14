# scripts/test_single_thumb.py
import os
import sys

sys.path.insert(0, os.path.abspath('.'))
from research.thumbnail_processor import process_single_artwork_image

# Test 1: SWU
swu_src = "web/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과/artwork_1_full.jpg"
swu_dst = "web/public/uploads/UNIV-2025-서울여자대학교-산업디자인학과/artwork_1_thumb.jpg"
res_swu = process_single_artwork_image(swu_src, swu_dst, force_recreate=True)
print("SWU Result:", res_swu)

# Test 2: Sejong
sejong_src = "web/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/work_02_GOLDFISHSYNDROME.jpg"
sejong_dst = "web/public/uploads/UNIV-2025-세종대학교-디자인이노베이션전공/work_02_GOLDFISHSYNDROME_thumb.jpg"
res_sejong = process_single_artwork_image(sejong_src, sejong_dst, force_recreate=True)
print("Sejong Result:", res_sejong)

print("\nChecking generated files exist:")
print(f"SWU thumb exists: {os.path.exists(swu_dst)}, size: {os.path.getsize(swu_dst)} bytes")
print(f"Sejong thumb exists: {os.path.exists(sejong_dst)}, size: {os.path.getsize(sejong_dst)} bytes")
