# -*- coding: utf-8 -*-
import os

skill_content = """---
name: professor-research
description: "Operational research rules and validation standards for discovering, extracting, verifying, and normalizing university, department, and professor intelligence in LangGraph agent workflows."
---

# Professor Research Skill (`professor-research`)

## 1. Purpose
`professor-research` Skill은 **졸업전시 아카이브 & AI-Native 산학·취업 매칭 플랫폼**의 LangGraph 기반 **Professor Intelligence Graph**가 전국 대학, 학과, 교원, 산학협력 프로젝트, 학생 포트폴리오를 탐색하고 수집할 때 적용하는 **프로젝트 전용 핵심 연구 및 데이터 품질 통제 표준(Operational Research Runbook)**이다.

본 문서는 단순한 검색 팁이 아니며, 데이터 수집부터 검증, 신뢰도 산출, 중복 제거, 변경 감지, 사람의 검토(Human-in-the-loop)에 이르는 전 파이프라인의 데이터 정합성과 무결성을 통제한다.

---

## 2. Scope & Execution Philosophy
1. **Fact-First Verification**: 출처(URL)와 원문 증거(Raw Evidence)가 없는 데이터는 절대 생성하거나 DB에 기록하지 않는다.
2. **Strict Separation of Evidence and Inference**:
   - **Raw Evidence (원문 증거)**: 웹페이지/문서에서 직접 추출한 텍스트
   - **Normalized Fact (정규화된 사실)**: 정해진 스키마로 표준화된 데이터
   - **AI Interpretation (AI 해석/요약)**: 에이전트가 도출한 한 줄 설명 또는 태그
   이 셋을 절대로 융합하거나 AI의 해석을 원본 사실처럼 취급하지 않는다.
3. **No Code / Schema Modification**: 본 스킬은 연구 및 추출 표준을 정의하며 기존 프론트엔드 UI, DB 스키마, 백엔드 API를 임의로 수정하지 않는다.

---

## 3. Source Priority (출처 계층 우선순위)

모든 조사 작업은 다음 4단계 출처 우선순위에 따라 수행된다.

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Primary Official Sources (최우선)                    │
│ 대학/학과 공식 포털, 교수 공식 프로필, 연구실, 산학협력단   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Tier 2: Institutional Sources (공식 기관 보조)               │
│ 대학알리미, KCI/RISS, NRF(연구재단), 정부/공공기관 공시     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Tier 3: Secondary Sources (보조 참조)                        │
│ 제도권 정론지 보도자료, 학술 데이터베이스 (Google Scholar 등)│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ Tier 4: Low Trust Sources (최하위 / 사실 확정 금지)          │
│ 개인 블로그, 커뮤니티, SNS, 검색엔진 요약 Snippet            │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1 — Primary Official Sources (최우선 공인 출처)
* 대학 공식 홈페이지 (`*.ac.kr`, `*.edu`)
* 단과대학 및 학과 공식 소개/교수진 명부 페이지
* 대학 공식 교원 업적/연구자 정보 시스템
* 연구실(Lab) 공식 웹사이트
* 대학 공식 산학협력단 포털 및 공지사항
* 대학 공식 캡스톤디자인 / 졸업작품전시 공식 웹페이지

### Tier 2 — Institutional Sources (기관 공인 보조 출처)
* 정부 교육부/과기정통부 산하 공식 공공 데이터베이스
* 대학알리미(Academyinfo), 한국연구재단(NRF), KCI, RISS
* 정부/지자체 공식 산학 R&D 사업 공고 및 선정 결과 보고서

### Tier 3 — Secondary Sources (보조적 참조 출처)
* 신뢰할 수 있는 제도권 언론의 공식 기사 (산학협력 체결 보도자료)
* 공인 학술 데이터베이스 및 콘퍼런스 프로시딩
* *규칙*: 보조 사실 확인용으로만 활용하며, 단독으로 교수 프로필을 확정하지 않는다.

### Tier 4 — Low Trust Sources (최하위 출처 — 사실 확정 절대 금지)
* 개인 블로그(네이버 블로그, 티스토리 등), 온라인 커뮤니티(에브리타임 등)
* 출처 불명의 SNS 포스팅
* **검색 결과 요약(Search Snippet)**: 스니펫 텍스트만으로 사실을 확정하거나 DB에 저장하는 행위를 엄격히 금지한다. 반드시 원본 URL로 진입하여 본문을 확인해야 한다.

---

## 4. Source Validation & Domain Whitelisting

후보군(Candidate) 발굴 후 정보 추출 단계로 넘어가기 전에 반드시 출처 검증을 거친다.

1. **도메인 화이트리스트 검증**:
   - 국내 대학: `*.ac.kr` 도메인 필수 확인
   - 해외 대학: `*.edu` 또는 국가별 공인 고등교육 도메인
   - 연구실/개인 도메인의 경우: 학과 공식 페이지 내 링크(`href`)로 연결된 공식 URL 여부 확인
2. **비인가/의심 도메인 격리**:
   - 공인 도메인이 아니거나 위변조 가능성이 있는 비공식 사이트는 `unverified_candidates`로 격리
   - 격리된 데이터는 절대 메인 `professors.json`에 반영하지 않는다.

---

## 5. Professor Data Schema (19개 필수 필드 규격)

Professor Research 파이프라인은 최소 다음 19개 표준 필드를 구조화하여 추출해야 한다.

| # | 필드명 (Field Name) | 타입 | 필수 여부 | 설명 및 예시 |
|:---:|:---|:---:|:---:|:---|
| 1 | `professor_name` | string | **필수** | 교수 성명 (예: "홍길동") |
| 2 | `university` | string | **필수** | 소속 대학교 공식 명칭 (예: "홍익대학교") |
| 3 | `department` | string | **필수** | 소속 학과/학부 공식 명칭 (예: "디자인컨버전스학부") |
| 4 | `position` | string | **필수** | 직급/직위 (예: "교수", "부교수", "조교수", "겸임교수") |
| 5 | `major` | string | **필수** | 세부 전공 분야 (예: "시각디자인 / 인터랙션디자인") |
| 6 | `research_area` | list[str]| **필수** | 핵심 연구 키워드 목록 (예: `["생성형 AI 브랜딩", "UX 리서치"]`) |
| 7 | `lab_name` | string | 선택 | 소속 연구실 명칭 (예: "지능형 인터랙션 디자인 연구실") |
| 8 | `official_profile_url`| string | **필수** | 대학/학과 공식 교수 소개 페이지 URL |
| 9 | `lab_url` | string | 선택 | 연구실 공식 웹사이트 URL |
| 10 | `projects` | list[dict]| 선택 | 수행 연구 및 산학 과제 목록 |
| 11 | `courses` | list[dict]| 선택 | 담당 교과목 목록 |
| 12 | `current_semester` | string | **필수** | 현재 기준 학기 (예: "2026-2", 미확인 시 "UNKNOWN") |
| 13 | `industry_collaboration`| list[dict]| 선택 | 산학협력 기업 및 과제 상세 목록 |
| 14 | `source_url` | string | **필수** | 최종 사실이 추출된 원천 웹페이지 URL |
| 15 | `source_type` | string | **필수** | 출처 유형 ("OFFICIAL_UNIVERSITY", "DEPARTMENT_PAGE", "LAB_SITE") |
| 16 | `source_title` | string | **필수** | 원천 페이지 HTML 타이틀 태그 텍스트 |
| 17 | `collected_at` | string | **필수** | ISO 8601 타임스탬프 (예: "2026-09-16T16:00:00Z") |
| 18 | `confidence_score` | float | **필수** | 데이터 신뢰도 점수 (0.00 ~ 1.00) |
| 19 | `verification_status` | string | **필수** | 검증 상태 ("VERIFIED", "REVIEW_NEEDED", "UNVERIFIED", "REJECTED") |

> **프로젝트 기존 모델 연계**:
> 위 필드들은 `professor_graph/state.py`의 `ExtractedProfessor` 및 프론트엔드 `types/index.ts`의 `Professor` 인터페이스와 100% 상호 매핑된다.

---

## 6. Semester Research Rules (학기 연구 엄격 구분 원칙)

학기 정보는 시간적 정합성이 가장 중요한 데이터다. 과거 정보를 현재 진행형으로 오인하지 않도록 다음 4대 학기 구분을 엄격히 적용한다.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Current Semester   : 현재 학사일정에 실제로 진행 중인 학기    │
│ 2. Previous Semester  : 직전 학기 완료 교과/과제              │
│ 3. Historical Semester: 1년 이상 경과된 과거 아카이브 이력      │
│ 4. Unknown Semester   : 연도/학기가 페이지에 명시되지 않은 상태  │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 규칙:
1. **과거 학기 추정 절대 금지**:
   - 페이지에 `2024-2 캡스톤디자인`으로 기재되어 있을 경우, 이를 현재 시점인 `2026-2 캡스톤디자인`으로 추정하거나 승격(Promotion)시켜서는 안 된다.
2. **연도/학기 명시 검증**:
   - 연도(Year)와 학기(Semester: 1학기/2학기/여름/겨울)가 본문에 명시되지 않은 경우 반드시 `Unknown Semester` (`UNKNOWN`)로 태깅한다.
3. **불확실성 발생 시 조치**:
   - 학기 정보가 모호한 과제는 `verification_status: "REVIEW_NEEDED"`로 보류하고 관리자 검토를 요청한다.

---

## 7. Semester Core Task (학기 핵심 과제 추출 규칙)

교수의 담당 수업에서 학생들과 함께 수행하는 핵심 실무 과제를 추출할 때 적용한다.

### 추출 스키마:
```text
course_name            : 교과목 공식 명칭 (예: "산학캡스톤디자인 II")
semester               : 개설 학기 ("2026-2")
academic_year          : 개설 연도 (2026)
grade                  : 대상 학년 (3, 4, 대학원)
course_type            : 교과 구분 ("전공필수", "산학연계", "캡스톤디자인")
assignment_name        : 과제 명칭 (예: "생성형 AI 기반 차세대 모빌리티 인터페이스")
project_name           : 프로젝트 명칭
project_description    : 과제 목표 및 상세 요구사항
deliverable_type       : 최종 산출물 형태 ("UI/UX 프로토타입", "디자인 가이드북")
participating_students : 참여 학생 수 또는 학생 명단
professor_role         : 담당 교수 역할 ("지도교수", "총괄멘토")
official_source        : 과제 공지/강의계획서 공식 출처 URL
```

### 엄격한 구분 원칙:
* **교과목(Course)과 학생 프로젝트(Project) 혼동 금지**:
  - 교과목 강의계획서에 적힌 수업 주제와, 실제 학생들이 제작한 졸업/캡스톤 결과물 프로젝트를 동일시하지 않는다.
* **지도교수 확정 기준**:
  - 교수가 특정 수업의 담당 교수라는 사실만으로, 해당 학과의 모든 학생 프로젝트의 '개별 지도교수'로 자동 확정하지 않는다. 공식 프로젝트 크레딧에 지도교수로 이름이 명시된 경우에만 바인딩한다.

---

## 8. Industry Collaboration (산학협력 탐색 규칙)

교수 및 연구실의 실질적인 기업 산학 협력 내역을 발굴할 때 적용한다.

### 탐색 대상 유형:
1. 기업 연계 캡스톤 프로젝트 (Corporate Capstone Projects)
2. 기업 산학협력 연구과제 (Industry-sponsored R&D Projects)
3. 기업 공동 연구실 및 산학 컨소시엄 (Joint Corporate Labs)
4. 정부·기업 공동지원 연구개발 (Gov-Enterprise Supported Projects)
5. 학생 참여 기업 현장실습 및 인턴십 연계 과제

### 증빙 및 검증 원칙:
* **기업명과 교수의 공식 관계 입증 필수**:
  - 대학 포털 공지, 산학협력단 연구과제 체결 공시, 기업의 공식 보도자료 중 1개 이상의 공인 출처에서 [기업명 + 교수명 + 과제명]의 3자 관계가 증명되어야 한다.
* **추정성 협력 배제**:
  - 교수의 과거 경력(예: "전 00전자 수석연구원")을 현재 진행형 "산학협력 기업"으로 둔갑시키지 않는다.

---

## 9. Student Portfolio Matching (학생 포트폴리오 연결 규칙)

교수 및 학과 데이터와 졸업전시 학생 포트폴리오를 매칭할 때는 **명시적이고 객관적인 증거**가 있을 때만 연결을 생성한다.

### 허용되는 관계 유형 (Allowed Relation Types):
1. `PROFESSOR_SUPERVISED_PROJECT` (최고 신뢰도):
   - 학생 작품 크레딧/도록에 해당 교수가 지도교수로 공식 명기된 경우
2. `SAME_LAB`:
   - 학생이 해당 교수의 연구실 소속 연구원/학부 연구생으로 확인된 경우
3. `SAME_PROJECT`:
   - 동일한 산학협력 과제 번호 또는 프로젝트 명칭에 참여 인원으로 기재된 경우
4. `INDUSTRY_PROJECT`:
   - 기업 RFP/산학 과제 공모를 통해 교수의 지도 하에 수행된 프로젝트
5. `SAME_DEPARTMENT` (보조 분류):
   - 동일 대학, 동일 학과 소속임이 확인된 경우 (지도교수로 확정하지 않고 학과 연관 작품으로만 연결)
6. `SAME_UNIVERSITY` (일반 분류):
   - 동일 대학 소속 학생 작품

### 금지 추정 패턴 (False Positive Block):
* ❌ "교수 A가 디자인학부 교수이고, 학생 B가 디자인학부 학생이므로 교수 A가 학생 B의 프로젝트 지도교수이다" (절대 금지)
* ❌ 단순 관심 분야(Research Area)가 일치한다는 이유로 특정 작품을 지도 프로젝트로 매칭하는 행위 금지

---

## 10. Confidence Score (신뢰도 산출 기준)

모든 추출 데이터는 0.00 ~ 1.00 범위의 신뢰도 점수를 계산하여 할당해야 한다.

| 점수 구간 | 출처 및 검증 요건 | 처리 방침 |
|:---:|:---|:---|
| **0.90 ~ 1.00** | **공식 대학/학과/교수 페이지에서 직접 추출 및 교차 검증 완료** | 즉시 승인 (`VERIFIED`) |
| **0.75 ~ 0.89** | **정부/공공기관(NRF, 대학알리미 등) 공인 2차 출처에서 확인** | 승인 (`VERIFIED` 또는 경미한 보류) |
| **0.50 ~ 0.74** | **신뢰할 수 있는 언론 보도자료 또는 학술 DB 단독 출처** | 검토 권장 (`REVIEW_NEEDED`) |
| **0.49 이하** | **출처 불명, 단순 검색 스니펫, 정보 간 상호 모순 발생** | 자동 반영 차단 (`REVIEW_NEEDED` 격리) |

> **중요 주의사항**:
> 검색엔진에 동일한 검색 스니펫이 여러 개 중복 노출된다고 해서 confidence 점수를 인위적으로 높이지 마라. 신뢰도는 '반복 노출 횟수'가 아니라 **'출처의 공인 등급과 1차 원문 직접 확인 여부'**에 의해서만 결정된다.

---

## 11. Verification Status (검증 상태 분류)

파이프라인의 모든 엔티티는 다음 4가지 상태 중 하나를 갖는다.

1. **`VERIFIED`**:
   - Tier 1 공인 출처에서 직접 확인되었으며 `confidence_score >= 0.90`인 상태. DB 저장 및 서비스 노출 즉시 승인.
2. **`REVIEW_NEEDED`**:
   - 출처 간 정보 상충, 학기 불명확, 동일 인물 여부 모호, 지도관계 증빙 부족 시 격리하여 관리자 검토 대기.
3. **`UNVERIFIED`**:
   - 검색 스니펫이나 3차 출처에서 후보군으로만 수집되고 공식 본문 검증이 아직 이루어지지 않은 초기 후보 상태.
4. **`REJECTED`**:
   - 폐쇄된 학과, 퇴임/이직 교원, 비공식 홍보물, 사실 왜곡 데이터로 판명되어 파이프라인에서 폐기된 상태.

---

## 12. Deduplication (중복 제거 및 정규화 전략)

장시간 또는 배치로 데이터를 탐색할 때 동일 교수나 프로젝트가 중복 생성되지 않도록 엄격한 정규화 규칙을 적용한다.

### 1) 교수 식별자(Composite Identity Key):
```text
dedup_key = hash(normalize(university) + "_" + normalize(department) + "_" + normalize(professor_name))
```
- 대학명 정규화: 캠퍼스 분리 표준화 (예: "홍익대학교(서울캠퍼스)" → "홍익대학교")
- 학과명 정규화: 띄어쓰기 및 특수문자 제거 (예: "디자인 컨버전스 학부" → "디자인컨버전스학부")
- 교수명 정규화: 공백 제거 및 영문 병기 분리 (예: "홍길동 (Gildong Hong)" → "홍길동")

### 2) URL 정규화(URL Normalization):
- 프로토콜 통일: `http://` → `https://`
- Trailing slash 제거: `https://univ.ac.kr/prof/` → `https://univ.ac.kr/prof`
- 불필요한 트래킹 파라미터 제거: `utm_*`, `ref`, `session_id` 등 제거

---

## 13. Change Detection (변경 감지 및 무결성 비교 규칙)

정기 배치 탐색 시 기존 DB의 교수 데이터와 신규 수집 결과를 비교하여 유의미한 변경점만을 감지한다.

### 변경 상태 (Change Status):
* **`NO_CHANGE`**: 기존 데이터와 주요 속성이 완전히 일치하는 경우.
* **`NEW`**: DB에 존재하지 않던 신규 대학/학과/교수가 최초 발굴된 경우.
* **`UPDATED`**: 기존 교수의 실질적인 속성이 변경된 경우.
* **`REMOVED`**: 공식 학과 명부에서 삭제되었거나 이직/퇴임이 확인된 경우.
* **`UNVERIFIED`**: 변경 여부가 불명확하여 검토가 필요한 경우.

### ⚠️ 핵심 금지 원칙:
* **`collected_at` 변경만으로 `UPDATED` 처리 절대 금지**:
  - 탐색 일시(`collected_at`)나 크롤링 타임스탬프가 새로 갱신되었다는 이유만으로 `UPDATED` 이벤트를 생성해서는 안 된다.
* **실제 감지 대상 유의미 속성 (Semantic Attributes)**:
  1. 직급 변경 (예: 조교수 → 부교수)
  2. 연구실 URL 또는 공식 프로필 URL 변경
  3. 세부 전공 또는 연구 분야(research_areas) 목록 변동
  4. 신규 개설 학기 담당 과목(courses) 추가
  5. 신규 수주 산학협력 프로젝트(industry_collaboration) 추가

---

## 14. Source Provenance (출처 추적성 3단계 구조)

모든 결과 데이터는 감사 및 추적이 가능하도록 3단계 계층 구조를 유지해야 한다.

```text
[1. Raw Evidence]       : 원본 웹페이지에서 스크랩한 원문 텍스트 및 HTML 단락 (불변)
         │
         ▼
[2. Normalized Fact]    : 스키마 규격에 맞춰 추출 및 검증된 객관적 사실 데이터
         │
         ▼
[3. AI Interpretation]  : 에이전트가 생성한 요약문, 연관도 태그, 한 줄 소개
```
* 에이전트가 가공한 'AI Interpretation'을 'Raw Evidence'나 'Normalized Fact'인 것처럼 저장하는 것을 엄격히 금지한다.

---

## 15. Playwright MCP 사용 기준 (Playwright Usage Rules)

본 플랫폼 개발 환경에는 `playwright` MCP가 이미 설치되어 있으나, 시스템 자원과 토큰을 낭비하지 않기 위해 엄격한 조건 하에서만 사용한다.

```
┌─────────────────────────────────────────────────────────────┐
│ 1차 기본 방식: HTTP / Document Retrieval                     │
│ 정적 HTML, 단순 텍스트, 다운로드 가능한 문서, 오픈 API       │
└──────────────────────────────┬──────────────────────────────┘
                               │ (JS 렌더링/인터랙션 필요 시에만)
┌──────────────────────────────▼──────────────────────────────┐
│ 2차 전용 방식: Playwright Headless Browser                   │
│ SPA, 동적 JS 로딩, 탭/아코디언 클릭, 페이징, 무한 스크롤   │
└─────────────────────────────────────────────────────────────┘
```

### 1) 가벼운 HTTP Retrieval 우선 (Default):
- 단순 정적 웹페이지, HTML 본문, 정적 공지사항은 일반 HTTP 요청이나 경량 리트리버를 우선 사용한다.

### 2) Playwright를 반드시 사용해야 하는 예외 상황:
1. **Client-Side Rendering (CSR / SPA)**: React, Vue, Angular 등으로 제작되어 JS가 실행되어야만 교수 명부가 렌더링되는 경우.
2. **클릭 및 탭 인터랙션 필수**: 교수 프로필에서 [연구실 소개], [주요 과제], [담당 교과목] 탭을 클릭해야 내용이 표시되는 경우.
3. **아코디언 / 더보기 펼치기**: 세부 프로젝트 내용이 아코디언 컴포넌트 내부에 숨겨져 있는 경우.
4. **동적 페이징 및 무한 스크롤**: 클릭이나 스크롤을 통해서만 추가 교원 목록이 로드되는 경우.
5. **탐색 시나리오 예시**:
   ```text
   대학 공식 홈페이지 접속
   ↓ (GNB 학과 메뉴 클릭)
   디자인컨버전스학부 페이지 진입
   ↓ (상단 네비게이션 '교수진' 탭 클릭)
   교수 목록에서 특정 교수 상세 카드 클릭
   ↓ (프로필 내 '연구실/프로젝트' 탭 클릭)
   최신 산학협력 프로젝트 및 교과목 과제 텍스트 확인
   ```

---

## 16. Forbidden Actions (10대 엄격 금지 사항)

다음 행위는 파이프라인 무결성을 파괴하는 치명적 오류로 간주되며 엄격히 금지된다.

1. 🚫 **출처 없는 교수 정보 임의 생성 금지 (No Hallucinated Profiles)**
2. 🚫 **검색 결과 요약(Snippet)만으로 사실 확정 금지 (No Snippet-Only Facts)**
3. 🚫 **과거 학기 데이터를 현재 학기로 추정/승격 금지 (No Semester Extrapolation)**
4. 🚫 **학과 일치만으로 학생 프로젝트 지도교수 관계 추정 금지 (No Unsubstantiated Supervision)**
5. 🚫 **공식 증빙 없는 기업 산학 협력관계 추정 금지 (No Unverified Industry Ties)**
6. 🚫 **웹상에 존재하지 않는 가상의 프로젝트명 생성 금지 (No Invented Projects)**
7. 🚫 **유효하지 않거나 임의로 조작된 URL 저장 금지 (No Fake/Broken URLs)**
8. 🚫 **신뢰도가 불확실한 데이터를 `VERIFIED` 상태로 저장 금지 (No Premature Verification)**
9. 🚫 **`collected_at` 타임스탬프 갱신만으로 `UPDATED` 변경 처리 금지 (No False Updates)**
10. 🚫 **라이선스나 출처가 불분명한 외부 데이터를 사실로 확정 금지 (No Unlicensed/Unattributed Ingestion)**

---

## 17. Human Review Trigger (사람 검토 격리 조건)

다음 9가지 조건 중 하나라도 발생하는 경우, 에이전트는 데이터를 자동 확정하지 않고 `verification_status: "REVIEW_NEEDED"`로 격리하여 인간 관리자의 검토 큐로 전환한다.

1. **출처 간 정보 상충**: 대학 포털과 학과 사이트 간 직급이나 소속 학과가 서로 다르게 표기된 경우.
2. **신뢰도 기준 미달**: 수집된 데이터의 종합 신뢰도가 `0.75` 미만인 경우.
3. **현재 학기 여부 불명확**: 교과목이나 프로젝트의 개설 연도 및 학기가 특정되지 않은 경우.
4. **교수-학생 지도 관계 증빙 부족**: 동일 학과이나 작품 도록 크레딧 등에 지도교수 명시가 없는 경우.
5. **산학협력 관계 입증 불충분**: 기업 로고나 이름은 있으나 공식 과제 협약 증빙이 누락된 경우.
6. **동일 인물 여부 모호**: 동명이인 교수가 동일 대학 내 서로 다른 학과에 존재하는 경우.
7. **동일 프로젝트 중복성 모호**: 과제명은 유사하나 수행 기간이나 지원 기관이 다른 경우.
8. **공식 URL 검증 실패**: 프로필 링크 접속 시 404, 리다이렉트 에러, 접속 불가 상태인 경우.
9. **기존 데이터 존재 시 페이지 삭제**: 기존에 `VERIFIED`로 등록되어 있던 교수의 공식 페이지가 삭제된 경우.

---

## 18. Research Workflow (12단계 논리 구조)

향후 LangGraph 파이프라인에서 실행될 12단계 오퍼레이션 흐름은 다음과 같다.

```text
[1. University Discovery]
        │ 대학 큐(Queue)에서 대상 대학 탐색 및 타겟 URL 획득
        ▼
[2. Department Discovery]
        │ 타겟 대학 내 디자인/IT 등 산학 연계 학과 페이지 발굴
        ▼
[3. Professor Discovery]
        │ 학과 교원 명부 기반 교수 후보군(Candidate) 발굴
        ▼
[4. Official Source Validation]
        │ .ac.kr 등 공식 도메인 화이트리스트 검증 (실패 시 unverified 격리)
        ▼
[5. Professor Information Extraction]
        │ 이름, 직위, 연구실, 연구분야, 프로필 URL 등 19개 스키마 정밀 추출
        ▼
[6. Semester Core Task Extraction]
        │ 연도/학기 구분을 통한 시그니처 커리큘럼 및 핵심 과제 추출
        ▼
[7. Industry Collaboration Extraction]
        │ 기업 연계 과제, 산학협력 실적 및 협력 상태 구조화
        ▼
[8. Student Portfolio Matching]
        │ 학생 졸업작품 DB와 엄격한 증거 기반 상호 바인딩
        ▼
[9. Normalization]
        │ 텍스트, URL, 대학/학과 명칭 정규화 및 규격 통일
        ▼
[10. Confidence Evaluation]
        │ 4대 출처 계층 및 사실 확인 정도에 따른 신뢰도 점수 산출
        ▼
[11. Deduplication]
        │ 복합 식별자(Composite Identity Key) 기반 중복 엔트리 병합
        ▼
[12. Change Detection & Human Review]
        │ 기존 DB와 시맨틱 차이 비교 (NEW/UPDATED/UNCHANGED/REVIEW_NEEDED)
        │ ──> 최종 승인된 데이터만 Database Update
```

---

## 19. Output Expectations & Concrete Examples

### 1) 단일 교수 추출 결과 JSON 규격 예시:
```json
{
  "professor_name": "홍길동",
  "university": "홍익대학교",
  "department": "디자인컨버전스학부",
  "position": "교수",
  "major": "인터랙션 디자인",
  "research_area": ["생성형 AI UX", "모빌리티 인터랙션", "공간 컴퓨팅"],
  "lab_name": "지능형 인터랙션 디자인 랩 (IIDL)",
  "official_profile_url": "https://design.hongik.ac.kr/faculty/gdhong",
  "lab_url": "https://iidl.hongik.ac.kr",
  "current_semester": "2026-2",
  "assignment_one_liner": "생성형 AI 에이전트와 미래 모빌리티 자율주행 경험 디자인",
  "assignment_details": {
    "course_name": "산학캡스톤디자인 II",
    "semester": "2026-2",
    "academic_year": 2026,
    "grade": 4,
    "course_type": "산학연계 캡스톤디자인",
    "assignment_name": "AI 기반 운전자 맞춤형 인포테인먼트 인터페이스 설계",
    "official_source": "https://design.hongik.ac.kr/curriculum/2026-2/capstone"
  },
  "industry_collaboration": [
    {
      "company": "현대자동차",
      "title": "SDV 차량 내 AI 에이전트 인터랙션 가이드라인 수립",
      "period": "2026.03 ~ 2026.11",
      "status": "ONGOING",
      "source_url": "https://iacf.hongik.ac.kr/rnd/notice/1024"
    }
  ],
  "student_matches": [
    {
      "student_id": "std_2026_014",
      "student_name": "김철수",
      "project_title": "자율주행 PBV 환경을 위한 모듈형 햅틱 시트 인터페이스",
      "relation_type": "PROFESSOR_SUPERVISED_PROJECT",
      "evidence": "2026 홍익대학교 디자인컨버전스학부 졸업전시 도록 p.48 지도교수 홍길동 명기"
    }
  ],
  "source_url": "https://design.hongik.ac.kr/faculty/gdhong",
  "source_type": "OFFICIAL_UNIVERSITY",
  "source_title": "홍익대학교 디자인컨버전스학부 교수진 소개",
  "collected_at": "2026-09-16T16:00:00Z",
  "confidence_score": 0.95,
  "verification_status": "VERIFIED"
}
```

### 2) 변경 감지 보고서(Change Report) 예시:
```json
{
  "run_id": "run_prof_20260916_01",
  "summary": {
    "total_scanned": 1,
    "new_count": 0,
    "updated_count": 1,
    "unchanged_count": 0,
    "review_needed_count": 0
  },
  "changes": [
    {
      "professor_id": "hongik_design_hong_gildong",
      "name": "홍길동",
      "change_type": "UPDATED",
      "semantic_diff": {
        "industry_collaboration": {
          "action": "ADDED",
          "details": "현대자동차 SDV 차량 내 AI 에이전트 인터랙션 가이드라인 수립 (2026)"
        }
      },
      "ignored_diff": ["collected_at"]
    }
  ]
}
```
"""

target_path = os.path.join(".agents", "skills", "professor-research", "SKILL.md")
with open(target_path, "w", encoding="utf-8") as f:
    f.write(skill_content.strip() + "\n")

print(f"Successfully generated {target_path} ({os.path.getsize(target_path)} bytes)")
