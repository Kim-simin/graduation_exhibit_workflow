# Antigravity Agent Skills & MCP 도입 계획서 (SKILL_MCP_INSTALL_PLAN.md)

본 문서는 **졸업전시 아카이브 & AI-Native 산학·취업 매칭 플랫폼**의 Antigravity 개발 환경에 필요한 **Agent Skills**와 **MCP(Model Context Protocol) Servers**의 적합성을 분석하고, 도구 중복 및 프로젝트 기술 스택을 고려하여 **최적의 설치 로드맵(A/B/C 분류)**을 정의한 공식 도입 계획서입니다.

> **원칙**: 본 단계에서는 실제 설치 명령을 실행하지 않으며, 계획서 확정 및 승인 후 단계별로 반영합니다.

---

## 1. 현재 프로젝트 기술 스택 현황

| 계층 | 기술 스택 | 현재 적용 상태 |
|:---|:---|:---|
| **Frontend** | Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS, Lucide React | 졸업전시 아카이브, 좌측 사이드바, 교수/RFP/브랜드에셋 페이지, 3대 관제 대시보드 구축 완료 |
| **Backend & API** | Next.js Route Handlers (`app/api/...`), Node.js `child_process` | 파이썬 자동화 파이프라인 트리거 및 큐 상태 서빙 완료 |
| **Agent Engine** | Python 3.11, LangGraph, LangChain Core | 12노드 교수 자동화, 10노드 전국 큐 오케스트레이터, 10노드 콘텐츠 리서치 엔진 구축 완료 |
| **Automation & Tooling** | Playwright, PIL (Pillow), hashlib, urllib | 졸업전시 정밀 캡처 스크립트(`scripts/run_queue_agent.py`) 및 에셋 메타데이터 추출기 가동 중 |
| **Data Persistence** | Dual JSON Database (`data/`, `my-exhibit-platform/data/`), File Storage | 53개 대학 큐, 교수 DB, 콘텐츠 리서치 DB, 실행 감사 로그 원자적 동기화 운용 중 |

---

## 2. Agent Skills 적합성 분석 및 분류

분류 기준:
* **A = 반드시 설치 (Must Install)**: 현재 및 차기 핵심 자동화(Human-in-the-loop, 상태 영속화, E2E 검증)에 직결되는 필수 스킬
* **B = 설치 권장 (Recommended)**: 개발 편의성 및 모범 사례 참조용 스킬
* **C = 현재 불필요 (Not Needed)**: 이미 구현되었거나 스택과 불일치하는 스킬

### 1) LangChain / LangGraph Skills

---

#### ① `langgraph-fundamentals`
* **분류**: **A (반드시 설치)**
* **설치 이유**: 본 플랫폼의 핵심 엔진인 `Professor Intelligence Graph`, `National Queue Orchestrator`, `Content Research Graph`가 모두 LangGraph StateGraph 기반으로 동작합니다. 향후 다중 에이전트 협업 및 노드 확장 시 표준 설계 패턴과 상태 관리 안티패턴 방지가 필수적입니다.
* **우리 프로젝트에서 사용하는 기능**:
  * `TypedDict` 기반의 전역/배치 상태 모델링
  * 직렬 노드 연결 및 조건부 분기(`route_after_validation`) 엣지 설계
  * 노드 간 멱등성 보장 및 무결성 데이터 흐름 제어
* **설치 범위**: Workspace (`.agents/skills/langgraph-fundamentals/SKILL.md`)
* **공식 URL**: https://github.com/langchain-ai/langchain-skills/tree/main/skills/langgraph-fundamentals
* **다른 도구와의 중복 여부**: **중복 없음** (LangGraph 특화 핵심 방법론)

---

#### ② `langgraph-persistence`
* **분류**: **A (반드시 설치)**
* **설치 이유**: 전국 53개 대학 및 대규모 콘텐츠 에셋을 장시간(Overnight/배치) 수집할 때 프로세스가 예기치 않게 중단되더라도 이전 체크포인트부터 정확히 이어서 실행(Resume/Time-travel)할 수 있는 체크포인팅 엔진이 필수적입니다.
* **우리 프로젝트에서 사용하는 기능**:
  * `MemorySaver` / `SqliteSaver` 기반 그래프 상태 스냅샷 저장
  * 대학 큐 및 에셋 다운로드 중단 시 직전 상태 복구
  * 실행 히스토리 감사 및 단계별 디버깅
* **설치 범위**: Workspace (`.agents/skills/langgraph-persistence/SKILL.md`)
* **공식 URL**: https://github.com/langchain-ai/langchain-skills/tree/main/skills/langgraph-persistence
* **다른 도구와의 중복 여부**: **중복 없음** (현재 파일 기반 수동 큐를 공식 체크포인터로 고도화)

---

#### ③ `langgraph-human-in-the-loop`
* **분류**: **A (반드시 설치)**
* **설치 이유**:
  1. 최종 목표인 **'SNS 업로드 자동화'**의 핵심 단계인 **'관리자 최종 승인 후 게시'** 워크플로우에 필수입니다.
  2. 현재 구축된 **'콘텐츠 리서치'**에서도 라이선스가 불명확하여 `REVIEW_NEEDED(검토 필요)` 상태로 격리된 에셋을 관리자가 대시보드에서 검토·승인 후 다운로드하도록 인터럽트(`interrupt()`)하는 기능에 직결됩니다.
* **우리 프로젝트에서 사용하는 기능**:
  * `interrupt()` 기반 에이전트 실행 일시정지 및 관리자 입력 대기
  * 관리자 승인/반려 입력 후 워크플로우 동적 재개
  * 상태 편집(State Editing) 후 실행 재개
* **설치 범위**: Workspace (`.agents/skills/langgraph-human-in-the-loop/SKILL.md`)
* **공식 URL**: https://github.com/langchain-ai/langchain-skills/tree/main/skills/langgraph-human-in-the-loop
* **다른 도구와의 중복 여부**: **중복 없음** (LangGraph 공식 Human-in-the-loop 표준 구현체)

---

#### ④ `ecosystem-primer`
* **분류**: **B (설치 권장)**
* **설치 이유**: LangChain, LangGraph, LangSmith, LangServe 간의 버전 호환성 가이드 및 라이브러리 간 역할 경계를 명확히 참조할 수 있습니다.
* **우리 프로젝트에서 사용하는 기능**: 향후 모니터링 툴(LangSmith) 연동 및 프롬프트 관리 가이드라인 참조
* **설치 범위**: Global 또는 Workspace
* **공식 URL**: https://github.com/langchain-ai/langchain-skills/tree/main/skills/ecosystem-primer
* **다른 도구와의 중복 여부**: **중복 없음** (개념 가이드)

---

#### ⑤ `langgraph-cli`
* **분류**: **B (설치 권장)**
* **설치 이유**: 로컬 LangGraph Studio GUI를 띄워 노드 시각화 및 인터랙티브 테스트를 수행할 수 있습니다.
* **우리 프로젝트에서 사용하는 기능**: 복합 노드 그래프 시각화 검증
* **설치 범위**: Workspace
* **공식 URL**: https://github.com/langchain-ai/langchain-skills/tree/main/skills/langgraph-cli
* **다른 도구와의 중복 여부**: 부분 중복 (이미 자체 CLI `runner.py` 및 Next.js 대시보드가 구현되어 있으므로 필수 아님)

---

#### ⑥ `langgraph-dependencies`
* **분류**: **C (현재 불필요)**
* **설치 이유**: LangChain/LangGraph 패키지 의존성 충돌 해결용 가이드.
* **우리 프로젝트에서 사용하는 기능**: 없음 (현재 `py -3.11` 환경에서 `langgraph`, `langchain-core`가 이미 완벽하게 설치되어 정상 구동 중)
* **설치 범위**: -
* **공식 URL**: https://github.com/langchain-ai/langchain-skills/tree/main/skills/langgraph-dependencies
* **다른 도구와의 중복 여부**: 불필요 (현재 환경 문제 없음)

---

### 2) Web App Testing Skill

#### ⑦ `webapp-testing`
* **분류**: **A (반드시 설치)**
* **설치 이유**: 본 프로젝트는 메인 아카이브 갤러리, 사이드바, 다크모드 반전, 3대 관제 대시보드(`/admin`, `/admin/professors`, `/admin/content`) 등 복잡한 Next.js 프론트엔드 UI를 보유하고 있습니다. 컴포넌트 수정 시 발생할 수 있는 레이아웃 깨짐(Flexbox blowout), 반응형 오류, 테마 전환 버그를 방지하기 위해 E2E 웹앱 테스트 스킬이 반드시 필요합니다.
* **우리 프로젝트에서 사용하는 기능**:
  * Playwright 기반 프론트엔드 E2E 테스트 작성 및 실행
  * 관제 대시보드 버튼 클릭, 모달 오픈, 탭 전환, 실시간 렌더링 검증
  * 스크린샷 비교 기반 시각적 회귀 테스트
* **설치 범위**: Workspace (`.agents/skills/webapp-testing/SKILL.md`)
* **공식 URL**: https://github.com/microsoft/playwright / Playwright Testing Guidelines
* **다른 도구와의 중복 여부**: **중복 없음** (현재 UI 테스트는 수동 curl/urllib 검증에 의존하고 있어 필수 보완)

---

## 3. Model Context Protocol (MCP) Servers 적합성 분석 및 분류

Antigravity의 기본 내장 도구(`view_file`, `write_to_file`, `read_url_content`, `run_command` 등)와의 **기능 중복 여부**를 철저히 검증하여 필수 서버만 선별합니다.

---

#### ① `Playwright MCP`
* **분류**: **A (반드시 설치)**
* **설치 이유**:
  1. 전국 대학교 졸업전시 웹사이트의 대다수가 React, Vue, Next.js 기반의 **SPA(Single Page Application)** 또는 동적 자바스크립트 렌더링 사이트입니다.
  2. 단순 HTML 수집기로는 렌더링되지 않는 동적 DOM 엘리먼트 탐색, 무한 스크롤, 탭 클릭 후 나타나는 학생 작품 캡처에 필수적입니다.
* **우리 프로젝트에서 사용하는 기능**:
  * 동적 웹사이트 크롤링 및 실시간 렌더링 검사
  * 졸업전시 고해상도 메인 포스터 및 작품 캔버스 이미지 정밀 캡처
  * 브라우저 콘솔 에러 및 네트워크 요청 모니터링
* **설치 범위**: Workspace MCP (`mcp_config.json`)
* **공식 URL**:
  * https://github.com/microsoft/playwright-mcp
  * https://github.com/modelcontextprotocol/servers/tree/main/src/playwright
* **다른 도구와의 중복 여부**: **중복 없음**
  * Antigravity 내장 `read_url_content`는 정적 HTML만 HTTP GET 요청으로 읽어오며, 자바스크립트 실행/클릭/스크롤/스크린샷 캡처가 불가능합니다. Playwright MCP는 이를 완벽히 보완하는 필수 도구입니다.

---

#### ② `LangChain Docs MCP`
* **분류**: **A (반드시 설치)**
* **설치 이유**: LangGraph는 v0.2, v0.3으로 빠르게 진화하면서 StateGraph 문법, `interrupt()` 파라미터, Checkpointer API 규격이 지속적으로 업데이트되고 있습니다. LLM의 과거 학습 데이터로 인한 구버전 코드(deprecated API) 생성을 원천 차단하고 공식 최신 문서를 즉시 RAG로 참조할 수 있습니다.
* **우리 프로젝트에서 사용하는 기능**:
  * LangGraph 최신 API 명세, State 정의, Checkpointer 문법 실시간 검색
  * 공식 예제 코드 스니펫 직접 인용 및 검증
* **설치 범위**: Workspace MCP (`mcp_config.json`)
* **공식 URL**: https://github.com/langchain-ai/langchain-skills (Docs MCP Adapter)
* **다른 도구와의 중복 여부**: **중복 없음**
  * 일반 웹 검색(`search_web`)은 블로그 구버전 글이나 노이즈가 섞여 정확도가 떨어지나, Docs MCP는 공식 문서 인덱스에 직결되어 정확도가 월등합니다.

---

#### ③ `Fetch MCP`
* **분류**: **C (현재 불필요 - 완전 중복)**
* **설치 이유 없음**: 웹 URL을 fetch하여 텍스트/마크다운으로 변환하는 서버입니다.
* **우리 프로젝트에서 사용하는 기능**: 없음
* **설치 범위**: -
* **공식 URL**: https://github.com/modelcontextprotocol/servers/tree/main/src/fetch
* **다른 도구와의 중복 여부**: **완전 중복 (Duplicate)**
  * Antigravity 기본 내장 도구인 `read_url_content`가 완벽히 동일한 기능을 네이티브로 초고속 수행하므로 설치할 필요가 없습니다.

---

#### ④ `Filesystem MCP`
* **분류**: **C (현재 불필요 - 완전 중복)**
* **설치 이유 없음**: 로컬 파일 시스템 읽기, 쓰기, 디렉토리 탐색을 제공하는 서버입니다.
* **우리 프로젝트에서 사용하는 기능**: 없음
* **설치 범위**: -
* **공식 URL**: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
* **다른 도구와의 중복 여부**: **완전 중복 (Duplicate)**
  * Antigravity 기본 내장 도구(`view_file`, `write_to_file`, `replace_file_content`, `list_dir`, `find_by_name`, `grep_search`)가 이미 고성능으로 제공되며, 파일 수정 및 정밀 Diff 기능을 지원하므로 완전 중복입니다.

---

#### ⑤ `PostgreSQL MCP`
* **분류**: **C (현재 불필요 - 인프라 미도입)**
* **설치 이유 없음**: PostgreSQL 스키마 조회 및 쿼리 실행 서버입니다.
* **우리 프로젝트에서 사용하는 기능**: 현재 플랫폼은 빠르고 휴대성이 뛰어난 듀얼 JSON Database(`data/`, `my-exhibit-platform/data/`) 및 SQLite 기반 Saver를 사용 중이며, 외부 PostgreSQL 인프라가 구축되지 않았습니다.
* **설치 범위**: -
* **공식 URL**: https://github.com/modelcontextprotocol/servers/tree/main/src/postgres
* **다른 도구와의 중복 여부**: 불필요 (향후 대규모 클라우드 DB 전환 시 재검토)

---

## 4. 최종 선정: 'A = 반드시 설치' 종합 마스터 목록

우리 프로젝트의 현재 기술 스택 및 개발 목표에 정확히 부합하며, 내장 도구와 중복되지 않는 **최종 설치 대상(A 목록)**은 다음과 같습니다.

### [A 목록: 반드시 설치할 Skills (4개)]
| 순번 | Skill 명칭 | 역할 및 설치 사유 | 적용 모듈 | 공식 레포지토리 |
|:---:|:---|:---|:---|:---|
| **1** | **`langgraph-fundamentals`** | StateGraph, Nodes, Edges 표준 설계 및 에이전트 워크플로우 안정화 | `professor_graph`, `content_graph` 전반 | [LangChain Skills](https://github.com/langchain-ai/langchain-skills) |
| **2** | **`langgraph-persistence`** | 장기 실행 큐 체크포인팅 및 장애 복구(State Checkpointer) | 전국 대학 큐 오케스트레이터 | [LangChain Skills](https://github.com/langchain-ai/langchain-skills) |
| **3** | **`langgraph-human-in-the-loop`** | SNS 업로드 관리자 승인 및 라이선스 검토필요 수동 승인(`interrupt`) | 콘텐츠 파이프라인, SNS 업로더 | [LangChain Skills](https://github.com/langchain-ai/langchain-skills) |
| **4** | **`webapp-testing`** | Next.js 3대 관제 대시보드 및 복합 반응형 UI 회귀 방지 E2E 테스트 | `my-exhibit-platform` UI/UX | [Playwright Testing](https://github.com/microsoft/playwright) |

### [A 목록: 반드시 설치할 MCP Servers (2개)]
| 순번 | MCP 명칭 | 역할 및 설치 사유 | 보완 내역 (비중복 사유) | 공식 레포지토리 |
|:---:|:---|:---|:---|:---|
| **1** | **`Playwright MCP`** | React/Vue 기반 전국 대학 졸전 SPA 동적 렌더링 크롤링 & 에셋 정밀 캡처 | 내장 `read_url_content`의 JS 미실행 한계 완벽 극복 | [Playwright MCP](https://github.com/microsoft/playwright-mcp) |
| **2** | **`LangChain Docs MCP`** | 최신 LangGraph v0.2+ 공식 문서 및 API 명세 RAG 검색 | 일반 웹 검색의 구버전 노이즈 차단 및 최신 문법 보장 | [MCP Servers](https://github.com/modelcontextprotocol/servers) |

---

## 5. 향후 단계별 설치 및 환경 구성 가이드 (Next Steps)

사용자의 계획서 승인 후 다음 단계로 환경을 구성합니다:

### 1단계: Workspace Skills 디렉터리 구성 (`.agents/skills/`)
```
c:\Users\graduation_exhibit_workflow\.agents\skills\
├── langgraph-fundamentals\SKILL.md
├── langgraph-persistence\SKILL.md
├── langgraph-human-in-the-loop\SKILL.md
└── webapp-testing\SKILL.md
```

### 2단계: Workspace MCP 설정 (`.agents/mcp_config.json`)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "langchain-docs": {
      "command": "npx",
      "args": ["-y", "@langchain/docs-mcp-server"]
    }
  }
}
```

> **상태**: 현재 단계에서는 설치 명령을 실행하지 않았으며, 위 계획서 확정 승인 시 즉시 구성을 진행할 수 있도록 준비되었습니다.
