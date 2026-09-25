/**
 * src/utils/categoryMapper.ts
 * 전국 대학교 학과명 -> 10대 표준 학과명(카테고리) 자동 매핑 유틸리티
 */

export interface CategoryMeta {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export const STANDARD_CATEGORIES: CategoryMeta[] = [
  { id: "all", name: "전체 분야", icon: "🌐" },
  { id: "it_sw", name: "IT·소프트웨어·컴공", icon: "💻", description: "컴퓨터공학, AI, 데이터 포함" },
  { id: "engineering", name: "기계·전자·일반공학", icon: "⚙️", description: "기계, 전기, 캡스톤 포함" },
  { id: "design_ux", name: "디자인·UX/UI", icon: "🎨", description: "시각, 산업, 서비스디자인" },
  { id: "media_toon", name: "영상·웹툰·애니", icon: "🎬", description: "영상, 방송, 웹툰, 만화 포함" },
  { id: "art_craft", name: "미술·공예·조형", icon: "🖼️", description: "회화, 순수미술, 도자, 금속" },
  { id: "architecture", name: "건축·공간·조경", icon: "🏛️", description: "건축, 실내, 환경디자인" },
  { id: "fashion", name: "패션·텍스타일", icon: "👗", description: "의류, 섬유" },
  { id: "game_meta", name: "게임·메타버스", icon: "🎮", description: "게임기획, VR/AR" },
  { id: "business", name: "기획·경영·마케팅", icon: "📊", description: "경영, 광고홍보, 기획서" },
];

export const EDIT_CATEGORIES: string[] = [
  "IT·소프트웨어·컴공",
  "기계·전자·일반공학",
  "디자인·UX/UI",
  "영상·웹툰·애니",
  "미술·공예·조형",
  "건축·공간·조경",
  "패션·텍스타일",
  "게임·메타버스",
  "기획·경영·마케팅",
];

export function getStandardCategory(deptName: string): string {
  const d = (deptName || "").toLowerCase().replace(/\s+/g, ''); // 공백 제거 후 소문자 변환

  // 1. IT·소프트웨어·컴공
  if (/컴퓨터|소프트웨어|컴공|sw|인공지능|ai|데이터|정보통신|보안|웹개발|프론트엔드|백엔드|it/i.test(d)) {
    return "IT·소프트웨어·컴공";
  }
  // 2. 기계·전자·일반공학
  if (/기계|전자|전기|메카트로닉스|신소재|화학공학|로봇|산업공학|임베디드|반도체|일반공학/i.test(d)) {
    return "기계·전자·일반공학";
  }
  // 3. 영상·웹툰·애니 (신규 확장)
  if (/웹툰|애니|만화|영상|방송|미디어|모션그래픽|vfx|콘텐츠/i.test(d)) {
    return "영상·웹툰·애니";
  }
  // 4. 디자인·UX/UI
  if (/시각|산업|제품|ux|ui|서비스|커뮤니케이션|브랜드|브랜딩|정보디자인|인터랙션/i.test(d)) {
    return "디자인·UX/UI";
  }
  // 5. 미술·공예·조형 (통합)
  if (/미술|회화|서양화|동양화|한국화|조소|현대미술|파인아트|조형|공예|도자|금속|목조형|유리/i.test(d)) {
    return "미술·공예·조형";
  }
  // 6. 건축·공간·조경
  if (/건축|실내|공간|인테리어|환경|도시|조경/i.test(d)) {
    return "건축·공간·조경";
  }
  // 7. 패션·텍스타일
  if (/패션|의류|텍스타일|의상|섬유/i.test(d)) {
    return "패션·텍스타일";
  }
  // 8. 게임·메타버스
  if (/게임|캐릭터|메타버스|vr|ar/i.test(d)) {
    return "게임·메타버스";
  }
  // 9. 기획·경영·마케팅
  if (/경영|경제|광고|홍보|마케팅|비즈니스|기획|무역|관광/i.test(d)) {
    return "기획·경영·마케팅";
  }

  // 매핑되지 않은 경우 기본값 (또는 "기타" 분류)
  return "디자인·UX/UI"; 
}

/**
 * IT·소프트웨어·컴공, 기계·전자·일반공학 등 확대 비활성화 카테고리 여부 판별
 */
export function isCategoryZoomDisabled(categoryOrDept?: string): boolean {
  if (!categoryOrDept) return false;
  const standardCat = getStandardCategory(categoryOrDept);
  return standardCat === "IT·소프트웨어·컴공" || standardCat === "기계·전자·일반공학";
}

/**
 * 작품 클릭 시 고화질 확대(라이트박스 팝업) 비활성화 여부 판별
 * - IT/소프트웨어/컴공, 기계/전자/일반공학 카테고리 전체 적용
 * - 개별 플래그(disableArtworkZoom / disable_artwork_zoom) 지원
 */
export function isArtworkZoomDisabled(exhibition?: {
  id?: string;
  category?: string;
  department?: string;
  university?: string;
  year?: string | number;
  title?: string;
  disableArtworkZoom?: boolean;
} | null): boolean {
  if (!exhibition) return false;
  if (exhibition.disableArtworkZoom) return true;
  if (isCategoryZoomDisabled(exhibition.category) || isCategoryZoomDisabled(exhibition.department)) {
    return true;
  }
  if (exhibition.id === "UNIV-2026-인천대학교-컴퓨터공학부-7899") return true;
  if (exhibition.title?.includes("인천대학교 2026년 컴퓨터공학부 졸업전시회")) return true;
  return false;
}
