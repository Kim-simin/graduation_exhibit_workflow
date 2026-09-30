import type { Opportunity, OpportunityStatus } from "@/types/opportunity";

const DAY_MS = 86_400_000;
const STUDENT_AUDIENCES = ["대학생", "학부생", "재학생", "학부연구생", "학생연구원", "연구인턴", "근로연구학생"];
const INSTITUTE_DOMAINS = ["krict.re.kr", "kist.re.kr", "kaeri.re.kr", "kribb.re.kr", "kimm.re.kr", "etri.re.kr", "kriss.re.kr", "kier.re.kr", "kitech.re.kr", "kisti.re.kr", "kigam.re.kr", "kiom.re.kr", "kari.re.kr", "kasi.re.kr", "kfri.re.kr", "kbsi.re.kr", "kims.re.kr", "keri.re.kr", "krri.re.kr", "kict.re.kr"];

/** Date-only deadlines include the full KST day; malformed dates never mean rolling admission. */
export function parseRecruitmentDate(value?: string | null, endOfDay = false): number | null {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const calendar = new Date(Date.UTC(+year, +month - 1, +day));
  if (calendar.getUTCFullYear() !== +year || calendar.getUTCMonth() !== +month - 1 || calendar.getUTCDate() !== +day) return null;
  let iso = value;
  if (value.length === 10) iso += endOfDay ? "T23:59:59.999+09:00" : "T00:00:00+09:00";
  else if (!/(Z|[+-]\d{2}:\d{2})$/i.test(iso)) iso += "+09:00";
  const time = Date.parse(iso);
  return Number.isFinite(time) ? time : null;
}

export function calculateRecruitmentStatus(
  recruitmentStartAt?: string | null,
  recruitmentEndAt?: string | null,
  referenceTimeStr = new Date().toISOString(),
  rollingAdmission = false,
): { status: OpportunityStatus; dDay: string } {
  const now = parseRecruitmentDate(referenceTimeStr);
  const start = parseRecruitmentDate(recruitmentStartAt);
  const end = parseRecruitmentDate(recruitmentEndAt, true);
  if (now === null || (recruitmentStartAt && start === null) || (recruitmentEndAt && end === null) || (start !== null && end !== null && start > end)) {
    return { status: "UNKNOWN", dDay: "모집기간 확인 필요" };
  }
  if (start !== null && now < start) return { status: "UPCOMING", dDay: `시작 D-${Math.ceil((start - now) / DAY_MS)}` };
  if (end !== null && now > end) return { status: "CLOSED", dDay: "마감" };
  if (end !== null) {
    const days = Math.floor((end - now) / DAY_MS);
    return { status: "OPEN", dDay: days === 0 ? "오늘 마감" : `D-${days}` };
  }
  return rollingAdmission ? { status: "OPEN", dDay: "상시" } : { status: "UNKNOWN", dDay: "모집기간 확인 필요" };
}

function hostMatches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

function isOfficialRecruitmentDetail(opportunity: Opportunity, now: number): boolean {
  const evidence = opportunity.recruitmentEvidence;
  if (!evidence || evidence.isOfficialDetail !== true) return false;
  const verified = parseRecruitmentDate(evidence.verifiedAt);
  if (verified === null || verified > now) return false;
  try {
    if (typeof evidence.sourceUrl !== "string" || /[\s<>\[\]()`\\]/.test(evidence.sourceUrl) || (evidence.sourceUrl.match(/https?:\/\//gi) || []).length !== 1) return false;
    const url = new URL(evidence.sourceUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    const path = url.pathname.toLowerCase();
    if (path === "/" || /(?:^|\/)(?:index|main)(?:\.[a-z]+)?\/?$/.test(path) || /list(?:view)?(?:\.[a-z]+)?\/?$/.test(path)) return false;
    if (evidence.sourceKind === "NST") return hostMatches(url.hostname, "nst.re.kr");
    if (evidence.sourceKind === "UNIVERSITY_OFFICIAL") return url.hostname.endsWith(".ac.kr");
    return evidence.sourceKind === "RESEARCH_INSTITUTE_OFFICIAL" && INSTITUTE_DOMAINS.some(domain => hostMatches(url.hostname, domain));
  } catch {
    return false;
  }
}

/** Re-evaluate evidence on read so stale stored flags cannot publish a project or expired notice. */
export function evaluateStudentRnD(opportunity: Opportunity, referenceTimeStr = new Date().toISOString()) {
  const evidence = opportunity.recruitmentEvidence;
  const now = parseRecruitmentDate(referenceTimeStr);
  const audience = Array.isArray(opportunity.eligibleAudience) ? opportunity.eligibleAudience.filter((value): value is string => typeof value === "string") : [];
  const text = (typeof evidence?.eligibilityText === "string" ? evidence.eligibilityText : "").replace(/\s+/g, "").toLowerCase();
  const explicitStudent = /대학생|학부생|학부연구생|학부연구원|대학재학생|undergraduate/.test(text);
  const excluded = /(?:대학생|학부생|학부연구생|학부연구원|대학재학생|undergraduate).{0,12}(?:지원불가|제외|불가|아님|지원할수없|참여할수없|모집하지않)/.test(text);
  const studentParticipationVerified = audience.some(value => STUDENT_AUDIENCES.some(token => value.includes(token))) && explicitStudent && !excluded;
  const officialSourceVerified = now !== null && isOfficialRecruitmentDetail(opportunity, now);
  const verified = parseRecruitmentDate(evidence?.verifiedAt);
  const recruitmentText = typeof evidence?.recruitmentText === "string" ? evidence.recruitmentText : "";
  const rolling = evidence?.rollingAdmission === true && /상시|수시|채용\s*시|충원\s*시/.test(recruitmentText) && now !== null && verified !== null && now >= verified && now - verified <= 30 * DAY_MS;
  let calculated = calculateRecruitmentStatus(opportunity.recruitmentStartAt, opportunity.recruitmentEndAt, referenceTimeStr, rolling);
  if (!/모집|접수|지원|채용|recruit|application/i.test(recruitmentText)) calculated = { status: "UNKNOWN", dDay: "모집기간 확인 필요" };
  if (opportunity.recruitmentStatus === "CLOSED" || opportunity.status === "CLOSED") calculated = { status: "CLOSED", dDay: "마감" };
  return { eligibleAudience: audience, studentParticipationVerified, officialSourceVerified, recruitmentStatus: calculated.status, dDayText: calculated.dDay };
}

export function isStudentRnDOpportunity(opportunity: Opportunity, referenceTimeStr = new Date().toISOString()): boolean {
  if (opportunity.type !== "RND" || opportunity.approvalStatus !== "PUBLISHED") return false;
  const checked = evaluateStudentRnD(opportunity, referenceTimeStr);
  return checked.studentParticipationVerified && checked.officialSourceVerified && checked.recruitmentStatus === "OPEN";
}
