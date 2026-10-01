import challengeData from "@/data/industry_challenges.json";
import {
  Challenge,
  ParentChallenge,
  MajorCategory,
  TeamApplication,
} from "@/types/challenge";

export function getMajorCategories(): MajorCategory[] {
  return (challengeData.majorCategories as MajorCategory[]) || [];
}

export function getParentChallenges(): ParentChallenge[] {
  return (challengeData.parentChallenges as ParentChallenge[]) || [];
}

export function getParentChallengeById(id: string): ParentChallenge | undefined {
  return getParentChallenges().find((p) => p.id === id);
}

export function getChallenges(): Challenge[] {
  return (challengeData.challenges as unknown as Challenge[]) || [];
}

export function getChallengeById(idOrSlug: string): Challenge | undefined {
  const all = getChallenges();
  return all.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}

/**
 * 학과별 현재 모집 중인 Challenge 수를 동적으로 계산
 * - Challenge status가 OPEN 또는 RECRUITING 이어야 함
 * - 해당 학과(majorCategoryId)의 requirement가 존재하고 currentMembers < capacity 이어야 함
 */
export function getChallengeMajorCounts(): Record<string, number> {
  const challenges = getChallenges();
  const activeChallenges = challenges.filter(
    (c) => c.status === "OPEN" || c.status === "RECRUITING"
  );

  const counts: Record<string, number> = {
    all: activeChallenges.length,
  };

  const categories = getMajorCategories();
  for (const cat of categories) {
    const matchingCount = activeChallenges.filter((c) =>
      c.majorRequirements.some(
        (req) => req.majorCategoryId === cat.id && req.currentMembers < req.capacity
      )
    ).length;
    counts[cat.id] = matchingCount;
  }

  return counts;
}

export interface ChallengeFilterOptions {
  majorCategoryId?: string;
  searchQuery?: string;
  industry?: string;
  difficulty?: string;
  region?: string;
  status?: string;
  includeFilledForMajor?: boolean;
}

/**
 * 학과 및 검색 필터링 함수
 * CASE 1, CASE 2 준수:
 * - majorCategoryId === 'all' -> 모든 Challenge
 * - majorCategoryId 선택 시:
 *   해당 Challenge의 majorRequirements 중 majorCategoryId와 일치하고,
 *   currentMembers < capacity (모집 중)인 Challenge만 반환
 */
export function filterChallenges(
  challenges: Challenge[],
  options: ChallengeFilterOptions
): Challenge[] {
  const {
    majorCategoryId = "all",
    searchQuery = "",
    industry = "all",
    difficulty = "all",
    region = "all",
    status = "all",
    includeFilledForMajor = false,
  } = options;

  return challenges.filter((challenge) => {
    // 1. 학과 필터
    if (majorCategoryId && majorCategoryId !== "all") {
      const req = challenge.majorRequirements.find(
        (r) => r.majorCategoryId === majorCategoryId
      );
      if (!req) return false;
      // 모집 중인 상태만 노출 (includeFilledForMajor가 false일 때)
      if (!includeFilledForMajor && req.currentMembers >= req.capacity) {
        return false;
      }
    }

    // 2. 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = challenge.title.toLowerCase().includes(q);
      const matchShortProblem = challenge.shortProblem.toLowerCase().includes(q);
      const matchProvider = challenge.providerName.toLowerCase().includes(q);
      const matchIndustry = challenge.industry.toLowerCase().includes(q);
      const matchSkills = challenge.skills.some((s) => s.toLowerCase().includes(q));
      const matchParent = challenge.parentChallengeTitle.toLowerCase().includes(q);

      if (
        !matchTitle &&
        !matchShortProblem &&
        !matchProvider &&
        !matchIndustry &&
        !matchSkills &&
        !matchParent
      ) {
        return false;
      }
    }

    // 3. 산업군 필터
    if (industry !== "all" && challenge.industry && !challenge.industry.includes(industry)) {
      return false;
    }

    // 4. 난이도 필터
    if (difficulty !== "all" && challenge.difficulty !== difficulty) {
      return false;
    }

    // 5. 지역 필터
    if (region !== "all" && challenge.region && !challenge.region.includes(region)) {
      return false;
    }

    // 6. 상태 필터
    if (status !== "all" && challenge.status !== status) {
      return false;
    }

    return true;
  });
}
