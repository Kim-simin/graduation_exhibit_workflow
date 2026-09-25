---
description: 대학교 카드 내 학생 출품작 등록 시 상위 학부명이 아닌 세부 학과명(예: VISUAL DESIGN과, INDUSTRIAL DESIGN과) 표기 의무 규칙
globs: ["data/**", "scripts/**", "my-exhibit-platform/**"]
---

# 학생 출품작 상세 학과명(Detailed Department) 기재 의무 규칙

## 1. 배경 및 목적
- 대학교 카드 내 학생 출품작 갤러리 카드 상단 배지에 상위 학부명(예: `디자인이노베이션전...`)이 축약 노출되어 어떤 세부 전공 분야의 작품인지 식별하기 어려운 문제를 해결합니다.
- 다음 대학교 카드 아카이브 작업부터는 학생 작품 수집 및 큐 등록 시, 작품별로 **상세 학과명/세부 전공명(예: VISUAL DESIGN과, INDUSTRIAL DESIGN과, 시각디자인과, 산업디자인과 등)**을 반드시 기재하도록 강제합니다.

## 2. 필수 데이터 스키마 규칙
1. `artworks` 배열 내 각 출품작 객체에 `department` (또는 `sub_department`) 필드를 필수로 포함합니다:
   ```json
   {
     "title": "[Identity Design] GOLDFISH SYNDROME",
     "student_name": "홍길동",
     "department": "VISUAL DESIGN과",
     "image": "uploads/...",
     "thumbnail": "uploads/...",
     "description": "...",
     "inferred_role": "시각디자이너"
   }
   ```
2. 대학의 전공 체계가 융합/통합 학부(예: 디자인학부, 디자인이노베이션전공, 창의소프트학부 등)인 경우:
   - 해당 작품이 속한 세부 트랙/전공을 공식 사이트 카테고리에서 식별하여 정규화합니다:
     - 시각디자인/아이덴티티/미디어 계열 ➔ `"VISUAL DESIGN과"` (또는 `"시각디자인과"`)
     - 제품/운송/시스템디자인 계열 ➔ `"INDUSTRIAL DESIGN과"` (또는 `"산업디자인과"`)
     - 인터랙션/UX 계열 ➔ `"UX/UI DESIGN과"` (또는 `"인터랙션디자인과"`)
3. 프론트엔드 UI 컴포넌트(`exhibition-detail-modal.tsx`)는 카드 상단 배지에서 `art.department || department`를 우선 렌더링하며, 배지 너비가 잘리지 않도록 유지합니다.

## 3. 적용 시점 (Constraint)
- **현재 기존 작업(세종대 등 이전 완료 카드)은 임의로 수정하지 않으며**,
- **다음(차기) 대학교 카드 리서치 및 아카이브 추가 작업부터 무조건 고정 적용**합니다.
