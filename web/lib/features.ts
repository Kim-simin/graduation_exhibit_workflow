/**
 * PUBLIC_FEATURES: 3개월 실증(PoC) MVP 범위 제어 Feature Flag
 * 
 * - 공개(PUBLIC) 화면에서는 핵심 3개 메뉴(졸업전시 아카이브, 대학생, 프로젝트 공고)만 노출합니다.
 * - 제외 기능(공유자원, R&D, 커리큘럼, 채용공고, 브랜드IP, 산학협력IP)은 영구 삭제하지 않고 비노출 처리합니다.
 * - 사용자가 직접 URL로 접근할 경우 친절한 안내 컴포넌트를 렌더링합니다.
 */
export const PUBLIC_FEATURES = {
  graduationArchive: true,
  students: true,
  projectBoard: true,

  sharedResources: false,
  rnd: false,
  curriculum: false,
  jobs: false,
  brandIp: false,
  industryIp: false,
} as const;

export type PublicFeatureKey = keyof typeof PUBLIC_FEATURES;

export function isFeatureEnabled(key: PublicFeatureKey): boolean {
  return PUBLIC_FEATURES[key] ?? false;
}
