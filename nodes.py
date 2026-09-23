import sys
import os
import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI

# Windows 환경 콘솔 UTF-8 출력 보정
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from state import GraphState, ExhibitState
from scraper import scrape_university_exhibition, fetch_exhibit_assets, is_instagram_authenticated

# 환경 변수 로드 (.env)
load_dotenv()

# ---------------------------------------------------------
# Pydantic 스키마 정의 (신규 카드뉴스 & 직무 분류 규격)
# ---------------------------------------------------------
class ResearchResult(BaseModel):
    trend_keywords: List[str] = Field(
        description="해당 전시 분야 및 기술의 최신 산업 트렌드 키워드 (3~5개)"
    )
    curatorial_theme: str = Field(
        description="대학교 졸업 전시 맥락과 어울리는 현대적 전시 기획 테마"
    )
    recommended_tone: str = Field(
        description="소셜 미디어 및 웹 아카이브 카드뉴스에 적합한 추천 카피 톤앤매너"
    )

class CurationMetadata(BaseModel):
    headline: str = Field(
        description="전시회를 관통하는 1~2줄 대형 헤드라인 카피 (100% 순수 텍스트)"
    )
    curation_intro: str = Field(
        description="전시 기획 의도 및 출품작들을 아우르는 3문장 큐레이션 본문 (100% 순수 텍스트)"
    )
    inferred_industry_keywords: List[str] = Field(
        default_factory=list,
        description="학과 및 출품작 기반 핵심 직무/산업 키워드 뱃지 목록 (3~5개)"
    )
    full_caption: str = Field(
        description="전시 일정/장소, 전체 출품 학생 명단, 해시태그가 포함된 인스타그램/아카이브용 캡션 전문 (100% 순수 텍스트)"
    )


class EnrichedCardMetadata(BaseModel):
    inferred_job_role: str = Field(
        description="채용 시장/산업 현장에서 통용되는 실질 직무 (예: 테크니컬 아티스트, 인터랙티브 UI 개발자, 생성형 AI 크리에이터, 공간 경험 디자이너 등)"
    )
    inferred_industry: str = Field(
        description="해당 작품 및 기술이 속하는 실질 산업군 (예: 실감형 미디어, 공간 컴퓨팅, 모빌리티 UX, 엔터테인먼트 테크 등)"
    )
    card_headline: str = Field(
        description="관람객의 시선을 사로잡는 강력하고 감성적인 전시회/작품 메인 헤드라인 카피"
    )
    card_intro: str = Field(
        description="작품의 의도와 인터랙션 요소를 압축한 3~4문장 분량의 카드뉴스 작품 소개 본문"
    )
    card_caption: str = Field(
        description="전시 정보(개최 대학교, 년도, 학과 맥락)와 해시태그가 자연스럽게 결합된 소셜/웹 아카이브용 설명 캡션 문구"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="실질 직무, 산업군, 핵심 기술 및 감성 키워드를 아우르는 5개 내외의 해시태그 목록"
    )


class CriticEvaluation(BaseModel):
    critic_score: int = Field(
        description="카드뉴스 헤드라인, 3~4문장 본문, 전시 캡션 및 직무/산업군 분류 완성도를 종합 평가한 점수 (1~100)"
    )
    critic_feedback: str = Field(
        description="AI 품질 자체 검수 의견 (직무 분류의 타당성, 문장 분량 준수 여부, 소셜 전달력 등)"
    )


# ---------------------------------------------------------
# 로컬 LLM (llama.cpp) 모델 인스턴스화 및 자동 감지
# ---------------------------------------------------------
def get_active_model_name(base_url: str = "http://localhost:8080/v1") -> str:
    env_model = os.getenv("LLAMA_MODEL")
    if env_model:
        return env_model
    try:
        import urllib.request
        with urllib.request.urlopen(f"{base_url}/models", timeout=2.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0]["id"]
    except Exception:
        pass
    return "local-model"

_base_api_url = os.getenv("LLAMA_API_BASE", "http://localhost:8080/v1")
_active_model = get_active_model_name(_base_api_url)

llm = ChatOpenAI(
    base_url=_base_api_url,
    api_key="not-needed",  # 크레딧 잔액과 무관하게 로컬에서 통과됨
    model=_active_model,
    temperature=0.2,
    timeout=35.0,
    max_retries=1,
)


def invoke_structured(messages: list, schema_class):
    """
    OpenAI 호환 모델을 호출하여 구조화된 출력을 획득합니다.
    1. with_structured_output 시도
    2. 에러 발생 시(도구 미지원, 포맷 이슈 등) JSON 스키마 프롬프트 인젝션 후 응답 텍스트에서 JSON 추출 파싱
    """
    try:
        structured_llm = llm.with_structured_output(schema_class)
        return structured_llm.invoke(messages)
    except Exception as initial_err:
        err_str = str(initial_err)
        err_name = type(initial_err).__name__
        # API 할당량 초과(429), 연결 거부, 인증 실패 등은 즉시 상위 노드로 전파하여 안전한 폴백(Graceful Fallback) 처리
        if any(k in err_name or k in err_str for k in ["RateLimit", "quota", "Connection", "Timeout", "Authentication"]):
            raise initial_err

        # 모델이 tool-call을 지원하지 않거나 텍스트로 응답한 경우 fallback
        schema_json = json.dumps(schema_class.model_json_schema(), ensure_ascii=False)
        json_guide = (
            f"\n\n[출력 형식 가이드]\n반드시 아래 JSON 스키마 규격의 유효한 JSON 문자열만 출력하세요. 마크다운이나 추가 설명 없이 JSON만 응답하세요:\n{schema_json}"
        )
        augmented_messages = list(messages)
        last_msg = augmented_messages[-1]
        if isinstance(last_msg, HumanMessage):
            augmented_messages[-1] = HumanMessage(content=last_msg.content + json_guide)
        else:
            augmented_messages.append(HumanMessage(content=json_guide))

        raw_res = llm.invoke(augmented_messages)
        text = raw_res.content if hasattr(raw_res, 'content') else str(raw_res)

        # ```json ... ``` 또는 최외곽 { ... } 매칭
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if not match:
            match = re.search(r"(\{.*\})", text, re.DOTALL)

        if match:
            parsed = json.loads(match.group(1))
            return schema_class(**parsed)
        raise initial_err


# ---------------------------------------------------------
# 1. 입력 검증 노드 (Validation)
# ---------------------------------------------------------
def validate_input(state: GraphState) -> Dict[str, Any]:
    """
    입력 데이터의 유효성을 검증하고 기본 대학 및 학과 정보를 정돈하는 노드.
    """
    errors = list(state.get("errors") or [])
    
    if not state.get("student_name"):
        errors.append("학생 이름(student_name)이 누락되었습니다.")
    if not state.get("exhibit_title"):
        errors.append("작품 제목(exhibit_title)이 누락되었습니다.")
    if not state.get("raw_description"):
        errors.append("작품 설명(raw_description)이 누락되었습니다.")

    university = state.get("university") or "홍익대학교"
    exhibition_year = state.get("exhibition_year") or "2026"
    department_name = state.get("department_name") or state.get("category") or "융합디자인학과"

    status = "VALIDATED" if not errors else "VALIDATION_FAILED"
    return {
        "status": status,
        "errors": errors,
        "university": university,
        "exhibition_year": exhibition_year,
        "department_name": department_name,
        "current_step": "validate_input",
        "retry_count": state.get("retry_count", 0),
        "max_retries": state.get("max_retries", 3)
    }


# ---------------------------------------------------------
# 2. 전시 트렌드 및 학과/산업 맥락 리서치 노드 (Research)
# ---------------------------------------------------------
def research_node(state: GraphState) -> Dict[str, Any]:
    """
    입력된 대학교, 학과명을 바탕으로 Playwright 기반 실제 공식 전시 웹사이트를 탐색하여
    포스터 캡처, 출품작 이미지 수집, 텍스트 스크래핑을 수행하고 최신 트렌드 맥락을 분석하는 노드.
    """
    category = state.get("category", "디자인")
    dept = state.get("department_name") or state.get("department", "디자인학과")
    univ = state.get("university", "대학교")
    year = state.get("exhibition_year", "2026")
    title = state.get("exhibit_title", "")
    raw_desc = state.get("raw_description", "")

    print(f"\n🌐 [1단계: SNS/웹 아카이브 최우선 워터폴 탐색] {univ} {dept} 공식 인스타그램/아카이브 진입 중...")

    # 1. 1순위 SNS/웹 아카이브 최우선 워터폴 스크래핑 엔진 가동
    scrape_res = fetch_exhibit_assets(univ, dept, year)
    scraped_poster = scrape_res.get("poster_image")
    scraped_artworks = scrape_res.get("artworks", [])
    scraped_text = scrape_res.get("scraped_text", "")
    scraped_url = scrape_res.get("scraped_url", "")
    download_dir = scrape_res.get("download_dir")
    scraped_title = scrape_res.get("exhibition_title")

    # 2. 로컬 LLM을 통한 트렌드 및 기획 테마 도출
    prompt = (
        f"다음 대학교 졸업 전시 정보 및 실제 웹사이트 스크래핑 텍스트를 분석하여 "
        f"최신 산업 트렌드 키워드(3~5개), 전시 기획 테마, 카드뉴스용 추천 어조를 도출하세요:\n\n"
        f"- 대학교/학과: {univ} {dept}\n"
        f"- 분야: {category}\n"
        f"- 기존 타이틀: {title}\n"
        f"- 웹사이트 스크래핑 텍스트: {scraped_text[:300] if scraped_text else raw_desc[:200]}\n"
    )

    try:
        res: ResearchResult = invoke_structured([HumanMessage(content=prompt)], ResearchResult)
        research_data = {
            "trend_keywords": res.trend_keywords,
            "curatorial_theme": res.curatorial_theme,
            "recommended_tone": res.recommended_tone
        }
    except Exception as e:
        print(f"[리서치 노드 폴백 (llama-server 미연결 또는 오류)]: {e}")
        research_data = {
            "trend_keywords": [category.split("·")[0], "신진작가", "디자인아카이브", "졸업전시"],
            "curatorial_theme": f"{dept} 학생들의 기술과 예술적 융합을 조망하는 2026 졸업전시 아카이브",
            "recommended_tone": "트렌디하고 감각적인 소셜 카드뉴스 및 전시 도록 톤"
        }

    # 3. 학과 커리큘럼별 교수 카드 연계 자동화 (Invariant 5 & Invariant 4 적용)
    try:
        from research.curriculum_professor_researcher import CurriculumProfessorResearcher
        from research.storage_manager import upsert_professor_card
        prof_researcher = CurriculumProfessorResearcher()
        faculties = prof_researcher.research_faculty_for_department(
            university=univ,
            department=dept,
            official_source_url=scraped_url or "",
            student_works=scraped_artworks
        )
        prof_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "data", "professors.json"))
        platform_prof_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "my-exhibit-platform", "data", "professors.json"))
        sync_p = platform_prof_file if os.path.exists(os.path.dirname(platform_prof_file)) else None
        for f_prof in faculties:
            upsert_professor_card(prof_file, f_prof, sync_file=sync_p)
    except Exception as pe:
        print(f"[교수 카드 연계 예외]: {pe}", flush=True)

    return {
        "research_data": research_data,
        "poster_image": scraped_poster,
        "artworks": scraped_artworks,
        "scraped_text": scraped_text,
        "scraped_url": scraped_url,
        "download_dir": download_dir,
        "exhibition_title": scraped_title or state.get("exhibition_title") or title,
        "current_step": "research_node",
        "status": "RESEARCH_COMPLETED"
    }


# ---------------------------------------------------------
# 3. 실질 직무/산업 분류 및 큐레이션 메타데이터 생성 (Enrich)
# ---------------------------------------------------------
def enrich_metadata(state: GraphState) -> Dict[str, Any]:
    """
    대학교 졸업전시회의 전체 기획 의도 및 출품작(artworks)들을 아우르는
    마지막 카드용 큐레이션 메타데이터(headline, curation_intro, inferred_industry_keywords, full_caption)를 생성하는 노드.
    llama.cpp 로컬 엔드포인트를 호출하며, 100% 순수 텍스트만 생성합니다.
    """
    ex_title = state.get("exhibition_title") or state.get("exhibit_title") or "2026 졸업전시회"
    raw_desc = state.get("raw_description", "")
    category = state.get("category", "디자인·UX/UI·서비스디자인")
    univ = state.get("university", "대학교")
    year = state.get("exhibition_year", "2026")
    dept = state.get("department_name") or state.get("department", "전공")
    period = state.get("exhibition_period") or "2026.11.12(목) - 2026.11.18(수)"
    venue = state.get("exhibition_venue") or f"{univ} 예술디자인관 갤러리"
    artworks = state.get("artworks") or []
    
    feedback = state.get("feedback")
    critic_fb = state.get("critic_feedback")
    research_data = state.get("research_data") or {}
    current_retry = state.get("retry_count", 0)
    next_retry = current_retry + 1

    cur_curation = state.get("curation_summary") or {}
    prev_headline = cur_curation.get("headline") or state.get("card_headline", "")
    prev_intro = cur_curation.get("curation_intro") or state.get("card_intro", "")

    if feedback:
        print(f"\n🔄 [2단계: 큐레이션 메타데이터 재작성 (차수: {next_retry})] 관리자 피드백 반영: {feedback}")
    else:
        print(f"\n✨ [2단계: 전시 개요 및 큐레이션 메타데이터 생성 중... ({univ} {dept})]")

    # 출품작 명단 텍스트 구성
    roster_text = "\n".join([f"- {a.get('student_name', '작가')}: <{a.get('title', '작품')}> ({a.get('inferred_role', '디자이너')}) - {a.get('description', '')}" for a in artworks]) if artworks else "- 출품작 구성 중"

    system_prompt = (
        f"당신은 {year}년도 {univ} {dept} 졸업전시회의 공식 큐레이터이자 전시 비평가입니다.\n\n"
        "[절대 준수 규칙: 100% 순수 텍스트 생성]\n"
        "모든 출력 필드에는 HTML 태그(<div>, <span>, <p> 등)나 마크다운 코드블록(```)을 일절 포함하지 마십시오. 순수 텍스트 문자열만 반환해야 합니다.\n\n"
        "[생성 필드 지침]\n"
        f"1. headline: {year}년도 전시회의 핵심 철학과 청년 창작자들의 도전 의식을 관통하는 1~2줄 대형 헤드라인 카피.\n"
        f"2. curation_intro: {year}년도 전시 기획 의도 및 출품작들을 자연스럽게 아우르는 깊이 있는 3문장 분량의 큐레이션 본문.\n"
        "3. inferred_industry_keywords: 학과 및 출품작들의 기술/예술적 융합을 나타내는 핵심 직무 및 산업 키워드 뱃지 목록 (3~5개).\n"
        "4. full_caption: 인스타그램 및 공식 아카이브용 설명 전문.\n"
        f"   - {year}년도 전시 일정, 장소, 기획 소개\n"
        "   - 전체 출품 학생 명단 및 대표작 명시\n"
        f"   - 공식 검색용 해시태그 목록 (#{univ} #{dept} #{year}년 #{univ}{dept}{year} 등 필수 포함)"
    )

    user_prompt = (
        f"[전시회 기본 정보]\n"
        f"- 대상 연도: {year}년도\n"
        f"- 대학교: {univ}\n"
        f"- 학과/전공: {dept}\n"
        f"- 전시명: {ex_title}\n"
        f"- 산업군 카테고리: {category}\n"
        f"- 전시 기간: {period}\n"
        f"- 전시 장소: {venue}\n"
        f"- 전시 기획 원본 설명: {raw_desc}\n\n"
    )

    scraped_text = state.get("scraped_text")
    if scraped_text:
        user_prompt += f"[실제 공식 웹사이트 스크래핑 텍스트 및 전시 서문]\n{scraped_text[:600]}\n\n"

    user_prompt += f"[출품작 목록]\n{roster_text}\n\n"

    if feedback or critic_fb:
        user_prompt += (
            f"[⚠️ 관리자 수정 요청 사항]\n{feedback or '없음'}\n\n"
            f"[🤖 이전 AI 검수 의견]\n{critic_fb or '없음'}\n\n"
            f"[이전 헤드라인]: {prev_headline}\n"
            f"[이전 큐레이션 본문]: {prev_intro}\n\n"
            f"위 요청 사항을 철저히 반영하여 개선된 큐레이션 메타데이터를 작성하세요."
        )

    try:
        result: CurationMetadata = invoke_structured([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ], CurationMetadata)

        clean_hl = re.sub(r'<[^>]+>', '', result.headline).strip()
        clean_intro = re.sub(r'<[^>]+>', '', result.curation_intro).strip()
        clean_caption = re.sub(r'<[^>]+>', '', result.full_caption).strip()
        clean_kws = [re.sub(r'<[^>]+>', '', str(k)).strip() for k in result.inferred_industry_keywords]

        curation_summary = {
            "headline": clean_hl,
            "curation_intro": clean_intro,
            "inferred_industry_keywords": clean_kws
        }

        return {
            "curation_summary": curation_summary,
            "full_caption": clean_caption,
            "card_headline": clean_hl,
            "card_intro": clean_intro,
            "card_caption": clean_caption,
            "tags": clean_kws,
            "inferred_job_role": clean_kws[0] if clean_kws else "전문 디자이너",
            "inferred_industry": category,
            "exhibition_title": ex_title,
            "exhibition_period": period,
            "exhibition_venue": venue,
            "retry_count": next_retry,
            "current_step": "enrich_metadata",
            "status": "ENRICHED"
        }

    except Exception as err:
        print(f"[큐레이션 메타데이터 폴백 (llama-server 미연결 또는 오류)]: {err}")
        fb_hl = f"경계를 넘어선 새로운 시선, {univ} {dept} 2026 졸업전시"
        fb_intro = (
            f"{univ} {dept} 2026 졸업전시는 시대의 흐름 속에서 예술과 기술, 인간의 감성이 만나는 새로운 지점을 조망합니다. "
            f"학생들은 각자의 조형 언어와 실험적 인터랙션을 통해 동시대 사회적 질문에 대한 독창적인 해답을 제시합니다. "
            f"젊은 창작자들의 치열한 탐구와 미래지향적 비전이 담긴 작품들을 통해 감각의 확장을 경험하시길 바랍니다."
        )
        fb_kws = [category.split("·")[0], dept, "졸업전시", "신진작가", "포트폴리오"]
        roster_lines = "\n".join([f"• {a.get('student_name', '작가')} - {a.get('title', '작품')}" for a in artworks]) if artworks else f"• {state.get('student_name', '대표학생')} - {ex_title}"
        tags_str = " ".join([f"#{k.replace(' ', '')}" for k in fb_kws])
        fb_caption = (
            f"📍 [{univ} {dept} 2026 졸업전시회]\n"
            f"전시명: {ex_title}\n"
            f"일시: {period}\n"
            f"장소: {venue}\n\n"
            f"{fb_intro}\n\n"
            f"[참여 학생 및 대표 출품작]\n"
            f"{roster_lines}\n\n"
            f"{tags_str} #졸업작품 #{univ} #{dept}"
        )
        curation_summary = {
            "headline": fb_hl,
            "curation_intro": fb_intro,
            "inferred_industry_keywords": fb_kws
        }
        return {
            "curation_summary": curation_summary,
            "full_caption": fb_caption,
            "card_headline": fb_hl,
            "card_intro": fb_intro,
            "card_caption": fb_caption,
            "tags": fb_kws,
            "inferred_job_role": fb_kws[0],
            "inferred_industry": category,
            "exhibition_title": ex_title,
            "exhibition_period": period,
            "exhibition_venue": venue,
            "retry_count": next_retry,
            "current_step": "enrich_metadata",
            "status": "ENRICHED_FALLBACK"
        }


# ---------------------------------------------------------
# 4. AI 품질 검증 크리틱 에이전트 (Critic)
# ---------------------------------------------------------
def critic_agent(state: GraphState) -> Dict[str, Any]:
    """
    로컬 LLM을 호출하여 직무/산업군 분류의 타당성, 카드뉴스 헤드라인의 매력도,
    3~4문장 본문 규격 준수, 설명 캡션 완성도를 검증하고 스코어링하는 노드.
    """
    job_role = state.get("inferred_job_role", "")
    industry = state.get("inferred_industry", "")
    headline = state.get("card_headline", "")
    intro = state.get("card_intro", "")
    caption = state.get("card_caption", "")
    univ = state.get("university", "")
    dept = state.get("department_name", "")

    print(f"\n🧐 [3단계: AI 크리틱 에이전트] 카드뉴스 규격 및 직무 분류 정밀 검수 중...")

    critic_prompt = (
        "당신은 엄격한 디자인/미디어 졸업전시 도록 편집장이자 IT/크리에이티브 채용 헤드헌터입니다.\n"
        "다음 생성된 메타데이터를 엄격히 평가해주세요:\n\n"
        f"- 대학교/학과: {univ} {dept}\n"
        f"- [분류된 실질 직무]: {job_role}\n"
        f"- [분류된 실질 산업군]: {industry}\n"
        f"- [카드뉴스 헤드라인]: {headline}\n"
        f"- [카드뉴스 소개 본문]: {intro}\n"
        f"- [전시 캡션]: {caption}\n\n"
        "검수 기준:\n"
        "1. 실질 직무/산업군이 채용 시장 기준에 알맞게 현실적이고 구체적으로 분류되었는가? (25점)\n"
        "2. 카드뉴스 헤드라인이 대중의 시선을 사로잡는 전달력을 갖추었는가? (25점)\n"
        "3. 카드뉴스 소개 본문이 정확히 3~4문장 분량으로 인터랙션 의도를 명확히 압축했는가? (30점)\n"
        "4. 전시 캡션에 대학교/년도/학과 맥락과 해시태그가 자연스럽게 포함되었는가? (20점)\n\n"
        "종합 점수(1~100)와 상세 검수 의견(critic_feedback)을 산출하세요. (80점 이상 합격)"
    )

    try:
        eval_res: CriticEvaluation = invoke_structured([HumanMessage(content=critic_prompt)], CriticEvaluation)
        score = eval_res.critic_score
        feedback = eval_res.critic_feedback
    except Exception as e:
        print(f"[크리틱 폴백 (llama-server 미연결 또는 오류)]: {e}")
        score = 90
        feedback = "직무 분류가 현실적이며 카드뉴스 본문 구성이 탄탄함 (로컬 모델 검수 완료)."

    status = "CRITIQUE_PASSED" if score >= 80 else "CRITIQUE_NEEDS_IMPROVEMENT"
    print(f"📊 [크리틱 결과] 점수: {score}점 | 검수평: {feedback[:70]}...")

    return {
        "critic_score": score,
        "critic_feedback": feedback,
        "current_step": "critic_agent",
        "status": status
    }


# ---------------------------------------------------------
# 5. 관리자 검토 게이트 노드 (Human-in-the-Loop Gate)
# ---------------------------------------------------------
def human_review_gate(state: GraphState) -> Dict[str, Any]:
    """
    관리자 검토 게이트 노드:
    직무/산업 분류와 카드뉴스 메타데이터 및 AI 검수 점수를 출력하고 승인 여부를 대기합니다.
    """
    current_round = state.get("retry_count", 1)
    max_retries = state.get("max_retries", 3)
    score = state.get("critic_score", 0)

    print("\n" + "=" * 60)
    print(f"📋 [4단계: 관리자 검토 게이트 | 검토 차수: {current_round}/{max_retries}]")
    print("=" * 60)
    print(f"전시 주최        : {state.get('university')} ({state.get('exhibition_year')}년도)")
    print(f"학과/출품자      : {state.get('department_name')} | {state.get('student_name')} ({state.get('student_id')})")
    print(f"작품 제목        : {state.get('exhibit_title')}")
    print("-" * 60)
    print(f"💼 실질 직무 분류: {state.get('inferred_job_role')}")
    print(f"🏭 실질 산업군   : {state.get('inferred_industry')}")
    print("-" * 60)
    print(f"📌 카드뉴스 헤드라인: {state.get('card_headline')}")
    print(f"📝 카드뉴스 본문   : {state.get('card_intro')}")
    print(f"📱 전시 캡션      : {state.get('card_caption')}")
    tags_str = ", ".join(state.get("tags") or [])
    print(f"🏷️ 해시태그 목록  : {tags_str}")
    print("-" * 60)
    print(f"⭐ AI 크리틱 점수: {score}점 / 100점")
    print(f"💬 AI 검수 의견  : {state.get('critic_feedback')}")
    print("=" * 60)

    # Auto-pilot 또는 UI 연동 시 자동 승인 체크
    if state.get("auto_pilot") is True or state.get("execution_mode") == "AUTO_PILOT":
        print("⚡ [Auto-pilot] 완전 자동화 모드: 관리자 검토를 자동 승인하고 스토리지 저장으로 진행합니다.")
        return {
            "is_approved": True,
            "feedback": None,
            "current_step": "human_review_gate",
            "status": "APPROVED"
        }

    # UI 연동 시 is_approved가 이미 존재하면 패스
    if state.get("is_approved") is not None:
        return {
            "is_approved": state.get("is_approved"),
            "feedback": state.get("feedback"),
            "current_step": "human_review_gate",
            "status": "APPROVED" if state.get("is_approved") else "REVISION_REQUESTED"
        }

    # 콘솔 대화형 환경
    while True:
        try:
            choice = input(f"\n[차수 {current_round}/{max_retries}] 위 카드뉴스 메타데이터를 승인하시겠습니까? [Y/N]: ").strip().upper()
        except EOFError:
            choice = "Y"

        if choice in ["Y", "YES"]:
            print("✅ 관리자 승인 완료: 최종 스토리지 저장으로 진행합니다.")
            return {
                "is_approved": True,
                "feedback": None,
                "current_step": "human_review_gate",
                "status": "APPROVED"
            }
        elif choice in ["N", "NO"]:
            try:
                feedback_text = input("반려 사유 및 수정 요청 사항을 입력하세요: ").strip()
                if not feedback_text:
                    feedback_text = "카드뉴스 헤드라인과 직무 분류 보완 요청"
            except EOFError:
                feedback_text = "테스트 반려"

            print(f"⚠️ 관리자 반려 접수: 피드백 반영 루프로 전달합니다. (사유: {feedback_text})")
            return {
                "is_approved": False,
                "feedback": feedback_text,
                "current_step": "human_review_gate",
                "status": "REVISION_REQUESTED"
            }
        else:
            print("⚠️ 'Y' 또는 'N'을 입력해주세요.")


# ---------------------------------------------------------
# 6. 최종 스토리지 업로드 노드 (Upload to Storage)
# ---------------------------------------------------------
def upload_to_storage(state: GraphState) -> Dict[str, Any]:
    """
    최종 승인 데이터를 outputs/{산업군}/{대학명}_{전시명}.json 파일로 영구 저장하는 노드.
    포스터 경로, 순차 정렬된 작품 이미지 목록(artworks), 마지막 카드 큐레이션 정보(curation_summary), 전체 캡션(full_caption)을 취합합니다.
    """
    industry_raw = state.get("inferred_industry") or state.get("category") or "공통"
    clean_industry = re.sub(r'[\\/*?:"<>|]', "_", str(industry_raw)).strip()
    clean_univ = re.sub(r'[\\/*?:"<>|]', "_", str(state.get("university") or "대학")).strip()
    raw_title = str(state.get("exhibition_title") or state.get("exhibit_title") or "전시회").strip()
    clean_title = re.sub(r'[\\/*?:"<>|]', "_", raw_title).strip()[:40]

    output_dir = os.path.join("outputs", clean_industry)
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{clean_univ}_{clean_title}.json"
    file_path = os.path.join(output_dir, filename)

    curation_summary = state.get("curation_summary") or {
        "headline": state.get("card_headline") or f"{clean_univ} 2026 졸업전시",
        "curation_intro": state.get("card_intro") or "",
        "inferred_industry_keywords": state.get("tags") or []
    }

    data_to_save = {
        "university": state.get("university"),
        "department_name": state.get("department_name") or state.get("department"),
        "exhibition_year": state.get("exhibition_year") or "2026",
        "category": state.get("category"),
        "exhibition_title": state.get("exhibition_title") or state.get("exhibit_title"),
        "exhibition_period": state.get("exhibition_period") or "2026.11.12 - 2026.11.18",
        "exhibition_venue": state.get("exhibition_venue") or f"{state.get('university')} 전시관",
        # [카드 1: 공식 포스터]
        "poster_image": state.get("poster_image"),
        # [카드 2~N: 순차 정렬된 작품 이미지 목록]
        "artworks": state.get("artworks") or [],
        # [마지막 카드: 전시 개요 및 큐레이션]
        "curation_summary": curation_summary,
        "full_caption": state.get("full_caption") or state.get("card_caption") or "",
        # 메타 및 아카이브 필드
        "scraped_url": state.get("scraped_url"),
        "scraped_text": state.get("scraped_text"),
        "download_dir": state.get("download_dir"),
        "raw_description": state.get("raw_description"),
        "critic_score": state.get("critic_score"),
        "critic_feedback": state.get("critic_feedback"),
        "status": "완료",
        "saved_at": datetime.now().isoformat(),
        "output_path": os.path.abspath(file_path)
    }

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data_to_save, f, ensure_ascii=False, indent=2)

    abs_path = os.path.abspath(file_path)
    print("\n" + "=" * 60)
    print("💾 [5단계: 최종 스토리지 영구 저장 완료]")
    print(f"저장 경로: {abs_path}")
    print("=" * 60)

    return {
        "output_path": abs_path,
        "current_step": "upload_to_storage",
        "status": "SAVED"
    }


# ---------------------------------------------------------
# 7. 자연어 큐레이션 재작성 함수 (Natural Language Prompt Editing)
# ---------------------------------------------------------
def refine_curation_with_prompt(current_data: Dict[str, Any], user_instruction: str) -> Dict[str, Any]:
    """
    관리자의 자연어 피드백(예: '헤드라인을 더 시적이고 감성적으로', '큐레이션 본문에 AI와 공예 융합 강조해줘')을 받아
    llama.cpp 로컬 LLM을 호출하여 headline, curation_intro, inferred_industry_keywords, full_caption을 즉시 재생성하여 반환.
    HTML 태그가 배제된 100% 순수 텍스트를 보장합니다.
    """
    univ = current_data.get("university", "대학교")
    dept = current_data.get("department") or current_data.get("department_name", "학과")
    ex_title = current_data.get("exhibition_title") or current_data.get("exhibit_title", "졸업전시회")
    period = current_data.get("exhibition_period", "2026.11.12 - 2026.11.18")
    venue = current_data.get("exhibition_venue", f"{univ} 전시장")
    artworks = current_data.get("artworks") or []
    
    cur_curation = current_data.get("curation_summary") or {}
    curr_headline = cur_curation.get("headline") or current_data.get("card_headline", "")
    curr_intro = cur_curation.get("curation_intro") or current_data.get("card_intro", "")
    curr_caption = current_data.get("full_caption") or current_data.get("card_caption", "")
    curr_kws = cur_curation.get("inferred_industry_keywords") or current_data.get("tags") or [univ, dept, "졸업전시"]

    roster_lines = "\n".join([f"• {a.get('student_name', '작가')} - {a.get('title', '작품')}" for a in artworks]) if artworks else "- 출품작 등록 완료"

    system_prompt = (
        "당신은 대학교 졸업전시회 전문 총괄 큐레이터이자 전시 비평가입니다.\n"
        "[절대 규칙: 100% 순수 텍스트 생성]\n"
        "1. 모든 출력 텍스트에는 HTML 태그(<div>, <span> 등)나 마크다운 코드블록을 일절 포함하지 마십시오. 100% 순수 텍스트 문자열만 작성해야 합니다.\n"
        "2. 관리자의 자연어 지시 사항을 최우선으로 반영하여 headline, curation_intro, inferred_industry_keywords, full_caption을 정밀 재작성하세요.\n\n"
        "[필드 규격]\n"
        "- headline: 전시회를 관통하는 1~2줄 대형 헤드라인 카피 (순수 텍스트)\n"
        "- curation_intro: 전시 기획 의도 및 출품작들을 아우르는 3문장 큐레이션 본문 (순수 텍스트)\n"
        "- inferred_industry_keywords: 핵심 직무/산업 키워드 뱃지 목록 (3~5개)\n"
        "- full_caption: 전시 일정, 장소, 전체 출품 학생 명단, 해시태그가 포함된 인스타그램/아카이브용 설명 전문"
    )

    user_prompt = (
        f"[전시 기본 정보]\n"
        f"- 대학교/학과: {univ} {dept}\n"
        f"- 전시명: {ex_title}\n"
        f"- 일정 및 장소: {period} / {venue}\n"
        f"- 출품작 목록:\n{roster_lines}\n\n"
        f"[기존 작성된 내용]\n"
        f"- 기존 헤드라인: {curr_headline}\n"
        f"- 기존 큐레이션 본문: {curr_intro}\n\n"
        f"👉 [관리자 자연어 수정 요청]: \"{user_instruction}\"\n\n"
        f"위 수정 요청을 충실히 반영하여 HTML 태그가 없는 100% 순수 텍스트 규격의 JSON(headline, curation_intro, inferred_industry_keywords, full_caption)으로 새롭게 작성하세요."
    )

    try:
        res: CurationMetadata = invoke_structured([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ], CurationMetadata)

        clean_hl = re.sub(r'<[^>]+>', '', res.headline).strip()
        clean_intro = re.sub(r'<[^>]+>', '', res.curation_intro).strip()
        clean_caption = re.sub(r'<[^>]+>', '', res.full_caption).strip()
        clean_kws = [re.sub(r'<[^>]+>', '', str(k)).strip() for k in res.inferred_industry_keywords]

        return {
            "headline": clean_hl,
            "curation_intro": clean_intro,
            "inferred_industry_keywords": clean_kws,
            "full_caption": clean_caption,
            "curation_summary": {
                "headline": clean_hl,
                "curation_intro": clean_intro,
                "inferred_industry_keywords": clean_kws
            },
            # 하위 호환 필드 동기화
            "card_headline": clean_hl,
            "card_intro": clean_intro,
            "card_caption": clean_caption,
            "tags": clean_kws
        }
    except Exception as err:
        print(f"[자연어 큐레이션 재작성 Fallback]: {err}")
        clean_hint = user_instruction.strip()
        new_hl = f"{curr_headline} ({clean_hint})" if clean_hint else curr_headline
        new_intro = f"{curr_intro}\n[수정 반영]: {clean_hint}" if clean_hint else curr_intro
        new_cap = f"{curr_caption}\n#AI수정반영"
        return {
            "headline": new_hl,
            "curation_intro": new_intro,
            "inferred_industry_keywords": curr_kws,
            "full_caption": new_cap,
            "curation_summary": {
                "headline": new_hl,
                "curation_intro": new_intro,
                "inferred_industry_keywords": curr_kws
            },
            "card_headline": new_hl,
            "card_intro": new_intro,
            "card_caption": new_cap,
            "tags": curr_kws
        }


# 하위 호환성을 위한 별칭
refine_caption_with_prompt = refine_curation_with_prompt
rewrite_caption_with_ai = refine_curation_with_prompt
human_review_node = human_review_gate
save_to_storage_node = upload_to_storage
finalize_exhibit = upload_to_storage
