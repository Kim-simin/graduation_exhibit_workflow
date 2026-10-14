"""
scripts/test_research_automation_pipeline.py
신규 리서치 자동화 파이프라인(테스트 C) 및 제외 대상(테스트 D) 검증 테스트 스크립트

검증 항목:
[테스트 C]
1. 이미지 유형 분류 (세로보드 vs 일반비율)
2. 상단 대표 영역 스마트 추출 (여백 건너뛰기, 섹션 분할선 탐색)
3. 썸네일 파일 생성 및 별도 저장
4. 카드 썸네일 메타데이터 연결 (thumbnail, thumbnail_url, original_image_url, crop_coords)
5. 관리자 검토 상태 ("approved" 또는 "review_needed")
6. 재실행 중복 방지 (Idempotency: 동일 파일 재실행 시 캐시 재사용 확인)

[테스트 D]
7. 소프트웨어·컴퓨터공학 프로젝트 제외 판별 (is_software_engineering_exhibition)
8. IT·컴공 계열은 세로보드 썸네일 크롭 스킵 및 기존 방식 유지 확인
"""

import os
import sys
import tempfile
import shutil
from PIL import Image
import numpy as np

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.abspath('.'))
from research.thumbnail_processor import (
    is_software_engineering_exhibition,
    is_tall_board_image,
    find_smart_crop_boundary,
    process_single_artwork_image,
    process_exhibition_artworks
)

def run_tests():
    print("=================================================================")
    print("▶ RUNNING RESEARCH AUTOMATION & EXCLUSION TESTS (TEST C & D)")
    print("=================================================================")

    temp_dir = tempfile.mkdtemp(prefix="thumb_test_")
    try:
        # --- TEST C: New Research Automation Pipeline ---
        print("\n--- [TEST C-1] Image Type Classification (Aspect Ratio) ---")
        # Generate dummy tall board image (1200 x 8000)
        tall_w, tall_h = 1200, 8000
        tall_img_path = os.path.join(temp_dir, "test_tall_artwork.jpg")
        tall_im = Image.new("RGB", (tall_w, tall_h), color=(255, 255, 255))
        # Add simulated top visual: dark header in y=[100, 1500]
        tall_arr = np.array(tall_im)
        tall_arr[100:1500, :] = [40, 100, 200]
        tall_im = Image.fromarray(tall_arr)
        tall_im.save(tall_img_path, "JPEG")

        is_tall = is_tall_board_image(tall_w, tall_h)
        assert is_tall is True, "Expected 1200x8000 to be classified as tall board!"
        print("✔ 1. Tall board correctly classified (1200x8000, ratio 6.67)")

        # Generate standard image (1920 x 1080)
        std_w, std_h = 1920, 1080
        is_std_tall = is_tall_board_image(std_w, std_h)
        assert is_std_tall is False, "Expected 1920x1080 to NOT be classified as tall board!"
        print("✔ 2. Standard aspect correctly classified (1920x1080, ratio 0.56)")

        print("\n--- [TEST C-2] Smart Top Visual Boundary & Extraction ---")
        y0, y1 = find_smart_crop_boundary(tall_im)
        assert y0 == 100, f"Expected y_start to detect content at 100, got {y0}"
        assert y1 > y0 + tall_w * 0.9, f"Expected y1 to encompass main visual, got {y1}"
        print(f"✔ 3. Smart crop boundary detected: y0={y0}, y1={y1} (height={y1-y0})")

        print("\n--- [TEST C-3 & C-5] Thumbnail File Generation & Idempotency ---")
        thumb_out_path = os.path.join(temp_dir, "test_tall_artwork_thumb.jpg")
        
        # 1st run: fresh creation
        res1 = process_single_artwork_image(tall_img_path, thumb_out_path, force_recreate=True)
        assert res1 is not None and res1.get("status") == "cropped_tall_board"
        assert os.path.exists(thumb_out_path), "Thumbnail file was not created!"
        assert res1.get("reused") is False, "Expected first run to create file fresh"
        print(f"✔ 4. Thumbnail file created successfully: size={res1['thumb_size']}, file exists: True")

        # 2nd run: idempotency check (should reuse cached file without re-cropping)
        res2 = process_single_artwork_image(tall_img_path, thumb_out_path, force_recreate=False)
        assert res2 is not None and res2.get("reused") is True
        assert res2.get("status") == "cached"
        print("✔ 5. Idempotency verified: 2nd run reused existing thumbnail without duplicate crop")

        print("\n--- [TEST C-4 & C-5] Mock Exhibition Card Integration & Metadata ---")
        mock_exhibition = {
            "id": "UNIV-2026-테스트대학교-시각디자인학과",
            "university": "테스트대학교",
            "department": "시각디자인학과",
            "category": "디자인·순수미술",
            "title": "2026 테스트대학교 시각디자인학과 졸업전시회",
            "artworks": [
                {
                    "title": "테스트 미래 모빌리티 포스터",
                    "author": "홍길동",
                    "role": "디자이너",
                    "department": "COMMUNICATION DESIGN과",
                    "imagePath": tall_img_path
                }
            ]
        }

        # Process exhibition artworks
        mock_res = process_exhibition_artworks(mock_exhibition, public_bases=[temp_dir], force_recreate=True)
        assert mock_res["skipped"] is False
        assert mock_res["processed_count"] == 1
        art0 = mock_exhibition["artworks"][0]
        assert art0.get("thumbnail") is not None
        assert art0.get("thumbnail_url") is not None
        assert art0.get("original_image_url") == tall_img_path
        assert art0.get("thumbnail_status") == "approved"
        assert "thumbnail_crop_coordinates" in art0
        print(f"✔ 6. Exhibition Card integration verified: metadata attached correctly:")
        print(f"    - thumbnail: {art0['thumbnail']}")
        print(f"    - thumbnail_status: {art0['thumbnail_status']}")
        print(f"    - crop_coordinates: {art0['thumbnail_crop_coordinates']}")

        # --- TEST D: Software & Computer Engineering Exclusion ---
        print("\n--- [TEST D] Software & Computer Engineering Exclusion Verification ---")
        sw_cases = [
            ("it_sw", "컴퓨터공학과", "2025 컴공 학술제"),
            ("engineering", "소프트웨어학부", "2026 SW 캡스톤디자인"),
            ("it_sw", "인공지능학과", "2026 AI 프로젝트 전시"),
            ("기계·전자·일반공학", "전자공학과", "2025 전자 캡스톤"),
        ]
        for cat, dept, tit in sw_cases:
            is_sw = is_software_engineering_exhibition(cat, dept, tit)
            assert is_sw is True, f"Expected ({cat}, {dept}) to be classified as Software/Engineering (excluded)!"
            print(f"✔ Excluded as SW/Eng: [{cat}] {dept} -> is_excluded={is_sw}")

        # Visual exceptions check
        visual_cases = [
            ("디자인·순수미술", "산업디자인학과", "2025 산디 졸전"),
            ("디자인·순수미술", "디자인이노베이션전공", "2025 디자인이노베이션 졸전"),
            ("디자인·순수미술", "시각영상디자인과", "2025 디지털미디어아트전"),
            ("패션·라이프스타일", "패션디자인학과", "2025 패션쇼"),
        ]
        for cat, dept, tit in visual_cases:
            is_sw = is_software_engineering_exhibition(cat, dept, tit)
            assert is_sw is False, f"Expected ({cat}, {dept}) to NOT be excluded (is visual)!"
            print(f"✔ Correctly retained as Visual: [{cat}] {dept} -> is_excluded={is_sw}")

        # Also test process_exhibition_artworks on an excluded exhibition
        mock_sw_exhibit = {
            "id": "UNIV-2026-테스트대학교-컴퓨터공학부",
            "university": "테스트대학교",
            "department": "컴퓨터공학부",
            "category": "it_sw",
            "title": "2026 컴공 졸업작품전",
            "artworks": [{"title": "Cloud App", "imagePath": tall_img_path}]
        }
        sw_res = process_exhibition_artworks(mock_sw_exhibit)
        assert sw_res["skipped"] is True
        assert "소프트웨어·컴퓨터공학" in sw_res["reason"]
        print("✔ 7. Software Exhibition skipped processing with reason preserved.")

        print("\n=================================================================")
        print("🎉 ALL TESTS C & D PASSED SUCCESSFULLY!")
        print("=================================================================")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    run_tests()
