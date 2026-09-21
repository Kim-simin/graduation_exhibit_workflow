# 📚 LangChain Docs MCP 연결 및 검증 결과 보고서 (LANGCHAIN_DOCS_MCP_TEST.md)

본 문서는 **졸업전시 아카이브 & AI-Native 산학·취업 매칭 플랫폼**의 LangGraph 자동화 엔진 고도화 과정에서, 최신 공식 문서(`https://docs.langchain.com/`)를 실시간으로 직접 조회하고 참조할 수 있도록 **LangChain 공식 Docs MCP (`docs-langchain`)**를 설치·연결하고 다각도로 검증한 결과 보고서입니다.

> **원칙 준수 확인**:
> - 기존 소스 코드(Next.js 웹, FastAPI/Flask 백엔드, LangGraph 파이프라인, SQLite/JSON 데이터베이스)는 일체 수정하지 않고 100% 보존하였습니다 (**0 Code Modification**).
> - 기존에 성공적으로 연결된 **Playwright MCP 설정을 온전히 보존**하였으며, `playwright`와 `docs-langchain` 2개 서버가 공존하도록 구성하였습니다.
> - 본 단계에서는 오직 LangChain Docs MCP만 설치·구성하였으며 PostgreSQL, Filesystem, Fetch 등 타 MCP는 일체 설치하지 않았습니다.

---

## 1. 개요 및 공식 서버 정보

* **공식 문서 포털 (Official Docs)**: [https://docs.langchain.com/](https://docs.langchain.com/)
* **공식 Docs MCP 엔드포인트**: `https://docs.langchain.com/mcp`
* **서버 명칭 (Server Name)**: `Docs by LangChain` (v1.0.0)
* **전송 프로토콜 (Transport)**: Streamable HTTP (JSON-RPC 2.0 over Server-Sent Events / HTTP POST)
* **에코시스템 정합성**: `.agents/skills/ecosystem-primer/SKILL.md`에서 정의한 `docs-langchain` 및 `mcp__docs-langchain__*` 네임스페이스와 100% 일치

---

## 2. MCP Configuration 위치 및 실제 설정 내용

### 1) 설정 파일 위치
1. **프로젝트 범위 (Project-Scoped)**: `c:\Users\graduation_exhibit_workflow\.agents\mcp_config.json`
2. **글로벌 범위 (Global-Scoped)**: `C:\Users\USER\.gemini\config\mcp_config.json`

### 2) 실제 설정 내용 (`mcp_config.json`)
기존 `playwright` 서버 설정을 안전하게 보존하고, `docs-langchain`을 등록하여 2대 핵심 MCP 서버 체계를 완성하였습니다.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx.cmd",
      "args": [
        "@playwright/mcp@latest",
        "--headless"
      ],
      "env": {}
    },
    "docs-langchain": {
      "serverUrl": "https://docs.langchain.com/mcp",
      "url": "https://docs.langchain.com/mcp"
    }
  }
}
```

---

## 3. 서버 Startup 및 Antigravity Detection 결과

### 1) JSON-RPC 2.0 프로토콜 핸드셰이크 (`initialize`)
* **응답 상태**: HTTP 200 OK
* **Server Info**: `{"name": "Docs by LangChain", "version": "1.0.0"}`
* **Protocol Version**: `2024-11-05`
* **Server Capabilities**: `{"tools": {"listChanged": true}, "resources": {"listChanged": true}}`

### 2) 노출 도구 검색 (`tools/list`)
Antigravity 에이전트가 호출 가능한 3개의 공식 문서 조회 도구가 감지되었습니다.
1. **`search_docs_by_lang_chain`**:
   - 지식 베이스 검색 도구: 제목, 가이드 경로, 개념 설명, 샘플 코드 및 직접 링크 반환
2. **`query_docs_filesystem_docs_by_lang_chain`**:
   - 가상 문서 파일시스템 탐색 도구: `rg` (ripgrep 키워드 검색), `cat` (MDX 전문 읽기), `tree` (디렉토리 구조 파악) 지원
3. **`submit_feedback`**:
   - 문서 오류 및 개선 피드백 전송 도구

---

## 4. 공식 Docs 핵심 개념 및 질의 검증 결과

일반 웹 검색엔진 결과가 아닌 `docs.langchain.com` 공식 출처와 직결된 콘텐츠가 조회되는지 엄격히 검증하였습니다.

### [검증 4 & 5-1] LangGraph 핵심 개념 검색
- **질의 키워드**: `StateGraph`, `State`, `Nodes`, `Edges`, `conditional edges`, `checkpointer`, `thread_id`, `interrupt`, `Command(resume=...)`
- **조회 출처**: `https://docs.langchain.com/oss/python/langgraph/interrupts`
- **검색 결과 요약**:
  > *"Sometimes you need to validate input from humans and re-prompt if the value is invalid. The recommended approach is to call `interrupt()` once per node invocation, return from the node with the error message stored in state, and use a conditional edge to loop back to the node until a valid value is provided."*
- **판정**: **PASS (공식 소스 확인)**

---

### [검증 5-2] Human-in-the-Loop (HITL) 인터럽트 워크플로우 질의
- **테스트 질문**: *"현재 LangGraph에서 interrupt()를 사용하여 Human-in-the-loop approval workflow를 구현하는 공식 방법을 설명해라."*
- **공식 문서 출처**:
  - `https://docs.langchain.com/oss/python/langchain/human-in-the-loop#responding-to-interrupts`
  - `https://docs.langchain.com/oss/python/langgraph/interrupts`
- **공식 응답 핵심 내용**:
  1. **인터럽트 발생**: 노드 내부에서 `interrupt(value)`를 호출하여 실행을 일시 정지하고 상태를 체크포인터에 스냅샷으로 저장.
  2. **상태 전달**: 에이전트는 `GraphOutput`의 `interrupts` 속성을 통해 검토가 필요한 액션/페이로드를 관리자/사용자에게 전달.
  3. **재개(Resume)**: 사용자가 결정을 내리면 `graph.invoke(Command(resume=decision), config={"configurable": {"thread_id": "..."}})` 또는 `graph.stream_events(Command(resume=...))`를 호출하여 해당 노드부터 실행을 재개.
  4. **주의점**: `while True` 루프 내부에서 `interrupt()`를 여러 번 호출하지 말고, 노드당 1회 호출 후 `conditional edge`로 루프백할 것.
- **판정**: **PASS**

---

### [검증 5-3] Persistence (Checkpointer & thread_id) 질의
- **테스트 질문**: *"현재 LangGraph persistence에서 checkpointer와 thread_id는 어떻게 사용되는가?"*
- **공식 문서 출처**:
  - `https://docs.langchain.com/oss/python/langgraph/persistence`
  - `https://docs.langchain.com/oss/javascript/langgraph/persistence#checkpointer-vs-store`
- **공식 응답 핵심 내용**:
  1. **`checkpointer`**: 각 슈퍼스텝(super-step)이 끝날 때마다 그래프 상태(State Snapshot)를 영속적으로 기록하는 엔진 (`MemorySaver`, `SqliteSaver`, `PostgresSaver`). 프로세스 재시작 후에도 상태를 복원하거나 Time-travel(과거 상태로 되돌리기) 가능.
  2. **`thread_id`**: 특정 대화 세션 또는 독립된 워크플로우 실행 흐름을 식별하는 고유 키(`config={"configurable": {"thread_id": "thread-123"}}`). 같은 `thread_id` 내에서는 상태가 연속적으로 보존되며, 서로 다른 `thread_id`는 완벽히 격리됨.
  3. **`Checkpointer vs Store`**:
     - Checkpointer: 단일 `thread_id` 범위의 단기 세션 상태 스냅샷 저장
     - Store: 여러 스레드 간 공유되는 장기 기억(Cross-thread Memory) 저장
- **판정**: **PASS**

---

### [검증 5-4] 가상 파일시스템 리서치 (`query_docs_filesystem`)
- **실행 명령**: `rg -il 'checkpointer' /`
- **실행 결과**:
  ```text
  /langsmith/data-plane.mdx
  /langsmith/faq.mdx
  /oss/javascript/langgraph/checkpointers.mdx
  /oss/python/langgraph/checkpointers.mdx
  /oss/python/langgraph/persistence.mdx
  ```
- **판정**: **PASS (파일시스템 샌드박스를 통한 MDX 원문 탐색 기능 확인)**

---

## 5. 트러블슈팅 및 해결 과정

1. **HTTP 406 Not Acceptable 발생**:
   - **원인**: Streamable HTTP MCP 프로토콜 규격 상 클라이언트가 `application/json`과 `text/event-stream`을 모두 수용해야 함 (`Accept: application/json, text/event-stream`).
   - **해결**: 요청 헤더에 `Accept: application/json, text/event-stream`을 명시하여 Cloudflare/Mintlify MCP 백엔드와의 완벽한 통신을 수립함.
2. **Windows 콘솔 인코딩(`cp949`) 에러**:
   - **원인**: 문서 원문의 em-dash(`—`) 및 특수문자가 콘솔 출력 시 인코딩 오류 발생.
   - **해결**: Python 스트림에 `sys.stdout.reconfigure(encoding="utf-8")`를 적용하고 결과 문서를 UTF-8 No BOM 규격으로 안전하게 저장함.

---

## 6. 최종 상태 요약

```text
LANGCHAIN DOCS MCP STATUS

Installation: PASS
Server Startup: PASS
Antigravity Detection: PASS
Tools Detection: PASS
Official Docs Query: PASS
LangGraph Query: PASS
HITL Query: PASS
Persistence Query: PASS
```

### 활성화된 MCP 서버 전체 목록 (Active MCP Servers)
1. **`playwright`** (Local Stdio via `npx.cmd @playwright/mcp@latest --headless`) — 26개 브라우저 자동화 도구
2. **`docs-langchain`** (Remote Streamable HTTP via `https://docs.langchain.com/mcp`) — 3개 공식 문서 실시간 탐색/리서치 도구
