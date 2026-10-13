# [Codex / Claude Code 인수인계 문서] 산학협력 IP / Challenge 및 공유자원·R&D

이 문서는 **Codex**, **Claude Code**, 또는 다른 AI 코딩 어시스턴트가 본 프로젝트의 **"산학협력 IP / Challenge"** 및 **"공유자원·R&D"** 페이지를 즉각 파악하고 수정·고도화할 수 있도록 작성된 기술 인수인계 및 코드 매핑 가이드입니다.

---

## 1. 프로젝트 구조 및 환경 주의사항 (MANDATORY)

본 프로젝트는 Next.js 기반의 멀티 루트 구조로 분리되어 있습니다:
- **`web/`**: Vercel로 실제 배포되는 **공개 웹 (Public Web)** 서비스 (Next.js App Router)
- **`admin/`**: 관리자 관제 및 미공개/심사 카드 관리용 **관제 시스템 (Admin Platform)** (Next.js App Router)
- **`data/`**: 루트 시드 데이터베이스

> ⚠️ **동기화 원칙 (CRITICAL)**:
> 1. UI 및 비즈니스 로직 수정 시 `web/`과 `admin/`의 대응되는 파일 양쪽에 동일하게 반영해야 합니다.
> 2. JSON 데이터베이스 수정 시 전체 덮어쓰기(`overwrite: true`)를 금지하고, `data/`, `web/data/published/`, `admin/data/` 3곳의 무결성을 동시에 유지해야 합니다.
> 3. 터미널 일회성 인라인 명령어(`python -c`, `node -e` 등)는 금지되며, 데이터 검증/가공은 `scripts/` 디렉토리에 정식 스크립트를 작성하여 실행합니다.

---

## 2. [산학협력 IP / Challenge] 코드 위치 & 상세 스펙

- **라우트 경로**: 
  - 목록 페이지: `/industry-challenges`
  - 상세 페이지: `/industry-challenges/[id]`
- **사이드바 메뉴**: "산학협력 IP" (뱃지: `Challenge`, 아이콘: 🚀)

### 2.1 코드 파일 위치
| 구분 | 파일 경로 | 설명 |
| :--- | :--- | :--- |
| **공개 웹 페이지** | `web/app/industry-challenges/page.tsx` | 챌린지 탐색 메인 (전공 필터 칩, 다학제 모집 카드, 모달 트리거) |
| **공개 웹 상세** | `web/app/industry-challenges/[id]/page.tsx` | 챌린지 상세 (문제정의, 전공별 T/O, 산학 에셋/특허, 신청 CTA) |
| **어드민 웹 페이지** | `admin/app/(public)/industry-challenges/page.tsx` | 어드민 내 챌린지 탐색 페이지 (동일 뷰) |
| **어드민 웹 상세** | `admin/app/(public)/industry-challenges/[id]/page.tsx` | 어드민 내 챌린지 상세 페이지 |
| **공통 컴포넌트** | `web/components/challenge/ChallengeCard.tsx` | 개별 챌린지 카드 UI (상태 뱃지, 전공별 잔여 T/O, 기업 뱃지) |
| | `web/components/challenge/MajorFilterChips.tsx` | 전공 계열별 모집 현황 칩 (CS, 기계, 디자인, 바이오 등) |
| | `web/components/challenge/TeamApplicationModal.tsx` | 다학제 팀 구성 및 지원 모달 (지원 역할 선택, 포트폴리오 첨부) |
| | `web/components/challenge/ResourceDetailModal.tsx` | 기업 제공 데이터셋/특허/브랜드 에셋 상세 뷰어 모달 |
| | `web/components/challenge/ChallengeStickyCTA.tsx` | 하단 고정 플로팅 지원 바 |
| **데이터 파일** | `web/data/published/industry_challenges.json` | 공개 챌린지 데이터셋 (3대 Parent + 10대 Challenge) |
| | `admin/data/industry_challenges.json` | 어드민 챌린지 데이터셋 |
| **유틸리티 & 타입** | `web/lib/challenge.ts`, `admin/lib/challenge.ts` | 챌린지 필터링, 학과별 모집 카운트 함수 |
| | `web/types/challenge.ts`, `admin/types/challenge.ts` | `Challenge`, `MajorRequirement`, `ChallengeResource` 타입 정의 |
| **수정 스크립트** | `scripts/update_challenge_links.mjs` | 공식 공고문, 주관사, 공공데이터셋 링크 일괄 갱신 스크립트 |

### 2.2 이때까지의 수정 내역 (Changelog)
1. **2단계 챌린지 클러스터 구조화**:
   - 상위 대형 R&D 프로젝트(`parentChallenges`: 조선해양 DX, 스마트헬스케어, 스마트시티 UAM) 아래에 세부 산학 과제(`challenges`)를 종속시키는 계층적 데이터 모델 구축.
2. **다학제(Multidisciplinary) 전공별 정원제(Capacity/Current) 도입**:
   - 공학, 디자인, 상경 등 각 전공별 필요 인원(`capacity`)과 현재 참여 인원(`currentMembers`)을 분리하고, 학과 필터 클릭 시 잔여 T/O가 있는 과제를 즉각 필터링하도록 구현.
3. **공식 원천 데이터 링크 연계 (Commit `09da0f0`)**:
   - 가상/데모 링크를 모두 제거하고, 실제 기업 공식 사이트(HD현대, 삼성중공업, 한화시스템, 서울아산병원 등)와 공공 데이터셋(AIHub, KIPRIS 특허, data.go.kr)으로 전면 교체.
4. **네비게이션 및 CTA 정리 (Commit `5088615`)**:
   - 사이드바 및 모바일 헤더에 중복되던 산학협력 제안서 제출 CTA를 정리하고 챌린지 탐색 본연의 UX로 집중.

---

## 3. [공유자원·R&D] 코드 위치 & 상세 스펙

- **라우트 경로**: `/opportunities`
- **사이드바 메뉴**: "공유자원·R&D" (뱃지: `실시간`, 아이콘: 🧭)

### 3.1 코드 파일 위치
| 구분 | 파일 경로 | 설명 |
| :--- | :--- | :--- |
| **공개 웹 페이지** | `web/app/opportunities/page.tsx` | 3대 핵심 카테고리(PROJECT, COMPETITION, FACILITY) 탭 및 필터 |
| **어드민 웹 페이지** | `admin/app/(public)/opportunities/page.tsx` | 어드민 내 공유자원 탐색 페이지 |
| **카드 컴포넌트** | `web/components/opportunity/ProjectCard.tsx` | 프로젝트 카드 (Type 뱃지: [R&D], [PBL], [산학과제] 등 + 모집 상태) |
| | `web/components/opportunity/CompetitionCard.tsx` | 공모전/해커톤 카드 (주관, 상금/특전, 마감 D-day) |
| | `web/components/opportunity/FacilityCard.tsx` | 공용 장비/연구시설 카드 (장소, 사용료, 예약 링크) |
| | `web/components/opportunity/ResourceDetailModal.tsx` | 상세 정보 팝업 모달 (지원자격 검증 근거 및 공식 원문 링크 노출) |
| **데이터 파일** | `data/opportunities.json` | 루트 Opportunities 원본 데이터베이스 |
| | `web/data/published/opportunities.json` | 공개 Opportunities 데이터베이스 |
| | `admin/data/opportunities.json` | 어드민 Opportunities 데이터베이스 |
| | `data/equipment.json`, `web/data/published/equipment.json` | 57개 공용 연구장비/시설 원천 데이터 |
| **유틸리티 & 타입** | `web/lib/opportunity.ts`, `admin/lib/opportunity.ts` | `categorizeOpportunity`, `isStudentEligibleOpportunity`, `getNormalizedFacilities` |
| | `web/lib/student-rnd.ts`, `admin/lib/student-rnd.ts` | 학생 R&D 모집 기한 실시간 계산 및 검증 함수 |
| | `web/types/opportunity.ts`, `admin/types/opportunity.ts` | `Opportunity`, `FacilityItem`, `CoreCategory`, `RecruitmentEvidence` |
| **검증 스크립트** | `scripts/apply_student_eligibility_gate.py` | 학생 적격성 게이트(Student Eligibility Gate) 자동 검증 및 적용 스크립트 |
| | `scripts/audit_student_eligibility.py` | 공고 적격성 전수 감사 스크립트 |
| | `scripts/test_opportunity_integrity.py` | 기한 및 스키마 무결성 검증 테스트 |

### 3.2 이때까지의 수정 내역 (Changelog)
1. **정보 구조 전면 개편 (3대 핵심 카테고리 통합)**:
   - 기존의 중복된 4개 영역(내 전공 자원, R&D, 모집중 프로젝트, 장비·시설)을 전면 제거.
   - 사용자 관점에서 명확한 3대 탭으로 재구성:
     1. **`PROJECT` (프로젝트)**: 기업 산학협력과제, R&D 학생 참여과제, 기업연계 PBL, 캡스톤 프로젝트, 현장실습
     2. **`COMPETITION` (공모전)**: 공모전, 경진대회, 해커톤, 아이디어톤, 기업 Challenge
     3. **`FACILITY` (장비·시설)**: 메이커스페이스, 공용 연구장비(ZEUS 연계), 시제품 제작소
2. **학생 적격성 게이트(Student Eligibility Gate) 도입**:
   - 일반 정규직/계약직/위촉직 채용, 기업 대상 정부 지원사업, 대학원생 전용 공고 등 학생이 지원 불가능한 공고 44건 전면 제외(`excluded` 처리).
   - 공식 원문에서 **"대학생/학부생/재학생 직접 지원 가능"** 문구가 확인된 프로그램만 통과(`studentEligibilityVerified: true`, `eligibilityStatus: "verified"`).
3. **통일된 모집 상태 및 Type 뱃지 체계 구축**:
   - 상태 뱃지: `[모집중]`, `[상시모집]`, `[모집예정]`, `[마감]` (클라이언트 시간 기준 실시간 D-day 계산)
   - 유형 뱃지: `[R&D 학생 참여과제]`, `[기업 산학협력과제]`, `[PBL]`, `[현장실습]`, `[캡스톤 프로젝트]` 등

---

## 4. 정보 수집 출처 & 외부 링크 레퍼런스

### 4.1 산학협력 IP / Challenge 데이터 출처
| 기관/기업 | 관련 챌린지 | 공식 웹사이트 / 데이터셋 링크 |
| :--- | :--- | :--- |
| **HD현대 / 한국조선해양** | 선박 설계 도면 OCR/LLM | [HD현대 디지털 혁신](https://www.hd-hyundai.com/innovation/digital), [한국조선해양](https://www.ksoe.co.kr/business/digital) |
| **삼성중공업** | 밀폐구역 안전 IoT 모니터링 | [삼성중공업 ESG 안전경영](https://www.samsungshi.com/Kor/business/esg_safety.aspx) |
| **서울아산병원 / 루닛** | 낙상 방지 비전 AI | [서울아산병원 연구원](https://www.amc.seoul.kr/research/), [Lunit 공식](https://www.lunit.io/ko) |
| **유한양행** | 만성질환 케어 라이프로그 | [유한양행 R&D 파이프라인](https://www.yuhan.co.kr/RND/Pipeline/) |
| **현대로보틱스** | 격리병동 자율방역 로봇 | [현대로보틱스 서비스로봇](https://www.hyundai-robotics.com/product/product_list.html?cate=service) |
| **현대건설** | 스마트빌딩 BEMS 에너지 최적화 | [현대건설 지속가능경영](https://www.hdec.kr/kr/esg/sustainability.aspx) |
| **SK에코플랜트** | 폐배터리 리사이클링 안전 공정 | [SK에코플랜트 에코서큘러](https://www.skecoplant.com/business/eco-circuler) |
| **한화시스템** | UAM 버티포트 공간 UX | [한화시스템 UAM 사업](https://www.hanwhasystems.com/kr/business/new_business/uam.do) |
| **USG 공유대학 / DSC 공유대학** | 조선해양 클러스터 / 스마트시티 | [USG 공유대학](https://www.usg.ac.kr/), [DSC 공유대학](https://dscu.ac.kr/) |
| **AIHub (한국지능정보사회진흥원)** | 선박도면, 헬스케어 비전 데이터 | [AIHub 포털](https://aihub.or.kr/) (데이터셋 번호: 71452, 71441, 71477 등) |
| **특허청 KIPRIS** | 공개 특허 및 기술 문서 | [KIPRIS 특허정보검색](https://www.kipris.or.kr/) |
| **연구장비포털 ZEUS** | 공용 연구장비 및 시설 인프라 | [ZEUS 연구장비예약](https://www.zeus.go.kr/) |
| **공공데이터포털** | 산업안전 및 기상/환경 데이터 | [data.go.kr](https://www.data.go.kr/) |

### 4.2 공유자원·R&D 데이터 출처 및 검증 채널
| 출처 기관 | 수집 대상 프로그램 | 공식 수집 링크 |
| :--- | :--- | :--- |
| **부산공유대학 (BBITS)** | 14개 대학 다학제 융합 프로젝트 | [BBITS 공지사항](https://www.bbits.ac.kr/ko/community/community1/view/998) |
| **부산대학교** | 글로벌 AX PBL, 공과대학 캡스톤 | [부산대 대표공지](https://www.pusan.ac.kr/kor/CMS/Board/Board.do?board_seq=1511038), [부산대 CSE 게시판](https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do) |
| **국가과학기술연구회 (NST)** | 정부출연연구기관 학부연구생/인턴 | [NST 채용/연수공고](https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61) |
| **국가연구개발사업 (NTIS)** | 국가 R&D 과제 및 참여 공고 | [NTIS 과제검색](https://www.ntis.go.kr/ThSearchProjectList.do) |
| **IRIS** | 범부처 국가R&D 사업 공고 | [IRIS 사업공고](https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do) |
| **UniAll** | 대학 지원사업 및 공유 프로그램 | [UniAll 사업단 목록](https://uniall.nrf.re.kr/biz/bizteam/list.do) |
| **ICT학점연계 인턴십** | 학점 인정 프로젝트 실습 | [ICT인턴십 공지](https://ictintern.or.kr/homepage/notice/noticeList.do) |
| **부산정보산업진흥원** | 구글 x 부산 제미나이 AI 아카데미 | [부산IT 포털](https://www.busanit.or.kr/) |

---

## 5. Codex / Claude Code 수정 작업 시 체크리스트

1. **새로운 챌린지 또는 공고 추가 시**:
   - `web/data/published/`와 `admin/data/`, `data/` 파일에 동일하게 데이터 객체를 추가할 것.
   - 챌린지: `majorRequirements`에 최소 2개 이상의 전공(`capacity`, `currentMembers`)을 정의할 것.
   - 프로젝트: `studentEligibilityVerified: true`, `eligibilityStatus: "verified"` 필드를 명시하고 `officialSourceUrl` 및 `eligibilityEvidence`를 기록할 것.
2. **UI 스타일 수정 시**:
   - `web/`과 `admin/` 컴포넌트 양쪽 모두를 열어 동일하게 수정할 것.
3. **수정 완료 후 빌드 검증**:
   ```bash
   npm run build:web
   ```
   오류 없이 빌드가 통과하는지 반드시 확인할 것.
