import opportunitiesData from "@/data/opportunities.json";
import equipmentData from "@/data/equipment.json";
import { withoutRemovedContent } from "@/lib/content-removals";
import { Opportunity, Equipment, OpportunityType, OpportunityStatus, AccessScope, CoreCategory, FacilityItem } from "@/types/opportunity";
import { calculateRecruitmentStatus, evaluateStudentRnD, isStudentRnDOpportunity } from "@/lib/student-rnd";
export { calculateRecruitmentStatus, isStudentRnDOpportunity } from "@/lib/student-rnd";

export function getOpportunities(referenceTimeStr = new Date().toISOString()): Opportunity[] {
  return withoutRemovedContent("opportunities", (opportunitiesData as unknown as Opportunity[]) || []).map((opportunity) => {
    if (opportunity.type !== "RND") {
      if (!opportunity.recruitmentEvidence?.isOfficialDetail) return opportunity;
      const checked = calculateRecruitmentStatus(opportunity.recruitmentStartAt, opportunity.recruitmentEndAt, referenceTimeStr, opportunity.recruitmentEvidence?.rollingAdmission === true);
      return { ...opportunity, status: opportunity.status === "CLOSED" ? "CLOSED" as const : checked.status };
    }
    const checked = evaluateStudentRnD(opportunity, referenceTimeStr);
    return { ...opportunity, ...checked, status: checked.recruitmentStatus };
  });
}

export function getOpportunityById(id: string): Opportunity | undefined {
  return getOpportunities().find((o) => o.id === id);
}

export function getEquipments(): Equipment[] {
  return withoutRemovedContent("equipment", (equipmentData as unknown as Equipment[]) || []);
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

/**
 * 3대 핵심 카테고리 판별 (PROJECT, COMPETITION, FACILITY)
 */
export function categorizeOpportunity(opp: Opportunity): CoreCategory {
  if (
    opp.type === "COMPETITION" ||
    /경진대회|공모전|해커톤|아이디어톤/.test(opp.title)
  ) {
    return "COMPETITION";
  }

  if (
    opp.type === "SHARED_INFRASTRUCTURE" ||
    opp.type === "EQUIPMENT" ||
    opp.type === "RESEARCH_EQUIPMENT"
  ) {
    return "FACILITY";
  }

  return "PROJECT";
}

/**
 * 🎓 Student Eligibility Gate:
 * 현재 재학 중인 대학생/학부생이 직접 신청하거나 프로젝트 참여자로 지원할 수 있는 프로그램만 통과
 */
export function isStudentEligibleOpportunity(opp: Opportunity): boolean {
  return opp.studentEligibilityVerified === true && opp.eligibilityStatus === "verified";
}

/**
 * 프로젝트 타입 뱃지 결정 (Type Badge)
 * R&D 판정: 기업·기관이 R&D를 한다 ≠ 학생 참여 R&D. 대학생 모집 근거가 확인된 과제만 "R&D 학생 참여과제"로 표기
 */
export function getProjectBadge(opp: Opportunity): { label: string; badgeClass: string } {
  if (/PBL/i.test(opp.title) || opp.tags?.some((t) => /PBL/i.test(t))) {
    return {
      label: "PBL",
      badgeClass: "bg-teal-950/80 text-teal-300 border-teal-700/60",
    };
  }
  if (/현장실습/.test(opp.title) || opp.tags?.some((t) => /현장실습/.test(t))) {
    return {
      label: "현장실습",
      badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-700/60",
    };
  }
  if (opp.type === "CAPSTONE" || /캡스톤/.test(opp.title)) {
    return {
      label: "캡스톤 프로젝트",
      badgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-700/60",
    };
  }
  if (
    opp.project_type === "COMPANY_LINKED" ||
    /기업|산학/.test(opp.title) ||
    /산학/.test(opp.providerName)
  ) {
    return {
      label: "기업 산학협력과제",
      badgeClass: "bg-blue-950/80 text-blue-300 border-blue-700/60",
    };
  }
  if (opp.type === "MULTIDISCIPLINARY") {
    return {
      label: "다학제 프로젝트",
      badgeClass: "bg-purple-950/80 text-purple-300 border-purple-700/60",
    };
  }
  if (opp.type === "STARTUP") {
    return {
      label: "창업연계",
      badgeClass: "bg-amber-950/80 text-amber-300 border-amber-700/60",
    };
  }
  if (opp.type === "RND") {
    return {
      label: "R&D 학생 참여과제",
      badgeClass: "bg-rose-950/80 text-rose-300 border-rose-700/60",
    };
  }
  return {
    label: "프로젝트",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  };
}

/**
 * 통일된 모집 상태 뱃지 정보 ([모집중], [상시모집], [모집예정], [마감])
 */
export function getRecruitmentStatusInfo(
  status: string,
  recruitmentEndAt?: string | null,
  rollingAdmission?: boolean
): {
  label: "모집중" | "상시모집" | "모집예정" | "마감" | "확인 필요";
  badgeClass: string;
  dotClass: string;
  key: "OPEN" | "ROLLING" | "UPCOMING" | "CLOSED" | "UNKNOWN";
} {
  if (status === "CLOSED" || status === "COMPLETED") {
    return {
      label: "마감",
      badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
      dotClass: "bg-slate-500",
      key: "CLOSED",
    };
  }
  if (status === "UPCOMING") {
    return {
      label: "모집예정",
      badgeClass: "bg-sky-950/70 text-sky-300 border-sky-700/60",
      dotClass: "bg-sky-400",
      key: "UPCOMING",
    };
  }
  if (rollingAdmission === true || (status === "OPEN" && !recruitmentEndAt)) {
    return {
      label: "상시모집",
      badgeClass: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60",
      dotClass: "bg-emerald-400",
      key: "ROLLING",
    };
  }
  if (status === "OPEN" || status === "RECRUITING" || status === "ONGOING") {
    return {
      label: "모집중",
      badgeClass: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60",
      dotClass: "bg-emerald-400",
      key: "OPEN",
    };
  }
  return {
    label: "확인 필요",
    badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
    dotClass: "bg-slate-400",
    key: "UNKNOWN",
  };
}

/**
 * 장비 및 공유 시설 통합 노멀라이저
 */
export function getNormalizedFacilities(
  opportunities: Opportunity[],
  equipments: Equipment[]
): FacilityItem[] {
  const result: FacilityItem[] = [];
  const seenIds = new Set<string>();

  // 1. equipment.json 장비들 (전문 연구장비)
  for (const eq of equipments) {
    if (seenIds.has(eq.id)) continue;
    seenIds.add(eq.id);

    const isResearchEquip = eq.resource_type === "RESEARCH_EQUIPMENT" || eq.equipment_category === "전문 연구장비";

    result.push({
      id: eq.id,
      name: eq.equipment_name_ko || eq.equipment_name,
      nameKo: eq.equipment_name_ko || eq.equipment_name,
      nameEn: eq.equipment_name_en,
      model: eq.model,
      subType: isResearchEquip ? "EQUIPMENT" : "SPACE",
      university: eq.university,
      managingOrg: eq.facility_name || eq.center_name || eq.source_organization || eq.university,
      location: eq.location || eq.university,
      labCategory: eq.lab_category,
      eligibleMajors: eq.related_majors || [],
      externalUserAccess: Boolean(eq.external_user_access || eq.accessScope !== "UNIVERSITY_ONLY"),
      accessScope: eq.accessScope,
      usageCondition: eq.supported_work || eq.specification || eq.supported_research || eq.features || "사전 예약 및 안전수칙 준수",
      cost: eq.cost_info || "기관별 수가 차등 적용 (공식 요금표 참조)",
      reservationRequired: eq.reservation_required ?? true,
      reservationMethod: eq.usage_method_raw || eq.reservation_method || "공동실험실습관 회원가입 후 온라인 예약",
      reservationUrl: eq.reservation_url || eq.source_url,
      sourceOrg: eq.source_organization,
      sourceUrl: eq.source_url,
      verifiedAt: eq.verified_at || eq.createdAt,
      status: eq.status || "OPERATIONAL",
      tags: eq.tags || [],
      rawItem: eq,
      rawKind: "EQUIPMENT",

      // Extended fields
      equipmentKeyno: eq.equipment_keyno,
      usageMethodRaw: eq.usage_method_raw,
      usageType: eq.usage_type,
      urgentAvailable: eq.is_urgent_analysis_available,
      imageUrl: eq.image_url,
      operator: eq.operator,
      contact: eq.contact,
      features: eq.features,
      performance: eq.performance || eq.specification,
      useProcedure: eq.use_procedure,
      officialGuideUrls: eq.official_guide_urls,
    });
  }

  // 2. opportunities.json 중 시설/공유인프라 (공유 공간 & 인프라)
  for (const opp of opportunities) {
    if (
      opp.type === "SHARED_INFRASTRUCTURE" ||
      opp.type === "EQUIPMENT" ||
      opp.type === "RESEARCH_EQUIPMENT"
    ) {
      if (opp.eligibilityStatus === "excluded" || opp.eligibilityStatus === "needs_review") continue;
      if (seenIds.has(opp.id)) continue;
      seenIds.add(opp.id);

      const isSpace = opp.type === "SHARED_INFRASTRUCTURE" || !opp.type.includes("EQUIPMENT");

      result.push({
        id: opp.id,
        name: opp.title,
        nameKo: opp.title,
        subType: isSpace ? "SPACE" : "EQUIPMENT",
        university: opp.region || opp.providerName,
        managingOrg: opp.providerName,
        location: opp.region || "해당 대학 캠퍼스",
        eligibleMajors: opp.eligibleMajors || [],
        externalUserAccess: Boolean(opp.crossUniversityAvailable || opp.accessScope !== "UNIVERSITY_ONLY"),
        accessScope: opp.accessScope,
        usageCondition: opp.description,
        cost: "무상 대여 (공유대학 지원)",
        reservationRequired: true,
        reservationMethod: opp.applicationMethod || "공식 사이트 공간대여 예약 신청",
        reservationUrl: opp.applicationUrl || opp.sourceUrl,
        sourceOrg: opp.sourceOrganization,
        sourceUrl: opp.sourceUrl,
        verifiedAt: opp.sourceVerifiedAt || opp.updatedAt,
        status: opp.status || "OPEN",
        tags: opp.tags || [],
        rawItem: opp,
        rawKind: "OPPORTUNITY",
      });
    }
  }

  return result;
}

export function cleanMajorKeyword(major: string): string {
  return major.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
}

/**
 * 전공 조건 엄격 검증 (텍스트 단순 일치 제외, 공식 전공 목록 또는 전공무관만 허용)
 */
export function isStrictMajorEligible(
  selectedMajor: string,
  eligibleMajors?: string[],
  eligibleDepartments?: string[],
  majorRestriction?: boolean
): boolean {
  if (selectedMajor === "all") return true;
  if (majorRestriction === false) return true;
  if (!eligibleMajors || eligibleMajors.length === 0) return true;
  if (eligibleMajors.includes("ALL")) return true;
  if (eligibleDepartments && eligibleDepartments.includes("ALL")) return true;

  const mClean = cleanMajorKeyword(selectedMajor);
  if (!mClean) return true;

  const inMajors = eligibleMajors.some((em) => {
    if (em === "ALL") return true;
    const emClean = cleanMajorKeyword(em);
    return emClean.includes(mClean) || mClean.includes(emClean);
  });
  if (inMajors) return true;

  if (eligibleDepartments && eligibleDepartments.length > 0) {
    const inDepts = eligibleDepartments.some((ed) => {
      if (ed === "ALL") return true;
      const edClean = cleanMajorKeyword(ed);
      return edClean.includes(mClean) || mClean.includes(edClean);
    });
    if (inDepts) return true;
  }

  return false;
}

/**
 * 소속 대학 조건 검증
 */
export function isUniversityEligible(
  selectedUniv: string,
  eligibleUniversities?: string[],
  crossUniversityAvailable?: boolean,
  hostUniversity?: string
): boolean {
  if (selectedUniv === "all") return true;
  if (crossUniversityAvailable === true) return true;
  if (eligibleUniversities && eligibleUniversities.includes("ALL")) return true;

  if (hostUniversity && (hostUniversity.includes(selectedUniv) || selectedUniv.includes(hostUniversity))) {
    return true;
  }

  if (eligibleUniversities && eligibleUniversities.length > 0) {
    return eligibleUniversities.some((u) => u.includes(selectedUniv) || selectedUniv.includes(u));
  }

  return false;
}

