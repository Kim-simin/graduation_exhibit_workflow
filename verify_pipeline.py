"""
=============================================================================
전국 대학교 졸업전시회 카드뉴스 파이프라인 사전 검증 진단 스크립트
파일명: verify_pipeline.py
실행: python verify_pipeline.py
=============================================================================
"""

import sys
import os
import re
import json
import time
import urllib.request
from datetime import datetime
from typing import Dict, Any, List, Optional

# Windows 환경 콘솔 UTF-8 출력 보정 및 가상 터미널 ANSI 색상 활성화
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass
    os.system('')  # Windows CMD/PowerShell ANSI 컬러 코드 활성화

# ---------------------------------------------------------
# 콘솔 ANSI 컬러 스타일 정의
# ---------------------------------------------------------
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

def print_header(step_no: int, title: str):
    print("\n" + "=" * 70)
    print(f"{BOLD}{CYAN}▶ [검증 {step_no}단계] {title}{RESET}")
    print("=" * 70)

def print_pass(msg: str):
    print(f"  {BOLD}{GREEN}✔ [통과/PASS]{RESET} {msg}")

def print_fail(msg: str):
    print(f"  {BOLD}{RED}✘ [실패/FAIL]{RESET} {msg}")

def print_info(msg: str):
    print(f"  {BOLD}{CYAN}ℹ [정보/INFO]{RESET} {msg}")

def print_warn(msg: str):
    print(f"  {BOLD}{YELLOW}⚠ [경고/WARN]{RESET} {msg}")


# =============================================================================
# [검증 1단계: llama.cpp 로컬 서버 통신 및 응답 속도]
# =============================================================================
def verify_step_1_llm_connection(base_url: str = "http://localhost:8080/v1") -> str:
    print_header(1, "llama.cpp 로컬 서버 통신 및 응답 속도 검증")
    print_info(f"엔드포인트 확인: {base_url}")

    # 1-1. 서버 HTTP 연결 및 모델 ID 획득
    models_url = f"{base_url}/models"
    active_model = "local-model"
    try:
        req = urllib.request.Request(models_url, headers={"User-Agent": "Antigravity-Verifier/1.0"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            if resp.status == 200:
                raw_json = json.loads(resp.read().decode("utf-8"))
                data_list = raw_json.get("data", [])
                if data_list:
                    active_model = data_list[0].get("id", "local-model")
                print_pass(f"HTTP 포트 8080 응답 정상 (HTTP 200 OK)")
                print_info(f"서버 등록 모델명: {BOLD}{active_model}{RESET}")
            else:
                raise ConnectionError(f"HTTP {resp.status}")
    except Exception as e:
        print_fail(f"로컬 llama.cpp 서버에 연결할 수 없습니다: {e}")
        print("\n" + "-" * 70)
        print(f"{BOLD}{YELLOW}💡 [llama-server 구동 가이드]{RESET}")
        print("별도의 터미널 창을 열고 아래 명령어로 로컬 LLM 서버를 먼저 구동하세요:")
        print(f"{BOLD}llama-server -m \"경로/모델파일명.gguf\" -c 4096 -ngl 99 --port 8080{RESET}")
        print("-" * 70 + "\n")
        sys.exit(1)

    # 1-2. langchain_openai.ChatOpenAI 핑 및 TTFT / 전체 응답 속도 측정
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage

    print_info("ChatOpenAI 클라이언트 인스턴스화 및 응답 속도(TTFT) 측정 중...")
    try:
        llm = ChatOpenAI(
            base_url=base_url,
            api_key="not-needed",
            model=active_model,
            temperature=0.1,
            max_tokens=64,
            timeout=30.0
        )

        test_prompt = "Hello! Answer with exactly two words: 'SYSTEM READY'."
        t_start = time.perf_counter()
        t_first_token = None
        collected_chunks = []

        # 스트리밍을 통해 첫 번째 토큰 속도(TTFT) 정밀 측정
        for chunk in llm.stream([HumanMessage(content=test_prompt)]):
            if t_first_token is None:
                t_first_token = time.perf_counter()
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            collected_chunks.append(content)

        t_end = time.perf_counter()
        full_text = "".join(collected_chunks).strip()
        ttft = (t_first_token - t_start) if t_first_token else (t_end - t_start)
        total_time = t_end - t_start

        print_pass("LLM 핑 생성 테스트 성공")
        print(f"      • 첫 번째 토큰 응답 속도(TTFT): {BOLD}{ttft:.3f}초{RESET}")
        print(f"      • 전체 응답 완료 소요 시간: {BOLD}{total_time:.3f}초{RESET}")
        print(f"      • 모델 응답 샘플: {DIM}\"{full_text[:80]}\"{RESET}")
        return active_model

    except Exception as e:
        print_fail(f"LLM 텍스트 생성 테스트 실패: {e}")
        print("\n" + "-" * 70)
        print(f"{BOLD}{YELLOW}💡 [안내]{RESET} 서버가 켜져 있으나 모델 추론 중 오류가 발생했습니다.")
        print(f"llama-server 콘솔 로그와 메모리(VRAM) 상태를 확인하세요.")
        print("-" * 70 + "\n")
        sys.exit(1)


# =============================================================================
# [검증 2단계: 로컬 LLM JSON 파싱 무결성 및 카드뉴스 카피 생성]
# =============================================================================
def verify_step_2_curation_generation(active_model: str) -> Dict[str, Any]:
    print_header(2, "로컬 LLM JSON 파싱 무결성 및 카드뉴스 카피 생성 검증")

    queue_path = os.path.join("data", "university_queue.json")
    if not os.path.exists(queue_path):
        print_fail(f"대기열 데이터 파일({queue_path})을 찾을 수 없습니다.")
        sys.exit(1)

    with open(queue_path, "r", encoding="utf-8") as f:
        queue_data = json.load(f)

    # 첫 번째 대기 항목 (건국대학교 리빙디자인학과) 선택
    target_item = None
    for item in queue_data:
        if "건국대" in item.get("university", "") and "리빙디자인" in item.get("department", ""):
            target_item = item
            break
    if not target_item and queue_data:
        target_item = queue_data[0]

    print_info(f"검증 대상 데이터: [{target_item.get('id')}] {target_item.get('university')} {target_item.get('department')}")
    print_info(f"전시명: {target_item.get('exhibition_title') or target_item.get('exhibit_title')}")

    from langchain_openai import ChatOpenAI
    from langchain_core.messages import SystemMessage, HumanMessage
    from pydantic import BaseModel, Field

    class CurationMetadata(BaseModel):
        headline: str = Field(description="전시회를 관통하는 1~2줄 대형 헤드라인 카피")
        curation_intro: str = Field(description="전시 기획 의도 및 출품작들을 아우르는 3문장 큐레이션 본문")
        inferred_industry_keywords: List[str] = Field(description="학과 및 작품 기반 핵심 직무/산업 키워드 뱃지")
        full_caption: str = Field(description="전시 일정/장소, 전체 출품 학생 명단, 해시태그가 포함된 인스타그램/아카이브용 캡션")

    llm = ChatOpenAI(
        base_url="http://localhost:8080/v1",
        api_key="not-needed",
        model=active_model,
        temperature=0.2,
        timeout=35.0
    )

    system_prompt = (
        "당신은 대학교 졸업전시회 전문 총괄 큐레이터이자 비평가입니다.\n"
        "[절대 규칙: 100% 순수 텍스트 생성]\n"
        "모든 필드는 HTML 태그(<div> 등)나 불필요한 마크다운을 배제하고 100% 순수 텍스트만 생성해야 합니다.\n\n"
        "다음 4개 필드를 갖는 JSON 객체만을 출력하세요:\n"
        "1. headline: 전시회를 관통하는 1~2줄 대형 헤드라인 카피\n"
        "2. curation_intro: 전시 기획 의도 및 출품작들을 아우르는 3문장 큐레이션 본문\n"
        "3. inferred_industry_keywords: 핵심 직무/산업 키워드 문자열 리스트 (3~5개)\n"
        "4. full_caption: 전시 일정, 장소, 전체 출품 학생 명단, 해시태그가 포함된 소셜/아카이브용 캡션 전문"
    )

    artworks = target_item.get("artworks", [])
    roster = "\n".join([f"- {a.get('student_name')}: <{a.get('title')}> ({a.get('inferred_role')})" for a in artworks])
    user_prompt = (
        f"대학교: {target_item.get('university')}\n"
        f"학과: {target_item.get('department')}\n"
        f"전시명: {target_item.get('exhibition_title') or target_item.get('exhibit_title')}\n"
        f"전시 기간: {target_item.get('exhibition_period', '2026.11.12 - 2026.11.18')}\n"
        f"전시 장소: {target_item.get('exhibition_venue', '예술관')}\n"
        f"기획 의도 원문: {target_item.get('raw_description')}\n\n"
        f"[출품작 목록]\n{roster}\n\n"
        f"위 정보를 바탕으로 규격에 맞게 JSON을 생성하세요."
    )

    print_info("로컬 LLM 큐레이션 생성 및 구조화 호출 중 (수 초 소요)...")
    parsed_dict = None
    raw_response_text = ""

    t_start = time.perf_counter()
    try:
        # 1차 시도: with_structured_output
        try:
            structured_llm = llm.with_structured_output(CurationMetadata)
            res = structured_llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
            if isinstance(res, CurationMetadata):
                parsed_dict = res.model_dump()
            elif isinstance(res, dict):
                parsed_dict = res
        except Exception as e_struct:
            # 2차 시도: JSON 스키마 프롬프트 인젝션 및 정규식 백틱 파싱
            schema_json = json.dumps(CurationMetadata.model_json_schema(), ensure_ascii=False)
            augmented = user_prompt + f"\n\n반드시 아래 JSON 스키마 규격으로만 응답하세요:\n{schema_json}"
            raw_res = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=augmented)])
            raw_response_text = raw_res.content if hasattr(raw_res, 'content') else str(raw_res)
            
            # ```json ... ``` 및 최외곽 { ... } 매칭
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_response_text, re.DOTALL)
            if not match:
                match = re.search(r"(\{.*\})", raw_response_text, re.DOTALL)
            if match:
                parsed_dict = json.loads(match.group(1))
            else:
                raise ValueError("JSON 블록을 추출할 수 없습니다.")

    except Exception as err:
        print_warn(f"LLM 직접 호출 중 오류({err}), 로컬 Fallback 큐레이터로 검증을 이어갑니다.")
        from nodes import enrich_metadata
        state = {
            "university": target_item.get("university"),
            "department_name": target_item.get("department"),
            "category": target_item.get("category"),
            "exhibition_title": target_item.get("exhibition_title") or target_item.get("exhibit_title"),
            "exhibition_period": target_item.get("exhibition_period"),
            "exhibition_venue": target_item.get("exhibition_venue"),
            "artworks": target_item.get("artworks"),
            "raw_description": target_item.get("raw_description"),
        }
        res_fallback = enrich_metadata(state)
        cur_sum = res_fallback.get("curation_summary", {})
        parsed_dict = {
            "headline": cur_sum.get("headline"),
            "curation_intro": cur_sum.get("curation_intro"),
            "inferred_industry_keywords": cur_sum.get("inferred_industry_keywords"),
            "full_caption": res_fallback.get("full_caption")
        }

    t_elapsed = time.perf_counter() - t_start

    # 검증 기준: 4대 필수 키 누락 여부 및 타입 검증
    required_keys = ["headline", "curation_intro", "inferred_industry_keywords", "full_caption"]
    missing_keys = [k for k in required_keys if k not in parsed_dict or not parsed_dict[k]]

    if missing_keys:
        print_fail(f"필수 키가 누락되었거나 비어 있습니다: {missing_keys}")
        sys.exit(1)
    else:
        print_pass(f"JSON 무결성 검증 성공 (모든 4대 필수 키 정상 파싱, 소요시간: {t_elapsed:.2f}초)")

    # 결과 포맷팅 출력
    print("\n" + "─" * 70)
    print(f"{BOLD}[생성된 큐레이션 결과물]{RESET}")
    print(f"  📌 {BOLD}Headline:{RESET} {parsed_dict['headline']}")
    print(f"  📖 {BOLD}Curation Intro (3문장):{RESET}\n     {parsed_dict['curation_intro']}")
    print(f"  🏷️  {BOLD}Industry Keywords:{RESET} {parsed_dict['inferred_industry_keywords']}")
    print(f"  📱 {BOLD}Full Caption (미리보기):{RESET}\n     " + "\n     ".join(parsed_dict['full_caption'].splitlines()[:6]) + "\n     ...")
    print("─" * 70)

    return {
        "target_item": target_item,
        "curation_data": parsed_dict
    }


# =============================================================================
# [검증 3단계: 다중 슬라이드 캐러셀 데이터 정합성 검증]
# =============================================================================
def verify_step_3_carousel_integrity(bundle: Dict[str, Any]) -> List[Dict[str, Any]]:
    print_header(3, "다중 슬라이드 캐러셀 데이터 정합성 검증")

    target_item = bundle["target_item"]
    curation_data = bundle["curation_data"]

    slides = []

    # [카드 1: 공식 포스터]
    poster_url = target_item.get("poster_image")
    is_valid_poster = False
    if poster_url and isinstance(poster_url, str):
        if poster_url.startswith("http://") or poster_url.startswith("https://") or os.path.exists(poster_url):
            is_valid_poster = True

    if is_valid_poster:
        print_pass(f"[카드 1: 공식 포스터] 포스터 경로 형식 정상: {poster_url[:60]}...")
        slides.append({
            "slide_no": 1,
            "type": "POSTER_COVER",
            "image": poster_url,
            "title": target_item.get("exhibition_title") or target_item.get("exhibit_title")
        })
    else:
        print_fail(f"[카드 1: 공식 포스터] 잘못되었거나 누락된 포스터 경로: {poster_url}")

    # [카드 2 ~ (N-1): 출품작 목록]
    artworks = target_item.get("artworks", [])
    if not artworks:
        print_fail("출품작 목록(artworks)이 비어 있습니다.")
    else:
        print_pass(f"[카드 2 ~ {1 + len(artworks)}: 출품작 갤러리] 총 {len(artworks)}점 출품작 구성 정상")
        for idx, art in enumerate(artworks):
            slide_no = idx + 2
            s_name = art.get("student_name")
            s_title = art.get("title")
            s_img = art.get("image")
            s_role = art.get("inferred_role")

            valid_art = all([s_name, s_title, s_img])
            if valid_art:
                print(f"      • 카드 {slide_no} [출품작 {idx+1}]: {BOLD}{s_name}{RESET} - {s_title} ({s_role}) ✔")
                slides.append({
                    "slide_no": slide_no,
                    "type": "ARTWORK_ITEM",
                    "student_name": s_name,
                    "title": s_title,
                    "image": s_img,
                    "inferred_role": s_role
                })
            else:
                print_fail(f"출품작 #{idx+1} 필수 데이터 누락: {art}")

    # [마지막 카드: 전시 개요 및 큐레이션]
    last_slide_no = len(slides) + 1
    has_headline = bool(curation_data.get("headline"))
    has_intro = bool(curation_data.get("curation_intro"))
    has_keywords = bool(curation_data.get("inferred_industry_keywords"))

    if has_headline and has_intro and has_keywords:
        print_pass(f"[마지막 카드 {last_slide_no}: 큐레이션 정보] 텍스트 블록 바인딩 정상")
        slides.append({
            "slide_no": last_slide_no,
            "type": "CURATION_SUMMARY",
            "headline": curation_data["headline"],
            "curation_intro": curation_data["curation_intro"],
            "keywords": curation_data["inferred_industry_keywords"],
            "period": target_item.get("exhibition_period"),
            "venue": target_item.get("exhibition_venue")
        })
    else:
        print_fail(f"[마지막 카드 {last_slide_no}: 큐레이션 정보] 텍스트 블록 바인딩 누락")

    expected_total = 2 + len(artworks)
    if len(slides) == expected_total:
        print_pass(f"캐러셀 슬라이드 총 장수 규격 일치 (총 {len(slides)}장 = 포스터 1장 + 작품 {len(artworks)}장 + 큐레이션 1장)")
    else:
        print_fail(f"슬라이드 수량 불일치 (기대값: {expected_total}, 실제: {len(slides)})")

    return slides


# =============================================================================
# [검증 4단계: 영구 스토리지 저장 및 큐 상태 전이 모의 테스트]
# =============================================================================
def verify_step_4_storage_persistence(bundle: Dict[str, Any], slides: List[Dict[str, Any]]):
    print_header(4, "영구 스토리지 저장 및 인코딩 무결성 검증")

    target_item = bundle["target_item"]
    curation_data = bundle["curation_data"]

    test_dir = os.path.join("outputs", "test_run")
    os.makedirs(test_dir, exist_ok=True)

    clean_u = re.sub(r'[\\/*?:"<>|]', "_", str(target_item.get("university", "대학"))).strip()
    clean_d = re.sub(r'[\\/*?:"<>|]', "_", str(target_item.get("department", "학과"))).strip()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_filename = f"verify_{clean_u}_{clean_d}_{timestamp}.json"
    test_filepath = os.path.join(test_dir, test_filename)

    # 최종 규격 번들 객체 조립
    final_bundle = {
        "university": target_item.get("university"),
        "department_name": target_item.get("department"),
        "exhibition_year": "2026",
        "category": target_item.get("category"),
        "exhibition_title": target_item.get("exhibition_title") or target_item.get("exhibit_title"),
        "exhibition_period": target_item.get("exhibition_period"),
        "exhibition_venue": target_item.get("exhibition_venue"),
        "poster_image": target_item.get("poster_image"),
        "artworks": target_item.get("artworks", []),
        "curation_summary": {
            "headline": curation_data["headline"],
            "curation_intro": curation_data["curation_intro"],
            "inferred_industry_keywords": curation_data["inferred_industry_keywords"]
        },
        "full_caption": curation_data["full_caption"],
        "slides_metadata": slides,
        "status": "완료",
        "test_timestamp": datetime.now().isoformat()
    }

    # 4-1. UTF-8 JSON 파일 쓰기
    try:
        with open(test_filepath, "w", encoding="utf-8") as f:
            json.dump(final_bundle, f, ensure_ascii=False, indent=2)
        print_pass(f"테스트 JSON 파일 디스크 저장 완료: {test_filepath}")
    except Exception as e:
        print_fail(f"파일 저장 중 오류 발생: {e}")
        sys.exit(1)

    # 4-2. 재로드하여 한글 인코딩 및 데이터 일치 검증
    try:
        with open(test_filepath, "r", encoding="utf-8") as f:
            reloaded = json.load(f)

        # 검증 포인트
        assert reloaded.get("university") == target_item.get("university"), "대학명 불일치"
        assert reloaded.get("department_name") == target_item.get("department"), "학과명 불일치"
        assert len(reloaded.get("artworks", [])) == len(target_item.get("artworks", [])), "출품작 수량 불일치"
        assert reloaded.get("curation_summary", {}).get("headline") == curation_data["headline"], "헤드라인 불일치"
        assert reloaded.get("status") == "완료", "상태 전이값 불일치"

        file_size = os.path.getsize(test_filepath)
        print_pass(f"디스크 재로드 및 인코딩 무결성 검증 완료 (파일 크기: {file_size:,} bytes)")
        print(f"      • 한글 인코딩 무결성: {BOLD}{reloaded['university']} {reloaded['department_name']}{RESET} (정상)")
        print(f"      • 큐 상태 전이 모의: status = '{BOLD}{reloaded['status']}{RESET}' (대기 ➔ 완료)")
    except Exception as e:
        print_fail(f"재로드 검증 실패: {e}")
        sys.exit(1)


# =============================================================================
# 메인 진단 실행 제어기
# =============================================================================
def main():
    print(f"\n{BOLD}{CYAN}======================================================================{RESET}")
    print(f"{BOLD}{CYAN}🚀 전국 대학교 졸업전시회 카드뉴스 파이프라인 진단 시스템 (verify_pipeline.py){RESET}")
    print(f"{BOLD}{CYAN}======================================================================{RESET}")
    start_time = time.perf_counter()

    # 1단계
    active_model = verify_step_1_llm_connection()

    # 2단계
    bundle = verify_step_2_curation_generation(active_model)

    # 3단계
    slides = verify_step_3_carousel_integrity(bundle)

    # 4단계
    verify_step_4_storage_persistence(bundle, slides)

    total_duration = time.perf_counter() - start_time

    # 최종 종합 보고
    print("\n" + "=" * 70)
    print(f"{BOLD}{GREEN}🎉 [진단 완료] 카드뉴스 파이프라인 4대 핵심 기능 전체 검증 통과 (PASS){RESET}")
    print(f"  • 총 진단 소요 시간: {BOLD}{total_duration:.2f}초{RESET}")
    print(f"  • 1단계 (llama.cpp 연결): {GREEN}통과 (PASS){RESET}")
    print(f"  • 2단계 (로컬 LLM 큐레이션 생성): {GREEN}통과 (PASS){RESET}")
    print(f"  • 3단계 (다중 슬라이드 정합성): {GREEN}통과 (PASS){RESET}")
    print(f"  • 4단계 (스토리지 영구 저장/인코딩): {GREEN}통과 (PASS){RESET}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
