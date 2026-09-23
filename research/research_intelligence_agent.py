"""
research/research_intelligence_agent.py
Upstream Research Intelligence Agent executing the strict 5-stage pipeline:
0. Input Validation
1. API Search (SerpAPI/Tavily, No browser direct search)
2. 1st-Stage Text Filtering (Qwen2.5-VL Text Mode)
3. Selective Vision Assistance (Canvas, <200 chars, UNCERTAIN)
4. Confidence Scoring (100-pt scale: CONFIRMED >= 80, REVIEW 50-79, HOLD < 50)
5. Not Found Exception Handling
"""
import os
import sys
import re
import json
import base64
import asyncio
import urllib.request
import urllib.parse
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from playwright.async_api import async_playwright
from .search_api_provider import SearchAPIProvider, SearchCandidate, generate_search_queries

DEFAULT_LOCAL_LLM_URL = os.getenv("LLAMA_API_BASE", "http://127.0.0.1:8080/v1")

def query_local_llm_text(prompt: str, system_prompt: str = "", server_url: str = DEFAULT_LOCAL_LLM_URL) -> Dict[str, Any]:
    """Calls local Qwen2.5-VL in pure text mode."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = json.dumps({
        "messages": messages,
        "temperature": 0.1,
        "max_tokens": 512
    }).encode("utf-8")

    endpoint = f"{server_url.rstrip('/')}/chat/completions"
    try:
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            raw_content = data["choices"][0]["message"]["content"]
            # Clean think tags and markdown
            clean = re.sub(r"<think>.*?</think>", "", raw_content, flags=re.DOTALL)
            clean = re.sub(r"```(?:json)?", "", clean).replace("```", "").strip()
            match = re.search(r"(\{[\s\S]*\})", clean)
            if match:
                return json.loads(match.group(1))
    except Exception as e:
        # Explicitly tag model error
        return {"verdict": "ERROR", "reasoning": f"Local LLM connection error: {e}", "model_error": True}

def query_local_llm_vision(screenshot_base64: str, prompt: str, server_url: str = DEFAULT_LOCAL_LLM_URL) -> str:
    """Calls local Qwen2.5-VL in vision mode."""
    payload = json.dumps({
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{screenshot_base64}"}}
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 768
    }).encode("utf-8")

    endpoint = f"{server_url.rstrip('/')}/chat/completions"
    try:
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=20.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[Vision Extraction Fallback] Could not reach vision model: {e}"

class ResearchIntelligenceAgent:
    def __init__(self, allow_mock_search: bool = False, local_llm_url: str = DEFAULT_LOCAL_LLM_URL):
        self.search_provider = SearchAPIProvider(allow_mock=allow_mock_search)
        self.local_llm_url = local_llm_url

    async def execute(
        self,
        university_name: str,
        department_keyword: str,
        target_year: str
    ) -> Dict[str, Any]:
        """
        Executes the full 5-stage pipeline.
        Returns a structured report dictionary.
        """
        # 0단계: 입력값 검증
        if not university_name:
            raise ValueError("university_name is required")
        target_year = str(target_year).strip() or "2026"
        department_keyword = department_keyword.strip()

        print(f"\n[Research Intelligence Agent] Starting investigation: {university_name} {department_keyword} ({target_year})", flush=True)

        # 1단계: 검색 (API 기반, 브라우저 직접 검색 절대 금지)
        queries = generate_search_queries(university_name, department_keyword, target_year)
        try:
            candidates: List[SearchCandidate] = self.search_provider.execute_search(
                university_name, department_keyword, target_year
            )
        except Exception as e:
            print(f"[1단계 검색 API 오류] {e}", flush=True)
            candidates = []

        if not candidates:
            return self._build_not_found_report(
                university_name, department_keyword, target_year, queries,
                checked_count=0, reason="검색 API에서 유효한 URL 후보군을 발굴하지 못함"
            )

        print(f"[*] [1단계 완료] {len(candidates)}개 후보 URL 발굴 (중복 제거 및 도메인 태깅 완료)", flush=True)

        # 2단계 ~ 4단계 순회 평가
        evaluated_results = []
        discarded_reasons = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
            page = await context.new_page()

            for cand in candidates:
                url = cand.url
                print(f"\n[*] Evaluating candidate: {url} ({cand.domain_type})", flush=True)

                try:
                    # 2단계: HTML 텍스트만 추출 (스크린샷 없이 고속 텍스트 추출)
                    await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_timeout(1000)

                    # Extract pure text
                    page_title = await page.title()
                    raw_text = await page.evaluate("() => (document.body.innerText || document.body.textContent || '').trim()")
                    clean_text = re.sub(r'\s+', ' ', raw_text)[:3000]

                    # Qwen2.5-VL (Text Mode) 검증
                    prompt = (
                        f"Target: Year {target_year}, University {university_name}, Department {department_keyword}\n"
                        f"Page Title: {page_title}\n"
                        f"Webpage Text Content Snippet:\n{clean_text[:1800]}\n\n"
                        "Question: Is this webpage directly related to the graduation exhibition or capstone design project for the specified target?\n"
                        "Instructions:\n"
                        "1. Return JSON with 'verdict' ('YES', 'NO', 'UNCERTAIN') and 'reasoning'.\n"
                        "2. Respond in Korean for the reasoning field."
                    )
                    system_prompt = "You are a factual academic validator. Answer in JSON with keys 'verdict' and 'reasoning'."

                    llm_verdict = query_local_llm_text(prompt, system_prompt, self.local_llm_url)
                    verdict = str(llm_verdict.get("verdict", "UNCERTAIN")).upper().strip()
                    reasoning = llm_verdict.get("reasoning", "")

                    if "NO" in verdict and "YES" not in verdict:
                        discarded_reasons.append(f"{url}: 2단계 텍스트 검증에서 'NO' 판정 폐기 ({reasoning})")
                        print(f"  [-] [2단계 탈락: NO] {reasoning}", flush=True)
                        continue

                    print(f"  [+] [2단계 통과: {verdict}] {reasoning}", flush=True)

                    # 3단계: Vision 보조 투입 여부 판단
                    needs_vision = (
                        len(clean_text) < 200 or
                        "UNCERTAIN" in verdict or
                        await page.evaluate("() => !!document.querySelector('canvas, [class*=\"webgl\"]')")
                    )

                    works_table_md = ""
                    if needs_vision:
                        print(f"  [!] [3단계 Vision 보조 투입] 조건 충족 (텍스트길이={len(clean_text)}, 판정={verdict})", flush=True)
                        try:
                            # Viewport 캡처 후 Vision 모델에 전달
                            shot_bytes = await page.screenshot(type="jpeg", quality=60)
                            shot_b64 = base64.b64encode(shot_bytes).decode("utf-8")
                            v_prompt = (
                                "이 졸업전시 화면을 분석하여 [학생 이름], [학과], [작품명]을 추출하여 마크다운 테이블로 정리해주세요. "
                                "화면에 보이는 정보만 정확히 작성하세요."
                            )
                            works_table_md = query_local_llm_vision(shot_b64, v_prompt, self.local_llm_url)
                        except Exception as ve:
                            print(f"  [!] Vision 호출 오류: {ve}", flush=True)

                    # 4단계: 신뢰도 스코어링 (100점 만점)
                    score = 0

                    # 1. 공식 출처 여부 (30점)
                    if cand.domain_type == "OFFICIAL_ACADEMIC":
                        score += 30
                    elif cand.domain_type == "SNS":
                        score += 15
                    elif cand.domain_type == "NEWS":
                        score += 10
                    else:
                        score += 5

                    # 2. 연도 일치 (20점)
                    if target_year in page_title or target_year in clean_text:
                        score += 20
                    elif str(int(target_year) - 1) in clean_text:
                        score += 5

                    # 3. 핵심 정보 존재 (30점: 일정, 장소, 학생/작품 각 10점)
                    has_date = bool(re.search(r'\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}', clean_text) or any(w in clean_text for w in ["일시", "기간", "전시일정"]))
                    has_venue = any(w in clean_text for w in ["장소", "갤러리", "홀", "전시관", "온라인", "캠퍼스"])
                    
                    has_valid_vision_table = bool(
                        works_table_md and
                        len(works_table_md) > 20 and
                        "[Vision Extraction Fallback]" not in works_table_md and
                        "error" not in works_table_md.lower() and
                        "|" in works_table_md
                    )
                    has_works = has_valid_vision_table or any(w in clean_text for w in ["작품", "프로젝트", "출품작", "졸업작품"])

                    if has_date: score += 10
                    if has_venue: score += 10
                    if has_works: score += 10

                    # 4. 2단계 판정 결과 (20점)
                    model_errored = bool(llm_verdict.get("model_error", False))
                    if "YES" in verdict and not model_errored:
                        score += 20
                    elif "UNCERTAIN" in verdict and not model_errored:
                        score += 10
                    else:
                        score += 0

                    # 등급 산출 (모델 오류 발생 시 CONFIRMED 승격 절대 금지: REVIEW 이하로 강제 캡)
                    if score >= 80 and not model_errored:
                        status = "CONFIRMED"
                    elif score >= 50 or model_errored:
                        status = "REVIEW" if score >= 50 else "HOLD"
                    else:
                        status = "HOLD"

                    print(f"  [*] [4단계 스코어링] 점수: {score}/100 (ModelError={model_errored}) -> 등급: {status}", flush=True)

                    # 추출된 메타데이터 요약
                    date_match = re.search(r'(\d{4}[.\-/년]\s*\d{1,2}[.\-/월]\s*\d{1,2}.*?\d{1,2}[일호]?)', clean_text)
                    period_str = date_match.group(1).strip() if date_match else f"{target_year}년 전시"
                    venue_str = f"{university_name} 전시홀"

                    evaluated_results.append({
                        "url": url,
                        "score": score,
                        "status": status,
                        "period": period_str,
                        "venue": venue_str,
                        "works_table": works_table_md,
                        "reasoning": reasoning,
                        "domain_type": cand.domain_type
                    })

                except Exception as e:
                    discarded_reasons.append(f"{url}: 페이지 탐색 중 예외 발생 ({e})")
                    print(f"  [-] Error loading {url}: {e}", flush=True)

            await browser.close()

        # 5단계: 결과 종합 및 예외 처리
        confirmed_candidates = [r for r in evaluated_results if r["status"] == "CONFIRMED"]
        review_candidates = [r for r in evaluated_results if r["status"] == "REVIEW"]

        if confirmed_candidates:
            top_result = max(confirmed_candidates, key=lambda x: x["score"])
            final_status = "CONFIRMED"
        elif review_candidates:
            top_result = max(review_candidates, key=lambda x: x["score"])
            final_status = "REVIEW"
        else:
            return self._build_not_found_report(
                university_name, department_keyword, target_year, queries,
                checked_count=len(candidates),
                reason="; ".join(discarded_reasons[:3]) if discarded_reasons else "모든 후보 URL이 신뢰도 50점 미만(HOLD)으로 폐기됨"
            )

        # Build Final Confirmed/Review Report
        return {
            "university_name": university_name,
            "department_keyword": department_keyword,
            "target_year": target_year,
            "result_status": final_status,
            "detail": {
                "source_url": top_result["url"],
                "confidence_score": top_result["score"],
                "exhibition_period": top_result["period"],
                "exhibition_venue": top_result["venue"],
                "works_table": top_result["works_table"],
                "reasoning": top_result["reasoning"],
                "domain_type": top_result["domain_type"]
            },
            "all_evaluated": evaluated_results
        }

    def _build_not_found_report(
        self,
        univ: str,
        dept: str,
        year: str,
        queries: List[str],
        checked_count: int,
        reason: str
    ) -> Dict[str, Any]:
        return {
            "university_name": univ,
            "department_keyword": dept,
            "target_year": year,
            "result_status": "NOT_FOUND",
            "not_found_details": {
                "attempted_queries": queries,
                "checked_candidates_count": checked_count,
                "disposal_reason": reason
            }
        }

def format_final_report_text(result: Dict[str, Any]) -> str:
    """Formats the agent output matching the exact requested prompt format."""
    univ = result.get("university_name", "")
    dept = result.get("department_keyword", "")
    year = result.get("target_year", "")
    status = result.get("result_status", "NOT_FOUND")

    lines = [
        f"대학명: {univ}",
        f"학과: {dept}",
        f"연도: {year}",
        "",
        f"[결과 상태]: {status}",
        ""
    ]

    if status in ("CONFIRMED", "REVIEW"):
        det = result.get("detail", {})
        lines.extend([
            "[상세 정보]",
            f"- 출처 URL: {det.get('source_url', '')}",
            f"- 신뢰도 점수: {det.get('confidence_score', 0)}/100",
            f"- 전시 일정: {det.get('exhibition_period', '')}",
            f"- 전시 장소: {det.get('exhibition_venue', '')}",
            f"- 판단 근거 요약: {det.get('reasoning', '')}",
            "- 참여 학생/작품 목록:"
        ])
        works_table = det.get("works_table", "").strip()
        if works_table:
            lines.append(works_table)
        else:
            lines.append("  (본문 텍스트 기반 정상 확인되어 다운스트림 심층 스크래퍼 실행 대기)")
    else:
        nf = result.get("not_found_details", {})
        lines.extend([
            "[NOT_FOUND 사유 요약]",
            f"- 시도한 검색 쿼리: {', '.join(nf.get('attempted_queries', []))}",
            f"- 확인한 후보 URL 수: {nf.get('checked_candidates_count', 0)}",
            f"- 폐기 사유 요약: {nf.get('disposal_reason', '')}"
        ])

    return "\n".join(lines)
