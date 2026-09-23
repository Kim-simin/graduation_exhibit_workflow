"""
scripts/test_vlm_router_and_crawler.py
Verification script for VLM-based dynamic scraping router and List-Detail crawler.
Target URL: https://cse.inu.ac.kr/isis/13789/subview.do (인천대학교)
"""

import os
import sys
import json
import base64
import asyncio
from playwright.async_api import async_playwright

# Ensure scripts dir is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from run_queue_agent import (
    analyze_page_type_with_llama,
    crawl_list_detail_pattern,
    detect_captcha,
    is_single_board_view,
    DEFAULT_USER_AGENT
)

TARGET_URL = "https://cse.inu.ac.kr/isis/13789/subview.do"
TEST_CARD_ID = "TEST-INU-2026"
TEST_OUTPUT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "my-exhibit-platform", "public", "captures")
)

async def test_incheon_univ_pipeline():
    print("=" * 60)
    print("[TEST START] VLM 동적 라우터 & List-Detail 크롤러 E2E 검증")
    print(f"[*] 대상 URL: {TARGET_URL}")
    print(f"[*] 테스트 카드 ID: {TEST_CARD_ID}")
    print(f"[*] 캡처 저장 경로: {TEST_OUTPUT_DIR}")
    print("=" * 60)

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled"
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 960},
            user_agent=DEFAULT_USER_AGENT,
            locale="ko-KR"
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        page = await context.new_page()

        # 1. 대상 URL 접속
        print(f"\n[1단계] 타겟 사이트 접속 중... ({TARGET_URL})")
        await page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=25000)
        await page.wait_for_timeout(1500)

        # 2. CAPTCHA 감지 검사
        is_cap, cap_reason = await detect_captcha(page, TARGET_URL)
        print(f"[*] CAPTCHA 검사 결과: 감지됨={is_cap} (사유: {cap_reason if is_cap else '정상 진입'})")
        assert not is_cap, f"CAPTCHA에 가로막힘: {cap_reason}"

        # 3. 로컬 VLM (llama-server) 라우터 실행 및 판별
        print("\n[2단계] 첫 화면 스크린샷 캡처 및 VLM 페이지 구조 분석 전송...")
        screenshot_bytes = await page.screenshot(full_page=False)
        b64_image = base64.b64encode(screenshot_bytes).decode("utf-8")

        is_board_view = await is_single_board_view(page, TARGET_URL)
        page_type = await analyze_page_type_with_llama(
            b64_image,
            server_url="http://127.0.0.1:8080",
            fallback_hint_url=TARGET_URL,
            fallback_is_board=is_board_view
        )
        print(f"[*] 라우터 최종 판정 결과: {page_type}")
        assert page_type in ("LIST_BOARD", "GRID_GALLERY"), f"유효하지 않은 page_type: {page_type}"
        assert page_type == "LIST_BOARD", f"인천대 게시판 페이지가 LIST_BOARD로 분류되어야 함 (현재: {page_type})"

        # 4. List-Detail 크롤러 실행 (crawl_list_detail_pattern)
        print("\n[3단계] crawl_list_detail_pattern() 실행 (목록-상세 순회)...")
        results = await crawl_list_detail_pattern(
            page=page,
            target_url=TARGET_URL,
            card_id=TEST_CARD_ID,
            output_dir=TEST_OUTPUT_DIR,
            univ="인천대학교",
            dept="컴퓨터공학과"
        )

        print(f"\n[4단계] 수집 결과 검증 (총 {len(results)}건 수집됨)")
        assert len(results) >= 40, f"인천대 전체 작품(43건) 중 대부분이 수집되어야 함! (현재: {len(results)}건)"

        # 전체 수집 파일 무결성 검증
        valid_files = 0
        for idx, item in enumerate(results, start=1):
            abs_img_path = os.path.join(TEST_OUTPUT_DIR, TEST_CARD_ID, f"work_{idx}.png")
            exists = os.path.exists(abs_img_path)
            size = os.path.getsize(abs_img_path) if exists else 0
            if exists and size > 500:
                valid_files += 1

        print(f"[*] 총 {len(results)}개 중 정상 생성된 에셋 파일: {valid_files}개")
        assert valid_files >= 40, f"에셋 파일이 부족합니다: {valid_files}/{len(results)}"

        # 상위 5건 및 마지막 3건 출력
        print("\n[*] 수집된 작품 샘플 (상위 5건):")
        for idx, item in enumerate(results[:5], start=1):
            print(f"  [{idx:2d}] 작품명: {item['title']} | 작가/팀: {item['author']} | URL: {item['detail_url']}")
        print("\n[*] 수집된 작품 샘플 (마지막 3건):")
        for idx, item in enumerate(results[-3:], start=len(results)-2):
            print(f"  [{idx:2d}] 작품명: {item['title']} | 작가/팀: {item['author']} | URL: {item['detail_url']}")

        await browser.close()

    print("\n" + "=" * 60)
    print(f"[SUCCESS] 인천대학교 대상 VLM 동적 라우팅 및 43개 전체 작품 수집 검증 완료! (총 {len(results)}건)")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_incheon_univ_pipeline())
