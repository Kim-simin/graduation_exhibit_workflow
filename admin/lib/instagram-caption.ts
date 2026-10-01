import { Exhibition } from "./get-exhibitions";

export function formatDateHashtag(dateStr?: string, year?: string): string {
  if (!dateStr || dateStr.includes("일정 공지 대기") || dateStr.includes("미정")) {
    const cleanYear = (year || "2025").replace(/[^0-9]/g, "");
    return `#${cleanYear || "2025"}년졸업전시`;
  }

  // 숫자만 추출
  const numbers = dateStr.replace(/[^0-9]/g, "");

  // YYYYMMDDMMDD (12자리) -> YYYYMMDD_MMDD (예: "2025.11.12 ~ 11.18" -> "20251112_1118")
  if (numbers.length === 12) {
    return `#${numbers.slice(0, 8)}_${numbers.slice(8, 12)}`;
  }

  // YYYYMMDDYYYYMMDD (16자리) -> YYYYMMDD_MMDD (예: "2026.11.12 - 2026.11.18" -> "20261112_1118")
  if (numbers.length === 16) {
    return `#${numbers.slice(0, 8)}_${numbers.slice(12, 16)}`;
  }

  // 8자리 이상인 경우 그대로 반환
  if (numbers.length >= 8) {
    return `#${numbers.slice(0, 12)}`;
  }

  // 기타 문자열 정제
  const cleaned = dateStr.replace(/\s+/g, "_").replace(/[^0-9a-zA-Z가-힣_]/g, "");
  return cleaned ? `#${cleaned}` : (year ? `#${year}년졸업전시` : "#졸업전시");
}

export function generateInstagramCaption(card: any): string {
  if (!card) return "";

  const univ = (card.university || "대학교").trim();
  const dept = (card.department || "디자인학과").trim();
  const title = (card.title || "졸업전시회").trim();
  const rawSubtitle = card.slogan || card.subtitle || "";
  const subtitle = rawSubtitle ? `\n✨ 전시 슬로건: ${rawSubtitle.trim()}` : "";
  const rawSchedule = card.schedule || card.period || card.dateRange || "";
  const schedule = rawSchedule ? `\n📅 전시 기간: ${rawSchedule.trim()}` : "";
  
  // [수정 핵심] 누락된 venue 변수 선언 추가
  const venueValue = (card.venue || card.location || "").trim();
  const venue = venueValue ? `\n🏛️ 전시 장소: ${venueValue}` : "";

  const targetUrl = (card.targetUrl || "").trim();
  const urlHeader = targetUrl ? `🔗 공식 아카이브 웹사이트:\n${targetUrl}\n\n` : "";

  // 1. 출품 작가 전원 리스트업 (서식 버그 해결: 중복 콜론/하이픈 제거 후 - 작가명: 작품명 통일)
  const works = (card.artworks && Array.isArray(card.artworks) && card.artworks.length > 0)
    ? card.artworks
    : (card.works && Array.isArray(card.works) && card.works.length > 0)
    ? card.works
    : [];

  const worksList = (works.length > 0)
    ? works
        .map((w: any) => {
          const rawAuthor = (w?.author || w?.student_name || `${univ} 작가`).trim();
          const cleanAuthor = rawAuthor.replace(/^[-:\s]+|[-:\s]+$/g, "");
          const rawTitle = (w?.title || "출품작").trim();
          const cleanTitle = rawTitle.replace(/^[-:\s]+|[-:\s]+$/g, "");
          return `- ${cleanAuthor}: ${cleanTitle}`;
        })
        .join("\n")
    : "- 전공 출품작 전원 수록";

  // 2. 정확히 4개만 들어가는 엄격한 해시태그 세트
  const dateTag = formatDateHashtag(card.schedule || card.period || card.dateRange, card.year);
  const univTag = `#${univ.replace(/\s+/g, "")}`;
  const deptTag = `#${dept.replace(/\s+/g, "")}`;
  const defaultTag = "#졸업전시";

  const hashtags = `${dateTag} ${univTag} ${deptTag} ${defaultTag}`;

  // 3. 전시 상세 소개글 (description or curationIntro)
  const descriptionText = (card.description || card.curationIntro || "").trim();

  // 4. 최종 인스타그램 본문 조합 (ReferenceError 원천 방지)
  return `${urlHeader}${univ} ${dept}
'${title}'${subtitle}${schedule}${venue}

${descriptionText ? `${descriptionText}\n` : ""}━━━━━━━━━━━━━━━━━━━━
📌 출품작 및 작가 명단 (전원):
${worksList}
━━━━━━━━━━━━━━━━━━━━

${hashtags}`.trim();
}
