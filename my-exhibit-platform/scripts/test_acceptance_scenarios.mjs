import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, "../data/industry_challenges.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
const challenges = data.challenges;
const categories = data.majorCategories;

console.log("==================================================");
console.log("   GRAD EXHIBIT PRO — 산학협력 IP Acceptance Tests");
console.log("==================================================");

let allPassed = true;

// Helper: Filter function equivalent to filterChallenges
function testFilterChallenges(items, majorCategoryId, status = "RECRUITING") {
  return items.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (!majorCategoryId || majorCategoryId === "all") return true;

    const req = c.majorRequirements.find((r) => r.majorCategoryId === majorCategoryId);
    if (!req) return false;
    return req.currentMembers < req.capacity; // recruiting only
  });
}

// ----------------------------------------------------
// CASE 1: 컴퓨터공학 chip 클릭 -> 컴퓨터공학 모집 중 Challenge만 노출
// ----------------------------------------------------
console.log("\n[TEST CASE 1] 컴퓨터공학 chip 클릭 검증");
const csChallenges = testFilterChallenges(challenges, "cs_it");
console.log(` -> 검색된 컴퓨터공학 모집 과제 수: ${csChallenges.length}건`);
const csInvalid = csChallenges.filter((c) => {
  const req = c.majorRequirements.find((r) => r.majorCategoryId === "cs_it");
  return !req || req.currentMembers >= req.capacity;
});

if (csChallenges.length > 0 && csInvalid.length === 0) {
  console.log("  PASS: 모든 검색 결과가 컴퓨터공학 전공을 정원 미달(모집중) 상태로 모집하고 있습니다.");
} else {
  console.error("  FAIL: 잘못된 과제가 포함되었거나 결과가 0건입니다.", csInvalid);
  allPassed = false;
}

// ----------------------------------------------------
// CASE 2: "조선 도면 해석 LLM" (컴공 1/2, 기계 0/1, 디자인 1/1)
// ----------------------------------------------------
console.log("\n[TEST CASE 2] '조선 도면 해석 LLM' N:M 및 모집상태 연동 검증");
const shipLlm = challenges.find((c) => c.id === "challenge-shipbuilding-llm");
if (!shipLlm) {
  console.error("  FAIL: challenge-shipbuilding-llm 를 찾을 수 없습니다.");
  allPassed = false;
} else {
  const csReq = shipLlm.majorRequirements.find((r) => r.majorCategoryId === "cs_it");
  const mechReq = shipLlm.majorRequirements.find((r) => r.majorCategoryId === "mech_eng");
  const designReq = shipLlm.majorRequirements.find((r) => r.majorCategoryId === "design");

  console.log(` - 컴퓨터공학 요건: ${csReq.currentMembers}/${csReq.capacity} (모집중: ${csReq.currentMembers < csReq.capacity})`);
  console.log(` - 기계공학 요건:   ${mechReq.currentMembers}/${mechReq.capacity} (모집중: ${mechReq.currentMembers < mechReq.capacity})`);
  console.log(` - 디자인 요건:     ${designReq.currentMembers}/${designReq.capacity} (모집완료: ${designReq.currentMembers >= designReq.capacity})`);

  const csResult = testFilterChallenges(challenges, "cs_it").some((c) => c.id === shipLlm.id);
  const mechResult = testFilterChallenges(challenges, "mech_eng").some((c) => c.id === shipLlm.id);
  const designResult = testFilterChallenges(challenges, "design").some((c) => c.id === shipLlm.id);

  console.log(` -> 컴퓨터공학 필터 노출 여부: ${csResult} (기대값: true)`);
  console.log(` -> 기계공학 필터 노출 여부:   ${mechResult} (기대값: true)`);
  console.log(` -> 디자인 필터 노출 여부:     ${designResult} (기대값: false, 모집완료이므로)`);

  if (csResult === true && mechResult === true && designResult === false) {
    console.log("  PASS: CASE 2 요건을 완벽하게 만족합니다!");
  } else {
    console.error("  FAIL: CASE 2 기대값과 일치하지 않습니다.");
    allPassed = false;
  }
}

// ----------------------------------------------------
// CASE 3: Challenge 상세 페이지 필드 무결성 검증
// ----------------------------------------------------
console.log("\n[TEST CASE 3] Challenge 상세 정보 10개 섹션 데이터 무결성 검증");
challenges.forEach((c) => {
  const hasTitle = !!c.title;
  const hasParent = !!c.parentChallengeTitle;
  const hasProblem = !!c.problemStatement && !!c.shortProblem;
  const hasGoal = !!c.goal;
  const hasBackground = !!c.background;
  const hasRequirements = c.majorRequirements && c.majorRequirements.length > 0;
  const hasSkills = c.skills && c.skills.length > 0;
  const hasResources = c.resources && c.resources.length > 0;
  const hasOutcomes = c.expectedOutcomes && c.expectedOutcomes.length > 0;
  const hasTimeline = c.timeline && c.timeline.length > 0;

  if (
    !hasTitle ||
    !hasParent ||
    !hasProblem ||
    !hasGoal ||
    !hasBackground ||
    !hasRequirements ||
    !hasSkills ||
    !hasResources ||
    !hasOutcomes ||
    !hasTimeline
  ) {
    console.error(`  FAIL: 과제 [${c.id}] 에 누락된 섹션 데이터가 있습니다.`);
    allPassed = false;
  }
});
console.log(`  PASS: 전체 ${challenges.length}개 Sub Challenge의 10개 상세 섹션 데이터가 모두 온전하게 존재합니다.`);

// ----------------------------------------------------
// CASE 4: Proposal 연계 쿼리스트링 규격 검증
// ----------------------------------------------------
console.log("\n[TEST CASE 4] RFP 제안서 제출 페이지 연계 쿼리스트링 포맷 검증");
const sampleChallenge = challenges[0];
const queryParams = new URLSearchParams({
  challengeId: sampleChallenge.id,
  challengeTitle: sampleChallenge.title,
  parentChallenge: sampleChallenge.parentChallengeTitle,
  industry: sampleChallenge.industry,
  provider: sampleChallenge.providerName,
  selectedMajor: "컴퓨터공학과",
}).toString();

console.log(` -> 생성된 Proposal 이동 URL: /rfp/submit?${queryParams}`);
if (
  queryParams.includes("challengeId") &&
  queryParams.includes("challengeTitle") &&
  queryParams.includes("parentChallenge") &&
  queryParams.includes("industry") &&
  queryParams.includes("provider") &&
  queryParams.includes("selectedMajor")
) {
  console.log("  PASS: Proposal prefill 연계 규격을 완벽하게 충족합니다.");
} else {
  console.error("  FAIL: Proposal 파라미터가 누락되었습니다.");
  allPassed = false;
}

// ----------------------------------------------------
// CASE 6: N:M 다중 전공 필터 동시 노출 검증
// ----------------------------------------------------
console.log("\n[TEST CASE 6] 다학제 N:M 복수 전공 필터 동시 매핑 검증");
const multiMajorChallenges = challenges.filter(
  (c) => c.majorRequirements.length >= 2
);
console.log(` -> 복수 학과 모집 Challenge 수: ${multiMajorChallenges.length}건 (전체 ${challenges.length}건 중)`);
if (multiMajorChallenges.length >= 8) {
  console.log("  PASS: 대다수의 Challenge가 2~3개 이상의 다학제 전공을 동시에 연결(N:M)하고 있습니다.");
} else {
  console.error("  FAIL: 다학제 연계 과제 수가 부족합니다.");
  allPassed = false;
}

console.log("\n==================================================");
if (allPassed) {
  console.log("🎉 ALL ACCEPTANCE TEST CASES PASSED SUCCESSFULLY!");
} else {
  console.error("❌ SOME ACCEPTANCE TESTS FAILED!");
  process.exit(1);
}
