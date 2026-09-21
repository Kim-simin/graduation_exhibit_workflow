# 교수 자동화 (Professor Intelligence Automation) 파이프라인 구현 문서

본 문서는 **졸업전시 아카이브 & AI-Native 산학·취업 매칭 플랫폼**의 1단계 핵심 과제인 **'교수 자동화(Professor Intelligence Automation)'**의 LangGraph 워크플로우 설계, 12개 노드 구현 내역, 데이터베이스 스키마 확장, 백엔드 API 및 검증 결과를 정리한 공식 기술 문서입니다.

---

## 1. 아키텍처 및 디렉터리 구조

기존의 프론트엔드 UI(GNB, 좌측 사이드바, 졸업전시 갤러리, 교수 리스트/상세 페이지, 기업 RFP, 브랜드 에셋)를 **100% 온전히 보존**하면서, 독립적인 파이썬 기반 LangGraph 워크플로우 모듈(professor_graph/)과 Next.js 연동 API를 신설했습니다.

`
graduation_exhibit_workflow/
├── professor_graph/                         # [NEW] LangGraph 교수 자동화 패키지
│   ├── __init__.py                          # 모듈 패키지화
│   ├── state.py                             # Graph 상태 모델 (ProfessorGraphState, TypedDict 등)
│   ├── providers.py                         # 검색/추출 추상 어댑터 (MockSearchProvider, LiveSearchProvider)
│   ├── nodes.py                             # 12개 워크플로우 노드 핵심 비즈니스 로직
│   ├── graph.py                             # LangGraph StateGraph 조립 및 컴파일
│   └── runner.py                            # CLI / 프로세스 실행 엔트리포인트
├── data/
│   ├── professors.json                      # 메인 교수 DB (자동화 메타데이터 포함)
│   ├── students.json                        # 학생 포트폴리오 원천 데이터 (매칭 연계용)
│   ├── university_queue.json                # 대학 탐색 큐 원천 데이터
│   └── logs/
│       └── professor_runs.json              # [NEW] 파이프라인 실행 감사 로그 DB
├── my-exhibit-platform/
│   ├── data/
│   │   └── professors.json                  # Next.js 프론트엔드 동기화 DB
│   ├── types/
│   │   └── index.ts                         # [EXPANDED] IndustryCollaboration & 검증 메타데이터 확장
│   └── app/
│       └── api/
│           └── professors/
│               └── scan/
│                   └── route.ts             # [NEW] 교수 자동화 트리거 및 상태 조회 API (GET/POST)
├── test_professor_graph.py                  # [NEW] 5대 핵심 검증 단위/통합 테스트 스위트
└── PROFESSOR_AUTOMATION_IMPLEMENTATION.md   # [NEW] 본 아키텍처 및 구현 보고서
`

---

## 2. LangGraph 12개 노드 워크플로우 명세

파이프라인은 신뢰할 수 없는 외부 웹 데이터의 할루시네이션을 원천 차단하고, 수집된 모든 정보의 **출처(.ac.kr 등 공식 도메인), 수집 시각, 신뢰도, 추론 여부**를 명확히 분리하여 멱등성(Idempotency) 있게 갱신하도록 설계되었습니다.

`
[START] -> 1. University Discovery -> 2. Department Discovery -> 3. Professor Discovery
        -> 4. Official Source Validation (실패 시 격리) -> 5. Professor Information Extraction
        -> 6. Semester Core Task Extraction -> 7. Industry Collaboration Extraction
        -> 8. Student Portfolio Matching -> 9. Deduplication -> 10. Change Detection
        -> 11. Database Update -> 12. Run Logging -> [END]
`

### 각 노드별 세부 동작

| 순번 | 노드명 | 입력 상태 | 출력 상태 | 핵심 기능 및 검증 규칙 |
|:---:|:---|:---|:---|:---|
| **1** | university_discovery | 	arget_universities | discovered_universities | 탐색 대상 대학 큐(university_queue.json) 조회 및 타겟 대학 정규화 |
| **2** | department_discovery | discovered_universities | discovered_departments | 각 대학별 디자인/소프트웨어 등 산학 연계 타겟 학과 발굴 |
| **3** | professor_discovery | discovered_departments | professor_candidates | 학과 교원 명부 기반 후보군 이름, 직급, 프로필 페이지 링크 수집 |
| **4** | official_source_validation | professor_candidates | alidated_candidates, unverified_candidates | .ac.kr, .edu 등 대학교 공식 도메인 화이트리스트 검증. 비공식 출처는 격리하여 오염 차단 |
| **5** | professor_information_extraction | alidated_candidates | extracted_professors | 이름, 영문명, 직함, 연구실, 연구분야, 이메일 등 구조화 추출 (confidence_score, source_url 부여) |
| **6** | semester_core_task_extraction | extracted_professors | extracted_professors (과제 갱신) | 학기당 시그니처 커리큘럼 및 캡스톤 과제(예: 생성형 AI 브랜딩, 자율주행 모빌리티 UX) 자동 연계 |
| **7** | industry_collaboration_extraction | extracted_professors | extracted_professors (산학 갱신) | 기업(삼성전자, 현대차, 네이버 등) 연계 산학 과제 실적 및 상태(ONGOING/COMPLETED) 정형화 |
| **8** | student_portfolio_matching | extracted_professors, students.json | extracted_professors (매칭 갱신) | 학생 포트폴리오 DB와 대조하여 학과/연구실 일치 학생의 대표작 자동 바인딩 |
| **9** | deduplication | extracted_professors | deduped_professors | univ_dept_name_norm 기준 정규화 해시 키 생성 후 중복 엔트리 병합 |
| **10** | change_detection | deduped_professors, 기존 DB | change_report | 기존 데이터와 내용 비교. NEW(신규 발굴), UPDATED(변경 갱신), UNCHANGED(유지) 분류 |
| **11** | database_update | deduped_professors, change_report | inal_professors | 루트 data/professors.json 및 웹 my-exhibit-platform/data/professors.json 동시 원자적 동기화 |
| **12** | 
un_logging | 전체 실행 결과 | 
un_id, completed_at | 실행 ID, 타임스탬프, 처리 통계, 격리 목록을 data/logs/professor_runs.json에 영구 기록 |

---

## 3. 데이터베이스 스키마 및 TypeScript 타입 확장

기존 UI(partner_academy_banner, wards, history 등)의 속성을 해치지 않으면서 자동화 및 신뢰성 감사 필드가 추가되었습니다.

### 	ypes/index.ts 확장

`	ypescript
export interface IndustryCollaboration {
  title: string;
  partner_company: string;
  year: number;
  semester?: string;
  description: string;
  status: 'ONGOING' | 'COMPLETED' | 'UPCOMING';
  source_url?: string;
}

export interface Professor {
  // --- 기존 속성 100% 호환 ---
  id: string;
  name: string;
  title: string;
  department: string;
  university: string;
  bio: string;
  interests: string[];
  semester_task?: string;
  student_ids?: string[];
  // ... (기존 UI 필드 유지)

  // --- [NEW] 자동화 및 감사 추적 필드 ---
  industry_collaborations?: IndustryCollaboration[]; // 산학협력 프로젝트
  source_url?: string;                               // 수집 원천 공식 URL (.ac.kr)
  collected_at?: string;                             // 수집 일시 (ISO-8601)
  is_verified?: boolean;                             // 공식 출처 검증 여부
  confidence_score?: number;                         // 추출 신뢰도 점수 (0.0 ~ 1.0)
  evidence_text?: string;                            // 원문 근거 텍스트
  inferred_fields?: string[];                        // AI 추론 필드 목록 (환각 방지 추적)
  last_run_id?: string;                              // 갱신을 수행한 파이프라인 Run ID
  version?: number;                                  // 레코드 버전 번호
}
`

---

## 4. 백엔드 API 라우트 연동

Next.js App Router 기반의 관리자/스케줄러 트리거 엔드포인트를 구축했습니다:

- **엔드포인트**: GET /api/professors/scan, POST /api/professors/scan
- **위치**: my-exhibit-platform/app/api/professors/scan/route.ts
- **주요 기능**:
  - GET: 파이프라인 가동 상태, 현재 DB 내 교수 수, 최신 실행 감사 로그 5건 조회.
  - POST: 백그라운드 파이썬 러너(professor_graph/runner.py)를 실행하여 실시간 스캔 및 DB 갱신 수행.

---

## 5. 테스트 스위트 및 검증 결과

단위/통합 테스트 스위트(	est_professor_graph.py)를 통해 5대 핵심 요구사항을 검증하였습니다.

### 실행 명령어
`powershell
py -3.11 test_professor_graph.py
`

### 테스트 결과 요약 (5/5 PASS)

| 테스트 번호 | 테스트 항목 | 검증 내용 | 결과 |
|:---:|:---|:---|:---:|
| **TEST 1** | **Official Domain Validator** | .ac.kr, .edu 도메인은 정상 통과, .blog.me, unknown.com 등 사설 도메인은 즉시 거부 및 격리 | **PASS** |
| **TEST 2** | **End-to-End 12-Node Workflow** | 12개 노드 전 단계 순차 실행 및 최종 상태 COMPLETED 도달 | **PASS** |
| **TEST 3** | **Mandatory Metadata & Source URL** | 수집된 모든 교수의 source_url 존재, 신뢰도 >= 0.8, 학기 과제 및 산학협력 데이터 완전성 | **PASS** |
| **TEST 4** | **Deduplication & Change Detection** | 동일 타겟 재실행 시 신규 중복 0건 발생 및 100% UNCHANGED 멱등성 유지 | **PASS** |
| **TEST 5** | **Database Sync & Run Logging** | 루트 및 웹 프로젝트 professors.json 듀얼 동기화 및 professor_runs.json 감사 로그 기록 | **PASS** |

---

## 6. 향후 실시간 외부 API 연동 안내

현재 파이프라인은 네트워크 장애나 API 키 종속 없이 안전하게 빌드/배포 및 검증될 수 있도록 MockSearchProvider를 기본 탑재하고 있으며, Tavily Search, SerpAPI, Perplexity, OpenAI/Gemini를 즉시 연결할 수 있는 LiveSearchProvider 어댑터가 완비되어 있습니다.

실제 웹 검색 및 LLM 연동 시:
1. .env 파일에 TAVILY_API_KEY, SERPAPI_API_KEY 및 LLM API 키 설정
2. py -3.11 -m professor_graph.runner --mode live 또는 --mode auto 플래그로 가동
