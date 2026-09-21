from typing import TypedDict, List, Optional, Dict, Any

class GraphState(TypedDict, total=False):
    # 1. 기본 전시 및 학생 정보
    student_name: str
    student_id: str
    exhibit_title: str
    raw_description: str
    category: str
    university: str                              # 개최 대학교명 (예: 홍익대학교)
    exhibition_year: str                         # 개최 년도 (예: 2026)
    department_name: str                         # 입력 학과명 (예: 테크노디자인학과, 미디어커뮤니케이션융합전공)
    poster_image: Optional[str]                  # 원본 졸업전시 홍보 포스터 이미지 경로 또는 URL (카드 1)
    exhibition_title: Optional[str]              # 전시회 공식 타이틀
    exhibition_period: Optional[str]             # 전시 기간 (예: 2026.11.12 - 2026.11.18)
    exhibition_venue: Optional[str]              # 전시 장소 (예: 건국대 예술디자인대학 1층 A&D 홀)

    # 1-1. 개별 출품작 리스트 (카드 2 ~ N)
    # 스키마: [{ student_name, title, image, description, inferred_role }, ...]
    artworks: List[Dict[str, Any]]

    # 1-2. 마지막 카드: 전시 개요 및 큐레이션 정보
    # 스키마: { headline, curation_intro, inferred_industry_keywords }
    curation_summary: Optional[Dict[str, Any]]
    full_caption: Optional[str]                  # 전시 일정/장소, 학생명단, 해시태그가 포함된 전체 피드 캡션

    # 1-3. 웹 스크래핑 및 실시간 리서치 데이터
    scraped_url: Optional[str]                   # 탐색된 실제 공식 아카이브 웹사이트 URL
    scraped_text: Optional[str]                  # 웹사이트에서 수집된 실제 전시 서문 및 작품 텍스트
    download_dir: Optional[str]                  # 실제 포스터 및 출품작이 저장된 로컬 폴더 경로

    # 2. LLM 추론 직무 및 산업군 (Recruiting & Industry Context)
    inferred_job_role: Optional[str]             # 채용 시장 실질 직무 (예: 테크니컬 아티스트, 인터랙티브 UI 개발자)
    inferred_industry: Optional[str]             # 실질 산업군 (예: 실감형 미디어, 공간 컴퓨팅)

    # 3. 소셜 / 웹 아카이브 카드뉴스 규격 메타데이터
    card_headline: Optional[str]                 # 카드뉴스 메인 헤드라인 (강력한 전시/작품 메인 카피)
    card_intro: Optional[str]                    # 카드뉴스 작품 소개 본문 (3~4문장 분량)
    card_caption: Optional[str]                  # 대학, 연도, 학과 맥락과 해시태그가 결합된 설명 캡션

    # 4. 사전 리서치 및 AI 크리틱 검수
    research_data: Optional[Dict[str, Any]]      # 졸업전시회 테마 및 카테고리별 키워드 리서치 결과
    critic_score: Optional[int]                  # AI 품질 검증 점수 (1~100)
    critic_feedback: Optional[str]               # AI 자체 검수 의견
    current_step: str                            # 현재 실행 중인 노드 이름

    # 5. 기존 호환성 필드
    exhibition_catchphrase: str                  # 감성적 헤드카피 (card_headline 동기화)
    refined_summary: str                         # 세련된 요약문 (card_intro 동기화)
    tags: List[str]                              # 해시태그 목록

    # 6. 워크플로우 제어 및 스토리지 저장
    status: str
    errors: List[str]
    is_approved: Optional[bool]                  # 관리자 승인 여부
    feedback: Optional[str]                     # 관리자 반려 사유 및 피드백
    output_path: Optional[str]                  # 최종 저장된 파일 경로
    retry_count: int                             # 현재 재시도 차수 (기본값: 0)
    max_retries: int                             # 최대 허용 재시도 차수 (기본값: 3)
    execution_mode: Optional[str]                # 실행 모드 ("MANUAL_REVIEW" 또는 "AUTO_PILOT")
    auto_pilot: Optional[bool]                   # 완전 자동화 여부 (True 시 관리자 승인 대기 없이 자동 저장)

# 하위 호환성을 위한 별칭
ExhibitState = GraphState
