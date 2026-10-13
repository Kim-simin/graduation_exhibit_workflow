# 산학협력 공고 조사 및 로컬 admin 반영

확인 기준일: 2026-10-04 (한국시간). 게시되어 있다는 사실과 학생이 현재 직접 지원할 수 있다는 사실을 구분했다.

| 기관 / 공고 | 확인 결과 | 반영 |
| --- | --- | --- |
| 부산대 캡스톤 일반형 | 학생 대상, 9/28~10/5 접수. 기업연계형과 별도 차수 | 기존 기록 재확인, 모집중 |
| 부산대 기업·지자체연계 캡스톤 | 학생 대상, 10/12~10/19 접수 | 기존 기록 재확인, 모집예정 |
| 부산공유대학 기업 연계 다학제 프로젝트 | 부산지역 4년제 대학 재학생 대상. 9/15 마감 | 기존 기록 재확인, 마감 |
| 인천대 AX산학캡스톤 산업체 제안–학생팀 매칭 | 기업·기관이 신청. 대학이 학생팀 구성. 화면 접수기간 7/20 16:00~12/31 00:00. 8/3 이후 제안은 차기 학기 반영 가능 | 신규 등록, 기업 신청. 학생 직접 신청 목록 제외 |
| 한밭대 학생 과제 현장 실증화 기업지원 2차 | 기업 신청, 상시 접수. 책임교수의 학생 매칭 확약 필요. 10/2 이후 접수는 차기 평가 | 신규 등록, 기업 신청. 학생 직접 신청 목록 제외 |
| 한양대 ERICA 2학기 캡스톤 지원 안내 | 기업연계 신청 양식 있음. 9/25 접수 마감. 상세 자격은 교과목 지침 확인 필요 | 신규 등록, 마감·자격 검토 필요 |
| 인제대 기업연계 의생명 PBL | 공식 학과 홈페이지 검색 색인에서 8/12 게시 및 2~4학년 대상 문구 확인. 상세 페이지 접근 실패, 현재 접수기간 미확인 | 비공개 검토 후보. 공개 공고 영역 제외 |

## 공식 원문

- 부산대: https://cse.pusan.ac.kr/bbs/cse/2056/1462942/artclView.do
- 부산공유대학: https://www.bbits.ac.kr/ko/community/community1/view/998
- 인천대: https://indigo.inu.ac.kr/linc/online/edu_view.do?edu_pbanc_sn=61&search=LzlCdVF0Slk3Ym1vSmVaVS80MHRydXZVckM3WDRQdlYvMTVXNmZDL0dVRjBiazdnNkF5RVo0bkYzeDB2VW1ibg%3D%3D
- 한밭대: https://www.hanbat.ac.kr/prog/bbsArticle/BBSMSTR_000000000050/view.do?mno=sub07_01&nttId=B000000169567Oo1eX5s
- 한양대: https://erica.hanyang.ac.kr/capstone_notice?_kr_ac_hanyang_bbs_web_portlet_BbsPortlet_action=view_message&_kr_ac_hanyang_bbs_web_portlet_BbsPortlet_messageId=226424&p_p_id=kr_ac_hanyang_bbs_web_portlet_BbsPortlet&p_p_lifecycle=0&redirect=%2Fhome
- 인제대 검색 색인 후보: https://bio.inje.ac.kr/bio/index.do?date=2026-07-01

## 적용 범위와 검증

- 로컬 `admin/data/opportunities.json`: 8건에서 12건. 새 공고·후보 4건 추가, 기존 3건 근거·연결 갱신.
- Challenge 페이지의 별도 ‘공식 산학협력 공고’ 영역: 검증된 원문 공고 6건을 학생/기업 신청 및 모집상태와 함께 표시.
- 원문에 없는 기업명, 학과별 정원, 현재 팀원 수, IP·특허 제공 여부는 만들지 않았다. 기존 예시 Challenge와 가짜 학생 카드는 복구하지 않았다.
- 공유자원 페이지는 기존 학생 자격 필터를 유지한다. 기업 대상 2건은 제외 공고, 한양대는 검토 공고, 인제대는 비공개 검토 후보다.
- 공개 웹, 루트 데이터, Vercel에는 이번 변경을 배포하지 않았다.
- 업데이트 스크립트: `scripts/update_admin_industry_notices.py`. 기존 ID로 병합하며 중복과 대상 외 레코드 보존을 검사한다.
- 백업: `outputs/admin-cleanup/opportunities-before-official-research.json`.

조사 범위에서 학생이 지금 신청 가능한 기업연계 PBL 신규 공고는 확정하지 못했다. 이를 공고가 전국적으로 없다는 뜻으로 해석하면 안 된다.
