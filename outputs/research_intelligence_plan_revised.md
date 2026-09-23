# Research Intelligence Agent 업스트림 파이프라인 구축 및 학과 커리큘럼별 교수 카드 자동화 기획서

## 1. 개요 및 배경

기존 시스템은 이미 확보된 URL을 심층 스크래핑하는 다운스트림 엔진(`scripts/run_queue_agent.py`, `scripts/manual_capture.py`)을 완비했습니다.
본 기획은 그 **이전(Upstream) 단계인 Backend Agent Workflow Graph의 Research Intelligence Agent**를 전면 업데이트하여, 대학명·학과명·연도만 입력하면 다음 과정을 **100% 완전 자동화**하는 파이프라인을 구축합니다:

1. **다학제 웹 리서치**: 검색 API(SerpAPI/동급 API)를 경유하여 졸업전시/졸업과제 URL 후보군 발굴 (브라우저 직접 검색 절대 금지)
2. **2단계 텍스트 필터링**: 로컬 Qwen2.5-VL(텍스트 모드)로 HTML 텍스트를 분석하여 진위 여부(`YES`/`NO`/`UNCERTAIN`) 판별
3. **3단계 제한적 Vision 투입**: 비정형 캔버스/텍스트 부족 사이트에 한해 보조적 시각 인식 및 작품 테이블 파싱
4. **4단계 100점 만점 신뢰도 스코어링**: `CONFIRMED`(>=80), `REVIEW`(50~79), `HOLD`(`<50`) 판정
5. **카드 자동 추가 및 연계**:
   - **졸업전시 아카이브 카드**: `data/university_queue.json`에 표준 카테고리(10대 분류)와 함께 신규 카드 자동 등록 ➔ 다운스트림 딥 스크래퍼 연계
   - **교수 카드**: 해당 URL 및 대학 공식 포털의 학과 커리큘럼을 역추적하여, 분야별(UX/UI, AI/SW, 엔지니어링 등) 교원 정보를 발굴하고 `data/professors.json`(19개 표준 필드 규격)에 자동 등록

---

## 2. 사용자 검토 필요 사항 (User Review Required)

> [!IMPORTANT]
> **검색 API 환경**:
> - 사용자의 원칙에 따라 구글/네이버 브라우저 직접 검색을 차단하고 검색 API를 경유합니다.
> - 환경변수에 `SERPAPI_API_KEY` 또는 `TAVILY_API_KEY`가 있는 경우 라이브 API를 호출하며, API 키가 없거나 할당량 초과 시 안정적인 `MockSearchProvider` 및 공개 학술 포털 다이렉트 쿼리로 자동 Fallback하여 파이프라인 중단을 방지합니다.

> [!WARNING]
> **데이터베이스 보호 (`json-db-safeguard`)**:
> - `data/university_queue.json` 및 `data/professors.json` 파일에 신규 카드를 추가할 때, 기존 시드 데이터를 덮어쓰지 않고 고유 복합 키(`UNIV-{year}-{univ}-{dept}`, `prof-{univ}-{name}`) 기반으로 원자적 정밀 추가(Append/Merge)를 수행합니다.

---

## 3. 제안 아키텍처 및 5단계 파이프라인 상세

```
[입력: university_name, department_keyword, target_year]
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1단계: 검색 API 엔진 (SerpAPI / Google Search API)          │
│ - 브라우저 검색 차단, 동의어 5대 쿼리 세트 병렬 실행        │
│ - 중복 제거 및 도메인 태깅 (공식 *.ac.kr / SNS / 뉴스 / 기타) │
└──────────────────────┬──────────────────────────────────────┘
                       │ URL 후보군
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2단계: 1차 텍스트 필터링 (Qwen2.5-VL 텍스트 모드)           │
│ - Playwright HTML 텍스트 추출 (스크린샷 생략)               │
│ - 로컬 LLM (:8080): YES / NO / UNCERTAIN + 한국어 사유      │
│ - NO 즉시 폐기, YES / UNCERTAIN 통과                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3단계: Vision 보조 투입 (제한적 사용)                      │
│ - 텍스트 < 200자, Canvas/비정형, 또는 UNCERTAIN 시에만 활성화│
│ - 스크린샷 캡처 ➔ 'Works' 버튼 좌표 계산 ➔ 학생/작품 파싱  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4단계: 신뢰도 스코어링 (100점 만점)                         │
│ - 공식 출처(30) + 연도 일치(20) + 핵심 정보(30) + 2단계(20) │
│ - >=80: CONFIRMED / 50~79: REVIEW / <50: HOLD               │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[CONFIRMED / REVIEW]            [0건 시: 5단계 NOT_FOUND]
         │                           │
         ├──────────────────────┐    └─> 시도 쿼리/후보수/사유 기록
         ▼                      ▼
[졸업전시 아카이브 카드 추가]   [학과 커리큘럼별 교수 카드 추가]
(data/university_queue.json)   (data/professors.json)
         │                      - 커리큘럼 트랙/분야 분류
         ▼                      - 19개 표준 필드 정밀 추출
[다운스트림 딥 스크래퍼 실행 대기]
```

---

## 4. 세부 컴포넌트별 구현 계획 (Proposed Changes)

### Component 1: Search & Filter Engine (`research/`)

#### [NEW] [`research_intelligence_agent.py`](file:///c:/Users/graduation_exhibit_workflow/research/research_intelligence_agent.py)
- **역할**: 사용자 지정 5단계 리서치 파이프라인의 오케스트레이터
- **세부 모듈**:
  - `SearchAPIClient`: SerpAPI (`https://serpapi.com/search`) 및 Fallback API 연동.
    - 5개 쿼리 세트 실행 (`졸업전시회 {target_year}`, `졸전 {target_year}`, `학위전시 {target_year}`, `site:instagram.com`, `site:x.com`).
    - 도메인 자동 분류: `OFFICIAL_ACADEMIC` (`*.ac.kr`), `SNS` (`instagram.com`, `x.com`), `NEWS`, `OTHER`.
  - `TextVerificationFilter`: Playwright 텍스트 추출 + 로컬 Qwen2.5-VL (`http://127.0.0.1:8080/v1/chat/completions`) 텍스트 전용 호출.
    - 프롬프트: 영어 지시문 + "Respond in Korean for the reasoning field" 강제.
    - 반환: `{"verdict": "YES"|"NO"|"UNCERTAIN", "reasoning": "..."}`.
  - `AuxiliaryVisionProcessor`: 텍스트 부족(<200자) 또는 UNCERTAIN 시에만 스크린샷 캡처 및 Qwen2.5-VL Vision 모드로 학생/작품명 테이블 추출.
  - `ConfidenceScorer`: 100점 만점 스코어링 공식 적용 및 `CONFIRMED`, `REVIEW`, `HOLD` 레이블 부여.
  - `NotFoundHandler`: 후보 0건 시 쿼리 로그, 탈락 원인을 구조화하여 `NOT_FOUND` 리포트 생성.

---

### Component 2: Curriculum & Professor Track Researcher (`research/`)

#### [NEW] [`curriculum_professor_researcher.py`](file:///c:/Users/graduation_exhibit_workflow/research/curriculum_professor_researcher.py)
- **역할**: 확인된 졸업전시 대학/학과 페이지로부터 학과 커리큘럼 및 전공 트랙(분야)별 교원 정보를 심층 리서치
- **세부 기능**:
  - 대학/학과 공식 포털(`*.ac.kr`)의 교수진/커리큘럼 페이지 자동 발굴.
  - 커리큘럼 트랙별(예: 시각/브랜딩, UX/UI, AI/인터랙션, 공학/임베디드 등) 전공 분류.
  - `professor-research` 스킬의 19개 표준 필드 규격(`professor_name`, `university`, `department`, `position`, `research_area`, `official_profile_url`, `assignment_details`, `confidence_score` 등) 준수.
  - 복합 키(`dedup_key = hash(univ + dept + prof_name)`) 기반 중복 방지.

---

### Component 3: Database Integrator (`research/` & `scripts/`)

#### [NEW] [`archive_card_integrator.py`](file:///c:/Users/graduation_exhibit_workflow/research/archive_card_integrator.py)
- **역할**: 검증된 전시 정보와 교수 데이터를 플랫폼 데이터베이스에 무결하게 등록
- **세부 기능**:
  - `register_exhibition_card(confirmed_result)`:
    - 10대 표준 카테고리 매핑(`get_standard_category(dept)` 적용).
    - `data/university_queue.json`에 `UNIV-{year}-{univ}-{dept}-{hash}` 고유 ID로 카드 원자적 등록 (`status: "대기 중"`).
    - 등록 즉시 다운스트림 딥 스크래퍼가 탐색할 수 있는 데이터 구조 보장.
  - `register_professor_cards(professor_list)`:
    - `data/professors.json`에 중복 없는 신규 교수 카드 안전하게 병합(`json-db-safeguard` 원칙).

---

### Component 4: CLI Execution & Batch Runner (`scripts/`)

#### [NEW] [`run_research_intelligence.py`](file:///c:/Users/graduation_exhibit_workflow/scripts/run_research_intelligence.py)
- **역할**: 단일 대학/학과 실행 및 다수 대학 배치(for문) 순차 순회를 지원하는 실행 스크립트
- **출력 포맷**: 사용자가 정의한 최종 규격 준수:
  ```text
  대학명: {university_name}
  학과: {department_keyword}
  연도: {target_year}

  [결과 상태]: CONFIRMED / REVIEW / NOT_FOUND

  [상세 정보] (CONFIRMED/REVIEW인 경우)
  - 출처 URL:
  - 신뢰도 점수: XX/100
  - 전시 일정:
  - 전시 장소:
  - 참여 학생/작품 목록: (마크다운 테이블)
  - 판단 근거 요약:
  - 연계 등록: 아카이브 카드 추가 완료 (ID), 교수 카드 N건 등록 완료

  [NOT_FOUND인 경우]
  - 시도한 검색 쿼리:
  - 확인한 후보 URL 수:
  - 폐기 사유 요약:
  ```

---

## 5. 검증 계획 (Verification Plan)

### Automated Tests
1. **단위 검증 (`scripts/verify_research_agent_units.py`)**:
   - 5대 검색 쿼리 세트 생성 및 도메인 태깅 검증.
   - 로컬 Qwen2.5-VL 텍스트 모드 프롬프트 및 응답 파싱(`YES`/`NO`/`UNCERTAIN`) 테스트.
   - 100점 만점 신뢰도 산출 알고리즘 구간별(`CONFIRMED`, `REVIEW`, `HOLD`) 스코어링 테스트.
2. **E2E 라이브 테스트 (`scripts/test_research_intelligence_live.py`)**:
   - 실존 대학/학과(예: 건국대 시각영상디자인학과, 인천대 컴퓨터공학부) 대상 0단계~5단계 실전 실행.
   - `data/university_queue.json`에 신규 카드 1건이 10대 카테고리와 함께 정상 등록되는지 확인.
   - `data/professors.json`에 해당 학과 커리큘럼 분야별 교원이 중복 없이 정확히 추가되는지 확인.
   - 가상의 미존재 학과 검색 시 `NOT_FOUND` 상태값과 실패 원인이 정확히 격리 리포팅되는지 확인.

### 추가 검증 사례 및 통과 기준

아래 6개 사례를 운영 환경의 필수 검증 항목으로 추가한다. 원문의 Mock Fallback, 후보 등록, DB 병합 및 카드 연계 기능을 구현할 때에도 다음 통과 기준을 충족해야 한다.

#### 1. API 장애 시 Mock 데이터의 운영 DB 유입 방지

- **검증 상황**: 검색 API 키 누락, 인증 실패, 할당량 초과, 타임아웃 또는 서버 오류를 발생시킨다.
- **기대 동작**: Mock 결과를 운영 데이터로 저장하지 않는다. 테스트 목적으로 Mock을 사용하는 경우 운영 DB와 분리된 테스트 저장 경로만 사용한다.
- **통과 기준**:
  - 장애 처리 중 생성된 Mock 전시·교수 레코드가 운영 `data/university_queue.json`, `data/professors.json` 및 플랫폼에서 사용하는 데이터 파일에 추가되거나 병합되지 않는다.
  - Mock 결과가 다운스트림 작업이나 서비스 공개 대상으로 전달되지 않는다.
  - 실행 기록에서 API 장애 원인과 운영 DB 미반영 여부를 확인할 수 있다.

#### 2. REVIEW 후보의 다운스트림 실행 차단

- **검증 상황**: 신뢰도 판정이 `REVIEW`인 전시 후보를 생성하고, 다운스트림 큐 실행 및 재시도를 수행한다.
- **기대 동작**: 후보와 판단 근거는 검토용으로 보존하되, 검토 완료 전에는 딥 스크래퍼를 실행하지 않는다. 후보를 대기 큐에 저장하더라도 `REVIEW` 판정이 유지되어 실행 대상에서 제외되어야 한다.
- **통과 기준**:
  - `REVIEW` 상태에서는 해당 후보에 대한 다운스트림 호출 횟수가 0회이다.
  - 재실행·재시도 시에도 검토 상태가 일반 실행 대기 상태로 자동 변경되지 않는다.
  - 검토를 거쳐 실행 가능한 상태로 명시적으로 전환된 경우에만 다운스트림 처리 대상이 된다.

#### 3. 동일 입력 재실행 시 중복 카드 생성 방지

- **검증 상황**: 동일한 대학명·학과명·대상 연도를 사용하여 최초 실행, 반복 실행 및 중간 실패 후 재실행을 수행한다.
- **기대 동작**: 동일 전시와 동일 교수는 기존 카드를 식별하여 재사용하거나 필요한 정보만 병합한다.
- **통과 기준**:
  - 동일 전시 또는 동일 교수에 대해 카드 ID가 불필요하게 새로 생성되지 않는다.
  - 동일한 조사 결과를 반복 반영해도 해당 전시·교수의 카드 수가 증가하지 않는다.
  - 기존 카드에 연결된 작품 및 교수 관계가 중복 생성되거나 끊어지지 않는다.
  - 새로 확인된 별개의 전시·교수는 중복으로 오인하여 누락하지 않는다.

#### 4. JSON 손상·동시 저장·중간 실패 시 기존 데이터 보존

- **검증 상황**:
  - 기존 JSON 파일을 읽을 때 파싱 오류가 발생한다.
  - 두 작업이 같은 JSON 파일에 동시에 서로 다른 신규 데이터를 저장한다.
  - 저장 또는 루트 데이터와 플랫폼 데이터 동기화 도중 작업이 중단된다.
- **기대 동작**:
  - JSON 읽기 실패를 빈 데이터베이스로 간주하여 덮어쓰지 않는다. 손상 파일과 마지막 정상본이 있다면 이를 보존하고 오류를 기록한다.
  - 동시 저장으로 먼저 저장한 변경이 유실되지 않도록 저장 작업을 조정한다.
  - 저장 도중 중단되어도 마지막 정상 데이터가 보존되거나 복구 가능해야 하며, 일부 경로만 반영된 상태를 전체 성공으로 보고하지 않는다.
- **통과 기준**:
  - 정상 저장 전후에 기존 레코드와 검증된 필드가 의도치 않게 삭제되거나 초기화되지 않는다.
  - 동시 저장한 두 작업의 정상 변경 사항이 모두 최종 데이터에 남는다.
  - 중간 실패 후 재실행하면 기존 데이터 유실과 신규 데이터 중복 없이 복구된다.
  - 손상 원인, 저장 실패 및 복구·동기화 결과를 실행 기록에서 확인할 수 있다.

#### 5. 동일 학과만을 근거로 한 지도교수 연결 방지

- **검증 상황**: 교수와 학생 작품의 대학·학과는 일치하지만, 작품 크레딧·도록·공식 프로젝트 페이지에 지도교수 관계가 명시되지 않은 데이터를 입력한다.
- **기대 동작**: 동일 학과 관계와 실제 지도교수 관계를 구분한다. 학과 일치만으로 지도교수 연결을 생성하지 않는다.
- **통과 기준**:
  - 해당 사례에서 `PROFESSOR_SUPERVISED_PROJECT` 관계가 생성되지 않는다.
  - 학과 연관성을 표시하는 경우 `SAME_DEPARTMENT` 등 보조 관계로만 기록하고, 화면에서도 지도교수로 표현하지 않는다.
  - 지도교수 관계를 생성한 레코드에는 해당 교수와 작품의 연결을 명시한 공식 출처 URL 및 원문 근거가 존재한다.

#### 6. 저장한 교수 카드의 실제 플랫폼 표시 검증

- **검증 상황**: 공식 근거를 검증한 교수 카드 1건을 저장한 뒤, 플랫폼이 실제 사용하는 데이터 로딩 경로와 교수 목록·상세 화면을 확인한다.
- **기대 동작**: 백엔드의 `data/professors.json` 저장 결과가 플랫폼에서 사용하는 `my-exhibit-platform/data/professors.json` 및 데이터 로더에 정확히 반영된다. 현재 데이터 로딩 방식에서 빌드·배포가 필요한 경우 해당 반영 절차까지 확인한다.
- **통과 기준**:
  - 저장된 교수 ID와 플랫폼 데이터 로더가 반환하는 교수 ID가 일치한다.
  - 이름, 대학, 학과, 직위 및 연구 분야가 기존 UI 필드 규격에 맞게 표시된다.
  - 교수 목록과 상세 화면에서 같은 카드와 정보를 확인할 수 있다.
  - 기존 교수 카드는 유지되며, 신규 카드가 중복 표시되지 않는다.
  - 검토 또는 미검증 데이터가 이 표시 검증을 이유로 공개 상태로 자동 전환되지 않는다.

