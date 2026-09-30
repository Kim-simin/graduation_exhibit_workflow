import { isStudentRnDOpportunity, evaluateStudentRnD } from "../lib/student-rnd.ts";

const sample = {
  type: "RND",
  title: "[한국에너지기술연구원] 2026년도 학생연구원(학부생) 채용 공고",
  providerName: "한국에너지기술연구원",
  approvalStatus: "PUBLISHED",
  sourceUrl: "https://www.nst.re.kr/www/selectBbsNttView.do?key=61&bbsNo=19&nttNo=52276",
  eligibleAudience: ["대학생", "학부생", "학생연구원"],
  recruitmentStartAt: "2026-09-29T09:00:00+09:00",
  recruitmentEndAt: "2026-10-13T18:00:00+09:00",
  recruitmentEvidence: {
    sourceUrl: "https://www.kier.re.kr/board/view?linkId=262688&menuId=MENU00459",
    sourceKind: "RESEARCH_INSTITUTE_OFFICIAL",
    isOfficialDetail: true,
    eligibilityText: "지원자격: 에너지·화공·기계 전공 대학생 및 학부생",
    recruitmentText: "원서 접수 및 지원 모집: 2026. 9. 29. ~ 10. 13.",
    verifiedAt: new Date().toISOString(),
    rollingAdmission: false
  }
};

const evalRes = evaluateStudentRnD(sample);
console.log("TS evaluateStudentRnD:", evalRes);
console.log("TS isStudentRnDOpportunity:", isStudentRnDOpportunity(sample));
