/**
 * my-exhibit-platform/lib/source-traceability.ts
 * STEP 9-3: Research Information Source Traceability 표준 모델 및 URL 해석/검증 유틸리티
 */

export type SourceType =
  | "UNIVERSITY_OFFICIAL"
  | "CORPORATE_RFP"
  | "PROFESSOR_OFFICIAL"
  | "MENTOR_PROFILE"
  | "BRAND_IP_OFFICIAL"
  | "SECONDARY_SOURCE"
  | string;

export type VerificationStatus = "VERIFIED" | "UNVERIFIED" | "FAILED" | "INACTIVE";

export type UrlStatus =
  | "URL_VALID"
  | "URL_REDIRECT"
  | "URL_NOT_FOUND"
  | "URL_BLOCKED"
  | "URL_TIMEOUT"
  | "URL_UNVERIFIED";

export interface InformationSource {
  source_id: string;
  source_name?: string;
  source_url: string; // 실제 Research 과정에서 확인한 원문 URL (Original URL)
  canonical_url?: string; // 정규화/최종 리다이렉트 URL
  external_url?: string; // 보조 참조 URL
  source_domain: string; // 도메인 (domain != source_url)
  source_title: string;
  source_type: SourceType;
  source_priority: number; // 1: Official, 2: Institutional, 3: Professional Platform, 4: Secondary
  verification_status: VerificationStatus;
  url_status?: UrlStatus;
  http_status_code?: number;
  evidence?: string;
  collected_at: string;
  last_verified_at: string;
  entity_id?: string;
  run_id?: string;
}

export interface SourceSummary {
  total_sources: number;
  verified_count: number;
  unverified_count: number;
  failed_count: number;
  last_research_time: string;
  by_domain: {
    university: number;
    corporate_rfp: number;
    professor: number;
    mentor: number;
    brand_ip: number;
  };
}

/**
 * source_priority 숫자를 "좋다/나쁘다" 평가점수가 아닌 신뢰도 위계 라벨로 변환
 */
export function getSourcePriorityLabel(priority: number): {
  label: string;
  badgeClass: string;
} {
  switch (priority) {
    case 1:
      return {
        label: "Official",
        badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      };
    case 2:
      return {
        label: "Institutional",
        badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      };
    case 3:
      return {
        label: "Professional Platform",
        badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      };
    case 4:
    default:
      return {
        label: "Secondary",
        badgeClass: "bg-slate-700/40 text-slate-400 border-slate-600/30",
      };
  }
}

/**
 * 5대 영역 카테고리 매핑
 */
export function getSourceCategory(type: SourceType): {
  id: "university" | "corporate_rfp" | "professor" | "mentor" | "brand_ip" | "other";
  name: string;
  emoji: string;
} {
  switch (type) {
    case "UNIVERSITY_OFFICIAL":
      return { id: "university", name: "University", emoji: "🏛️" };
    case "CORPORATE_RFP":
      return { id: "corporate_rfp", name: "Corporate RFP", emoji: "🏢" };
    case "PROFESSOR_OFFICIAL":
      return { id: "professor", name: "Professor", emoji: "🎓" };
    case "MENTOR_PROFILE":
      return { id: "mentor", name: "Mentor", emoji: "💼" };
    case "BRAND_IP_OFFICIAL":
      return { id: "brand_ip", name: "Brand IP", emoji: "🏷️" };
    default:
      return { id: "other", name: "Other Source", emoji: "🌐" };
  }
}

/**
 * Verification Status 뱃지 스타일 매핑
 */
export function getVerificationStatusBadge(status: VerificationStatus): {
  label: string;
  dotColor: string;
  badgeClass: string;
} {
  switch (status) {
    case "VERIFIED":
      return {
        label: "Verified",
        dotColor: "bg-emerald-400",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    case "UNVERIFIED":
      return {
        label: "Unverified",
        dotColor: "bg-amber-400",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    case "FAILED":
      return {
        label: "Failed",
        dotColor: "bg-rose-400",
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      };
    case "INACTIVE":
      return {
        label: "Inactive",
        dotColor: "bg-slate-500",
        badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
      };
    default:
      return {
        label: status || "Unknown",
        dotColor: "bg-slate-500",
        badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
      };
  }
}

/**
 * URL 검증 세부 상태 뱃지 매핑
 */
export function getUrlStatusBadge(status?: UrlStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "URL_VALID":
      return {
        label: "URL Valid",
        badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      };
    case "URL_REDIRECT":
      return {
        label: "Redirect",
        badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      };
    case "URL_NOT_FOUND":
      return {
        label: "404 Not Found",
        badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      };
    case "URL_BLOCKED":
      return {
        label: "Blocked / Protected",
        badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      };
    case "URL_TIMEOUT":
      return {
        label: "Timeout",
        badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      };
    case "URL_UNVERIFIED":
    default:
      return {
        label: "Unverified URL",
        badgeClass: "bg-slate-800 text-slate-400 border-slate-700",
      };
  }
}

/**
 * 유효한 HTTP/HTTPS URL인지 검증
 */
export function isValidHttpUrl(urlString?: string | null): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

/**
 * 도메인 추출 및 표시 규격
 */
export function parseDomainFromUrl(urlString?: string | null): string {
  if (!urlString) return "";
  try {
    const url = new URL(urlString.trim());
    return url.hostname.toLowerCase();
  } catch (_) {
    return "";
  }
}

/**
 * [STEP 9-3 핵심 원칙]: Open Source 우선순위 해석
 * 1. canonicalUrl
 * 2. sourceUrl
 * 3. externalUrl
 * 
 * 단, 도메인만 있거나 (www.wanted.co.kr 등), 404 상태이거나 유효하지 않은 경우 null 반환
 * ("Source URL unavailable" 상태 표시 및 버튼 비활성화 유도)
 */
export function resolveSourceUrl(src?: Partial<InformationSource> | null): string | null {
  if (!src) return null;

  // 404 URL이면 절대로 유효한 URL로 반환하지 않음
  if (src.url_status === "URL_NOT_FOUND" || src.verification_status === "FAILED") {
    return null;
  }

  const candidates = [src.canonical_url, src.source_url, src.external_url];

  for (const candidate of candidates) {
    if (candidate && isValidHttpUrl(candidate)) {
      const trimmed = candidate.trim();
      try {
        const parsed = new URL(trimmed);
        const host = parsed.hostname.toLowerCase();
        
        // 도메인만 존재하거나 경로가 없는 경우 (예: "https://www.wanted.co.kr" 또는 "https://wanted.co.kr/")
        // 단, 도메인 자체가 공식 기관인 경우(공식 홈페이지)는 허용하되,
        // 일반 플랫폼에서 도메인만 던진 경우 체크
        const isDomainOnly = (parsed.pathname === "" || parsed.pathname === "/") && !parsed.search && !parsed.hash;
        
        // 만약 source_domain과 완전히 동일하면서 path가 없는 일반 플랫폼 도메인이면 비활성화 대상
        if (isDomainOnly && (host.includes("wanted.co.kr") || host.includes("kmong.com") || host.includes("linkedin.com"))) {
          continue; // 세부 프로필이 아니므로 통과시키지 않음
        }

        return trimmed;
      } catch (_) {
        continue;
      }
    }
  }

  return null;
}
