import opportunitiesData from "@/data/opportunities.json";
import equipmentData from "@/data/equipment.json";
import { Opportunity, Equipment, OpportunityType, OpportunityStatus, AccessScope } from "@/types/opportunity";
import { evaluateStudentRnD, isStudentRnDOpportunity } from "@/lib/student-rnd";
export { calculateRecruitmentStatus, isStudentRnDOpportunity } from "@/lib/student-rnd";

export function getOpportunities(referenceTimeStr = new Date().toISOString()): Opportunity[] {
  return ((opportunitiesData as unknown as Opportunity[]) || []).map((opportunity) => {
    if (opportunity.type !== "RND") return opportunity;
    const checked = evaluateStudentRnD(opportunity, referenceTimeStr);
    return { ...opportunity, ...checked, status: checked.recruitmentStatus };
  });
}

export function getOpportunityById(id: string): Opportunity | undefined {
  return getOpportunities().find((o) => o.id === id);
}

export function getEquipments(): Equipment[] {
  return (equipmentData as unknown as Equipment[]) || [];
}

export function getEquipmentById(id: string): Equipment | undefined {
  return getEquipments().find((e) => e.id === id);
}

export interface OpportunityFilterOptions {
  major?: string;
  university?: string;
  type?: string;
  status?: string;
  searchQuery?: string;
  accessScope?: string;
}

/**
 * 전공 및 대학 조건에 따른 Opportunity 필터링
 */
export function filterOpportunities(
  opportunities: Opportunity[],
  options: OpportunityFilterOptions
): Opportunity[] {
  const {
    major = "all",
    university = "all",
    type = "all",
    status = "all",
    searchQuery = "",
    accessScope = "all",
  } = options;

  return opportunities.filter((opp) => {
    // 1. 유형 필터
    if (type !== "all" && opp.type !== type) {
      return false;
    }

    // 2. 상태 필터
    if (status !== "all" && opp.status !== status) {
      return false;
    }

    // 3. 대학 필터
    if (university !== "all") {
      const uMatch =
        opp.crossUniversityAvailable ||
        opp.eligibleUniversities.includes("ALL") ||
        opp.eligibleUniversities.some((u) => u.includes(university) || university.includes(u));
      if (!uMatch) return false;
    }

    // 4. 전공 필터
    if (major !== "all") {
      const mClean = major.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
      const isAllEligible = !opp.majorRestriction || opp.eligibleMajors.includes("ALL");

      if (!isAllEligible) {
        const majorMatched = opp.eligibleMajors.some((em) => {
          const emClean = em.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
          return emClean.includes(mClean) || mClean.includes(emClean);
        });

        const tagMatched = opp.tags.some((t) => t.toLowerCase().includes(mClean));
        const fieldMatched = opp.fields.some((f) => f.toLowerCase().includes(mClean));

        if (!majorMatched && !tagMatched && !fieldMatched) {
          return false;
        }
      }
    }

    // 5. 접근 범위 필터
    if (accessScope !== "all" && opp.accessScope !== accessScope) {
      return false;
    }

    // 6. 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchDesc = opp.description.toLowerCase().includes(q);
      const matchProvider = opp.providerName.toLowerCase().includes(q);
      const matchTags = opp.tags.some((t) => t.toLowerCase().includes(q));
      const matchTech = opp.technologies.some((t) => t.toLowerCase().includes(q));

      if (!matchTitle && !matchDesc && !matchProvider && !matchTags && !matchTech) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 장비 필터링
 */
export function filterEquipments(
  equipments: Equipment[],
  options: {
    major?: string;
    university?: string;
    category?: string;
    searchQuery?: string;
    scope?: string;
  }
): Equipment[] {
  const { major = "all", university = "all", category = "all", searchQuery = "", scope = "all" } = options;

  return equipments.filter((eq) => {
    // 1. 대학 필터
    if (university !== "all") {
      const uMatch =
        eq.external_user_access ||
        eq.university.includes(university) ||
        university.includes(eq.university);
      if (!uMatch) return false;
    }

    // 2. 카테고리 필터
    if (category !== "all" && eq.equipment_category !== category) {
      return false;
    }

    // 3. 전공 필터
    if (major !== "all") {
      const mClean = major.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
      const majorMatch =
        eq.related_majors.some((rm) => {
          const rmClean = rm.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
          return rmClean.includes(mClean) || mClean.includes(rmClean);
        }) ||
        eq.tags.some((t) => t.toLowerCase().includes(mClean));

      if (!majorMatch) return false;
    }

    // 4. 접근 범위 필터
    if (scope !== "all" && eq.accessScope !== scope) {
      return false;
    }

    // 5. 검색어
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = eq.equipment_name.toLowerCase().includes(q);
      const matchModel = (eq.model || "").toLowerCase().includes(q);
      const matchWork = (eq.supported_work || eq.supported_research || "").toLowerCase().includes(q);
      const matchTags = eq.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchName && !matchModel && !matchWork && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 학생의 대학 + 전공 기준 4대 핵심 질문 영역 데이터 번들 매핑
 */
export function getStudentExplorationData(university: string, major: string, referenceTimeStr = new Date().toISOString()) {
  const allOpps = getOpportunities(referenceTimeStr).filter((o) => o.approvalStatus === "PUBLISHED");
  const allEqs = getEquipments();

  // 1. 내 전공으로 사용 가능한 자원 (공유 인프라, 교육, 메이커 스페이스 등)
  const availableResources = filterOpportunities(allOpps, {
    university,
    major,
  }).filter(
    (o) =>
      o.type === "SHARED_INFRASTRUCTURE" ||
      o.type === "EDUCATION" ||
      o.type === "EQUIPMENT" ||
      o.type === "RESEARCH_EQUIPMENT"
  );

  // 2. 공식 상세 모집공고에서 학생 참여와 모집중 상태가 확인된 R&D만 공개
  const activeRnD = filterOpportunities(allOpps, {
    university,
    major,
  }).filter(
    (o) => isStudentRnDOpportunity(o, referenceTimeStr)
  );

  // 3. 현재 모집 중인 프로젝트 (캡스톤, 경진대회, 다학제, 창업 등)
  const recruitingProjects = filterOpportunities(allOpps, {
    university,
    major,
  }).filter(
    (o) =>
      (o.type === "CAPSTONE" ||
        o.type === "COMPETITION" ||
        o.type === "MULTIDISCIPLINARY" ||
        o.type === "STARTUP" ||
        isStudentRnDOpportunity(o, referenceTimeStr)) &&
      (o.status === "OPEN" || o.status === "UPCOMING")
  );

  // 4. 활용 가능한 장비 및 시설
  const usableEquipments = filterEquipments(allEqs, {
    university,
    major,
  });

  return {
    availableResources,
    activeRnD,
    recruitingProjects,
    usableEquipments,
    totalCount:
      availableResources.length +
      activeRnD.length +
      recruitingProjects.length +
      usableEquipments.length,
  };
}
