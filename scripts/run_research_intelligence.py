"""
scripts/run_research_intelligence.py
CLI and Batch Runner for the 5-Stage Research Intelligence Agent:
0. Input Validation
1. API Search (SerpAPI/Tavily, No browser direct search)
2. 1st-Stage Text Filtering (Qwen2.5-VL Text Mode)
3. Selective Vision Assistance
4. Confidence Scoring (CONFIRMED >= 80, REVIEW 50-79, HOLD < 50)
5. Not Found Exception Handling
+ Downstream Database Integration (university_queue.json & professors.json).
"""
import os
import sys
import json
import asyncio
import argparse
from typing import Dict, Any, List

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add workspace path
WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

from research.research_intelligence_agent import ResearchIntelligenceAgent, format_final_report_text
from research.archive_card_integrator import ArchiveCardIntegrator

async def process_single_target(
    univ: str,
    dept: str,
    year: str,
    allow_mock_search: bool = False,
    save_db: bool = True
) -> Dict[str, Any]:
    agent = ResearchIntelligenceAgent(allow_mock_search=allow_mock_search)
    result = await agent.execute(univ, dept, year)

    # Print user-specified format
    report_text = format_final_report_text(result)
    print("==================================================", flush=True)
    print(report_text, flush=True)
    print("==================================================", flush=True)

    status = result.get("result_status")
    if status in ("CONFIRMED", "REVIEW") and save_db:
        if allow_mock_search:
            print("[SAFETY GUARD] Running in mock/test mode: Persisting to isolated store data/mock_isolated/", flush=True)
        integrator = ArchiveCardIntegrator(allow_mock=allow_mock_search)
        int_res = integrator.integrate_research_result(result)
        result["integration_result"] = int_res
        if int_res.get("success"):
            print(f"[연계 등록 완료] 아카이브 카드: {int_res['card_id']} ({int_res['card_status']}), 등록 교수: {len(int_res['registered_professors'])}명, 검토 격리 교수: {len(int_res.get('quarantined_professors', []))}명", flush=True)
        else:
            print(f"[CRITICAL ERROR] 연계 등록 실패: {int_res.get('message')}", flush=True)
            result["error"] = int_res.get("message")
            return result

    return result

async def main():
    parser = argparse.ArgumentParser(description="5-Stage Research Intelligence Agent Runner")
    parser.add_argument("--univ", type=str, default="건국대학교", help="조사 대상 대학교명")
    parser.add_argument("--dept", type=str, default="시각영상디자인학과", help="조사 대상 학과 키워드")
    parser.add_argument("--year", type=str, default="2026", help="조사 대상 연도")
    parser.add_argument("--allow-mock-search", action="store_true", help="API 키 부재 시 모의 후보 허용 (테스트 격리 전용)")
    parser.add_argument("--no-save-db", action="store_true", help="DB에 저장하지 않고 리포트만 출력")
    parser.add_argument("--batch-file", type=str, help="배치 실행용 JSON 파일 경로")

    args = parser.parse_args()

    if args.batch_file and os.path.exists(args.batch_file):
        with open(args.batch_file, "r", encoding="utf-8") as f:
            targets = json.load(f)
        print(f"[*] Starting batch execution for {len(targets)} targets...", flush=True)
        for t in targets:
            await process_single_target(
                univ=t.get("university", ""),
                dept=t.get("department", ""),
                year=str(t.get("year", "2026")),
                allow_mock_search=args.allow_mock_search,
                save_db=not args.no_save_db
            )
    else:
        await process_single_target(
            univ=args.univ,
            dept=args.dept,
            year=args.year,
            allow_mock_search=args.allow_mock_search,
            save_db=not args.no_save_db
        )

if __name__ == "__main__":
    asyncio.run(main())
