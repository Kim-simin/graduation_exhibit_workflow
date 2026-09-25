# Antigravity Project Instructions & Global Guidelines

## 1. 대학교 졸업전시 카드 생성 시 학생 작품 상세 학과명 고정 규칙 (MANDATORY)
- **적용 시점**: **다음(차기) 대학교 카드 추가 및 리서치 작업부터 고정 적용** (이전 기존 완료 작업은 보존).
- **규칙 내용**:
  - 대학교 카드 내 개별 학생 출품작(`artworks`) 등록 시, 상단 배지에 포괄적인 학부명(예: `디자인이노베이션전...`)이 축약 노출되지 않도록 각 작품별 **상세 학과명/세부 전공명(예: `VISUAL DESIGN과`, `INDUSTRIAL DESIGN과` 등)**을 반드시 `department` 필드에 기재해야 합니다.
  - JSON 스키마 규격:
    ```json
    {
      "title": "[분야] 작품명",
      "student_name": "학생명",
      "department": "VISUAL DESIGN과",
      "image": "uploads/...",
      "thumbnail": "uploads/...",
      "description": "...",
      "inferred_role": "디자이너"
    }
    ```
  - 프론트엔드 모달에서는 `art.department || exhibition.department`를 우선 배지에 표기합니다.

## 2. 데이터베이스 보호 및 무결성 규칙 (JSON DB Safeguard)
- `data/university_queue.json`, `data/professors.json` 등 주요 데이터베이스 수정 시 전체 덮어쓰기(`overwrite: true`)를 금지하고 기존 시드 레코드의 무결성을 엄격히 보존합니다.
- 변경 후 항상 구문 유효성과 레코드 카운트를 검증합니다.

## 3. 스크립트 기반 실행 지침 (Terminal Guard)
- 터미널 인라인 일회성 명령(`python -c`, `node -e` 등)을 금지하며, 데이터 처리 및 검증 시 `scripts/` 디렉토리에 정식 스크립트 파일을 작성하여 실행합니다.

## 4. 공학 및 IT 계열 출품작 확대 비활성화 규칙 (IT & Engineering Artwork Zoom Policy)
- **규칙 내용**: `IT·소프트웨어·컴공` 및 `기계·전자·일반공학` 카테고리(컴퓨터공학, 소프트웨어, AI, 전자, 기계 등)에 속한 전시는 출품작 카드 클릭 시 고화질 확대 라이트박스 팝업을 비활성화(`disable_artwork_zoom: true`)합니다.
- **예술/디자인 계열 보존**: 시각, 산업, 패션, 건축, 미술 등 디자인·예술 계열 전시는 고화질 확대 기능이 정상 유지됩니다.
- **구현 방식**: `isArtworkZoomDisabled` 헬퍼 함수([`src/utils/categoryMapper.ts`](file:///c:/Users/graduation_exhibit_workflow/my-exhibit-platform/src/utils/categoryMapper.ts)) 및 DB 메타데이터를 통해 전역 자동 적용됩니다.

