# 학생 참여 R&D 수집·검증 운영

공식 출처에서 과제를 발견하는 단계와 학생이 실제 지원할 수 있는지 확인하는 단계를 분리한다. 지역, 대학, 학과·전공, 참여 자격은 각각 저장하며, 특정 지역이나 대학 소속이라는 이유만으로 참여 자격을 추정하지 않는다.

## 공식 Source와 역할

| Source | 역할 | 다음 확인 대상 |
| --- | --- | --- |
| NTIS 과제 검색·R&D 공고 | 국가 R&D 과제와 사업 발견 | 실제 학생 모집공고 |
| IRIS | 사업공고 발견 | 실제 학생 모집공고 |
| NST | 출연연 학생연구원·인턴 모집 후보 발견 | 연구기관 공식 상세 모집요강 |
| 대학알리미 | 대학과 공식 홈페이지 발견 | 대학·학과·연구실·산학협력단·연구지원부서 공식 모집공고 |
| 연구기관 개별 채용페이지(KRICT 등) | 지원 자격·접수 기간 원문 검증 | 해당 모집공고의 상세 페이지·공식 첨부 모집요강 |
| ICT 학점연계 프로젝트 인턴십 | 인턴십 후보 발견 | 대학생 지원 자격과 연구 활동 여부가 명시된 상세 모집요강 |
| UniAll 사업단·공고 | 대학 지원사업과 공유 프로그램 발견 | 프로그램 상세 조건 |
| ZEUS·e-Tube | 연구장비·시설 발견 | 시설 이용 조건·예약 상세 |
| K-Startup | 창업 지원사업 발견 | 사업별 지원 자격·접수 기간 |

등록 URL은 아래 순수 URL을 사용한다. 추적용 `utm_*`는 제거하되 `bbsNo`, `key` 등 게시판을 식별하는 쿼리는 보존한다. 목록·포털 주소 자체는 학생 모집 검증 근거가 아니다.

```text
https://www.nst.re.kr/www/selectBbsNttList.do?bbsNo=19&key=61
https://www.academyinfo.go.kr/
https://school.krict.re.kr/prog/jobOffer/kor/sub04_04_02/list.do
https://ictintern.or.kr/homepage/notice/noticeList.do
https://www.ntis.go.kr/ThSearchProjectList.do
https://www.ntis.go.kr/rndgate/eg/un/ra/mng.do
https://www.iris.go.kr/contents/retrieveBsnsAncmListView.do
https://uniall.nrf.re.kr/biz/bizteam/list.do
https://uniall.nrf.re.kr/biz/pbanc/list.do
https://www.zeus.go.kr/resv/organ/sortView
https://www.etube.re.kr/
https://www.k-startup.go.kr/
```

NST 수집 키워드: 학생연구원, 학부연구생, 연구인턴, 학생인턴, 근로연구학생, 학연협동, 연수직.

대학 공식 공고 수집 키워드: 학부연구생, 학부 연구생, 학부연구원, 학생연구원, 연구인턴, 연구실 인턴, URP, Undergraduate Research, 학생 연구 참여, 연구 참여 학생 모집.

## 공개 판정

「지금 참여 가능한 R&D」에는 R&D 유형으로 분류되고 공개 승인된 항목 중 다음 조건을 모두 만족하는 모집공고만 표시한다.

1. 공식 상세 원문에서 학생 참여 자격이 확인되어 `studentParticipationVerified`가 참이다.
2. 검증 근거가 공식 모집공고임을 확인하여 `officialSourceVerified`가 참이다.
3. 현재 시각과 모집 기간을 비교한 `recruitmentStatus`가 `OPEN`이다.

역할명이나 제목에 `연구인턴`, `학생연구원`이 있다는 것만으로 일반 학부생의 지원 자격을 추정하지 않는다. 대학원생만 지원 가능한 공고, 자격이 불분명한 공고, 시작 전·마감된 공고는 이 영역에서 제외한다. 마감일 누락은 자동으로 상시 모집을 의미하지 않는다.

NTIS/IRIS에서 과제가 발견되어도 학생 모집 원문이 없으면 일반 R&D 정보로 보존한다. 장비 이용 안내, 산학협력 협약, 사업단 소개 역시 학생 모집공고로 승격하지 않는다. 확인되지 않은 항목으로 카드 수를 채우지 않으며, 검증된 공고가 없을 때 0건은 정상 결과다.

## 등록과 검증 실행

Source 설정은 `research/opportunity_sources.py`, 학생 R&D 판정은 `research/opportunity_eligibility.py`에서 관리한다. 수집기나 검수자가 확보한 후보 JSON을 등록 스크립트에 전달한다.

후보에는 기존 Opportunity 필드 외에 다음 검증 정보를 포함한다. 지역·대학·전공 필드를 참여 자격 텍스트로 대체하지 않는다.

| 필드 | 입력 기준 |
| --- | --- |
| `eligibleAudience` | 원문에서 확인한 지원 대상 배열 |
| `recruitmentEvidence.sourceUrl` | 모집 상세 원문 URL |
| `recruitmentEvidence.sourceKind` | `NST`, `UNIVERSITY_OFFICIAL`, `RESEARCH_INSTITUTE_OFFICIAL` 중 실제 원문 종류 |
| `recruitmentEvidence.isOfficialDetail` | 공식 상세 모집요강을 확인한 경우에만 `true` |
| `recruitmentEvidence.eligibilityText` | 학생 지원 자격과 제한 사항을 포함한 원문 문장 |
| `recruitmentEvidence.recruitmentText` | 모집·접수 기간의 원문 문장 |
| `recruitmentEvidence.verifiedAt` | 해당 원문을 확인한 실제 시각(시간대 포함) |
| `recruitmentStartAt`, `recruitmentEndAt` | 원문의 접수 시작·종료 시각 |
| `recruitmentEvidence.rollingAdmission` | 원문에 상시·수시 모집 등이 명시된 경우에만 `true` |

검증 플래그는 등록 시 다시 계산한다. 호출자가 `studentParticipationVerified: true`만 전달해서 공개 조건을 통과할 수는 없다. 상시 모집은 최근 30일 이내 확인한 근거가 있어야 하며, 기간이 지난 근거는 원문을 다시 확인한다. 이 판정기는 입력된 원문 근거를 검사하지만 원문을 대신 내려받지는 않는다.

```powershell
py -3 scripts/register_opportunities_and_equipment.py --list-sources
py -3 scripts/register_opportunities_and_equipment.py --input 후보파일.json --dry-run
py -3 scripts/register_opportunities_and_equipment.py --input 후보파일.json
py -3 scripts/test_opportunity_integrity.py
```

먼저 `--dry-run` 결과와 원문 근거를 확인한 뒤 같은 입력을 등록한다. 기존 레코드와 식별키를 대조하여 UPSERT하며, 판정 실패 사유도 함께 확인한다. 기존 장비·교수·학생·졸업전시 DB를 초기화하거나 검증 실패 항목을 일괄 삭제하지 않는다. 루트와 플랫폼의 opportunities JSON에 반영된 결과가 이용자 화면의 공통 판정을 통과해야 한다.

이 작업은 Source 역할 설정, 후보 등록 경로, 공개 판정 기준을 제공한다. Source 등록만으로 전국 사이트 순회·첨부파일 해석·예약 실행이 시작되지는 않는다. 실제 자동 수집에는 각 사이트의 목록·상세 수집기와 원문 증거를 생산하는 작업을 이 등록 경로에 연결해야 한다. 기존 `CooperationCrawler`의 합성 HTML이나 사전 작성 협력 사례는 학생 모집 증거로 사용하지 않는다.
