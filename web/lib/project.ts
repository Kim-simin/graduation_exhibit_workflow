import projectsData from "@/data/projects.json";
import challengeData from "@/data/industry_challenges.json";
import {
  MentoringProject,
  ProjectOrigin,
  ProjectProgressStage,
  MentorReviewStatus,
  CollaborationNeedType,
  ProjectConnection,
} from "@/types/project";

export const STAGE_LIST_STUDENT: {
  id: ProjectProgressStage;
  stageNumber: number;
  label: string;
  stepName: string;
}[] = [
  { id: "problem_definition", stageNumber: 1, label: "01 문제 정의", stepName: "문제 정의" },
  { id: "solution", stageNumber: 2, label: "02 해결방안 도출", stepName: "해결방안 도출" },
  { id: "planning", stageNumber: 3, label: "03 기획·설계", stepName: "기획·설계" },
  { id: "production", stageNumber: 4, label: "04 제작·실험", stepName: "제작·실험" },
  { id: "validation", stageNumber: 5, label: "05 검증·개선", stepName: "검증·개선" },
  { id: "completed", stageNumber: 6, label: "06 프로젝트 완료", stepName: "완료" },
];

export const STAGE_LIST_COMPANY: {
  id: ProjectProgressStage;
  stageNumber: number;
  label: string;
  stepName: string;
}[] = [
  { id: "preparation", stageNumber: 1, label: "01 기업 제안", stepName: "기업 제안" },
  { id: "problem_definition", stageNumber: 2, label: "02 대학 검토", stepName: "대학 검토" },
  { id: "solution", stageNumber: 3, label: "03 학생 모집", stepName: "학생 모집" },
  { id: "planning", stageNumber: 4, label: "04 학생 매칭", stepName: "학생 매칭" },
  { id: "production", stageNumber: 5, label: "05 프로젝트 수행", stepName: "프로젝트 수행" },
  { id: "validation", stageNumber: 6, label: "06 기업 검토·실증", stepName: "기업 검토·실증" },
  { id: "completed", stageNumber: 7, label: "07 완료", stepName: "완료" },
];

export const STAGE_LIST = STAGE_LIST_STUDENT;

export const REVIEW_STATUS_LIST: {
  id: MentorReviewStatus;
  label: string;
}[] = [
  { id: "not_requested", label: "검토 미요청" },
  { id: "review_requested", label: "현직자 검토 요청" },
  { id: "reviewing", label: "검토 중" },
  { id: "feedback_received", label: "피드백 도착" },
  { id: "revision_in_progress", label: "학생 반영 중" },
  { id: "review_completed", label: "피드백 반영 완료" },
];

export const COLLABORATION_NEEDS_LIST: {
  id: CollaborationNeedType;
  label: string;
}[] = [
  { id: "industry_feedback", label: "현업 피드백" },
  { id: "mentor", label: "기업 멘토" },
  { id: "data", label: "데이터 제공/수급" },
  { id: "equipment", label: "장비/시설 지원" },
  { id: "testbed", label: "실증기업 / 테스트베드" },
  { id: "company_problem", label: "기업 문제 연결" },
  { id: "joint_development", label: "공동개발" },
];

export const PROJECT_CATEGORIES = [
  "전체 분야",
  "AI / Software",
  "Mobility",
  "Engineering",
  "Design / UX",
  "Bio / Healthcare",
  "Energy / ESG",
  "Marine",
  "Content / Media",
  "Architecture / Spatial",
  "Other",
];

export const PROJECT_TYPES_FILTER = [
  "전체 유형",
  "개인 프로젝트",
  "졸업작품",
  "캡스톤",
  "기업 Challenge",
  "산학협력 IP",
  "기업 애로기술",
  "PBL",
  "R&D",
];

/**
 * 기본 프로젝트 대표 이미지 (이미지가 누락된 실제 프로젝트 전용 Fallback)
 * 중요: 이미지가 없다고 가짜 카드를 생성하는 것을 금지하며 실제 프로젝트에만 fallback 이미지를 적용함.
 */
export const DEFAULT_PROJECT_IMAGE =
  "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80";

/**
 * 개발용 Mock 데이터 허용 여부 판별기 (Section 8)
 * - 기본값: false (항상 비활성화)
 * - 프로덕션(production) 환경에서는 환경변수 설정과 무관하게 강제 차단(false)
 * - 오직 NODE_ENV !== "production" 이고 NEXT_PUBLIC_ENABLE_MOCK_DATA === "true" 일 때만 예외적 허용 가능
 */
export function isMockDataEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === "true";
}

// Pre-configured bidirectional connections linking student projects and company challenges
export const ALL_CONNECTIONS: ProjectConnection[] = [
  {
    id: "conn-03",
    studentProjectId: "proj-grad-exhibit-platform",
    companyProjectId: "challenge-shipbuilding-dashboard",
    relationshipType: "testbed",
    status: "active",
    createdAt: "2026.10.04",
    description: "한국조선해양 안전관제 대시보드 인터페이스 표준 실증 테스트베드 협력",
    counterpartTitle: "한국조선해양 안전관제 대시보드",
    counterpartOrg: "한국조선해양",
  },
  {
    id: "conn-04",
    studentProjectId: "proj-grad-exhibit-platform",
    companyProjectId: "challenge-uam-vertiport-space-ux",
    relationshipType: "industry_collaboration",
    status: "pending",
    createdAt: "2026.10.04",
    description: "한화시스템 UAM 버티포트 여객 인터랙션 및 플랫폼 아카이빙 연계",
    counterpartTitle: "UAM 버티포트 여객 탑승 여정 공간 UX",
    counterpartOrg: "한화시스템",
  },
];

/**
 * 1. 학생 제안 프로젝트 목록 불러오기
 * Single Source of Truth: 검증된 JSON 데이터(projects.json)만 허용.
 * 더미/샘플/임의 생성 카드는 일절 생성하지 않으며, 데이터가 없으면 빈 배열([])을 반환함.
 */
export function getStudentProjects(): MentoringProject[] {
  const rawList = (projectsData as unknown as MentoringProject[]) || [];
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [];
  }
  return rawList.map((p) => ({
    ...p,
    origin: "student" as ProjectOrigin,
    thumbnail: p.thumbnail || DEFAULT_PROJECT_IMAGE,
    coverImage: p.coverImage || DEFAULT_PROJECT_IMAGE,
    summary: p.summary || p.description,
    collaborationNeeds: p.collaborationNeeds || [
      "industry_feedback",
      "mentor",
      "testbed",
      "company_problem",
    ],
    collaborationNeedLabels: p.collaborationNeedLabels || [
      "현업 피드백",
      "기업 멘토",
      "실증기업",
    ],
    connectedProjects: ALL_CONNECTIONS.filter((c) => c.studentProjectId === p.id),
  }));
}

/**
 * 2. 기업 제안 산학협력 IP / Challenge 과제를 MentoringProject 형식으로 어댑팅
 * Single Source of Truth: 검증된 JSON 산업체 챌린지만 어댑팅.
 * 데이터가 없으면 빈 배열([])을 반환하며 임의 카드를 생성하지 않음.
 */
export function getCompanyChallengesAsProjects(): MentoringProject[] {
  // 기업 제안 더미/가상 데이터 전면 제거: 100% 검증된 실데이터만 노출
  return [];
}

/**
 * Supabase DB 레코드를 프론트엔드 MentoringProject 인터페이스로 안전하게 변환
 */
export function adaptSupabaseProject(record: any): MentoringProject {
  const isStudent = record.source_type === "student";
  const dateFormatted = record.created_at
    ? record.created_at.split("T")[0].replace(/-/g, ".")
    : new Date().toISOString().split("T")[0].replace(/-/g, ".");

  return {
    id: record.id,
    origin: isStudent ? "student" : "company",
    title: record.title || "무제",
    description: record.description || record.summary || "",
    summary: record.summary || record.description || "",
    problem: record.problem_definition || record.description || "",
    solution: record.solution || record.requirements || "",
    university: record.school || (isStudent ? "등록 대학교" : undefined),
    department: record.department,
    company: !isStudent ? (record.company_name || record.team_name || "제안 기업") : undefined,
    projectTypes: record.project_type ? [record.project_type] : [isStudent ? "학생 제안" : "기업 Challenge"],
    category: record.mentor_field || "AI / Software",
    thumbnail: record.image_url || DEFAULT_PROJECT_IMAGE,
    coverImage: record.image_url || DEFAULT_PROJECT_IMAGE,
    progressStage: (record.stage as any) || (isStudent ? "problem_definition" : "preparation"),
    progressPercent: typeof record.progress === "number" ? record.progress : 0,
    mentorReviewStatus: "review_requested",
    collaborationNeeds: record.cooperation ? ["industry_feedback", "mentor"] : ["industry_feedback"],
    collaborationNeedLabels: record.cooperation ? [record.cooperation] : ["현업 피드백"],
    createdAt: dateFormatted,
    updatedAt: dateFormatted,
    teamMembers: isStudent
      ? [
          {
            name: record.team_name || "참여 학생",
            role: "프로젝트 대표",
            department: record.department,
            contributions: ["기획", "개발"],
          },
        ]
      : [
          {
            name: record.contact_person || "담당자",
            role: "과제 리드",
            contributions: ["과제 기획", "산학 연계"],
          },
        ],
    skills: Array.isArray(record.tech_tags) && record.tech_tags.length > 0 ? record.tech_tags : ["협력 프로젝트"],
    links: {
      github: record.github_url || undefined,
      live: record.service_url || undefined,
      portfolio: record.portfolio_url || undefined,
    },
    milestones: [],
    mentorRequests: [],
    feedbacks: [],
    activityHistory: [
      {
        id: `act-${record.id}`,
        date: dateFormatted,
        title: "프로젝트 실시간 등록 완료",
        type: "milestone",
        description: `${record.title} 게시물이 등록되었습니다.`,
      },
    ],
    connectedProjects: [],
  };
}

/**
 * 3. 전체 프로젝트 (검증된 실데이터만 노출)
 * Single Source of Truth:
 * - 부산경상대학교 김시민 학생의 실제 참여 프로젝트만 노출
 * - 임의 생성/가짜 더미 기업 과제 일체 제외
 */
export function getProjects(): MentoringProject[] {
  const students = getStudentProjects();
  return students;
}

/**
 * 4. ID로 단일 프로젝트 찾기 (학생 제안 or 기업 제안 모두 지원)
 */
export function getProjectById(id: string, additionalProjects?: MentoringProject[]): MentoringProject | undefined {
  if (additionalProjects && additionalProjects.length > 0) {
    const found = additionalProjects.find((p) => p.id === id);
    if (found) return found;
  }
  const all = getProjects();
  return all.find((p) => p.id === id);
}

/**
 * 5. 양방향 연계 프로젝트 목록 반환
 */
export function getProjectConnections(projectId: string): ProjectConnection[] {
  return ALL_CONNECTIONS.filter(
    (c) => c.studentProjectId === projectId || c.companyProjectId === projectId
  );
}


/**
 * 6. 추천/연관 프로젝트 매칭 (학생 ↔ 기업)
 */
export function getMatchedCounterpartProjects(project: MentoringProject): MentoringProject[] {
  const all = getProjects();
  if (project.origin === "student") {
    return all
      .filter((p) => p.origin === "company")
      .filter((c) => {
        if (project.relatedChallengeIds?.includes(c.id)) return true;
        if (c.category === project.category) return true;
        return c.skills.some((sk) => project.skills.includes(sk));
      })
      .slice(0, 3);
  } else {
    return all
      .filter((p) => p.origin === "student")
      .filter((s) => {
        if (project.relatedStudentProjectIds?.includes(s.id)) return true;
        if (s.category === project.category) return true;
        return s.skills.some((sk) => project.skills.includes(sk));
      })
      .slice(0, 3);
  }
}

/**
 * 7. 진행 단계 정보 판정 (Student vs Company에 따라 라벨과 뱃지 분기)
 */
export function getStageInfo(stage: ProjectProgressStage, origin: ProjectOrigin = "student") {
  if (origin === "company") {
    switch (stage) {
      case "preparation":
        return {
          number: 1,
          label: "기업 제안",
          fullLabel: "01 기업 제안",
          badgeClass: "bg-purple-950/80 text-purple-300 border-purple-700/60",
        };
      case "problem_definition":
        return {
          number: 2,
          label: "대학 검토",
          fullLabel: "02 대학 검토",
          badgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-700/60",
        };
      case "solution":
        return {
          number: 3,
          label: "학생 모집 중",
          fullLabel: "03 학생 모집 중",
          badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
        };
      case "planning":
        return {
          number: 4,
          label: "학생 매칭",
          fullLabel: "04 학생 매칭",
          badgeClass: "bg-blue-950/80 text-blue-300 border-blue-700/60",
        };
      case "production":
        return {
          number: 5,
          label: "프로젝트 수행",
          fullLabel: "05 프로젝트 수행",
          badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-700/60",
        };
      case "validation":
        return {
          number: 6,
          label: "기업 검토·실증",
          fullLabel: "06 기업 검토·실증",
          badgeClass: "bg-amber-950/80 text-amber-300 border-amber-700/60",
        };
      case "completed":
        return {
          number: 7,
          label: "완료",
          fullLabel: "07 완료",
          badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
        };
      default:
        return {
          number: 3,
          label: "학생 모집 중",
          fullLabel: "03 학생 모집 중",
          badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
        };
    }
  }

  switch (stage) {
    case "preparation":
      return {
        number: 1,
        label: "준비",
        fullLabel: "00 준비",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      };
    case "problem_definition":
      return {
        number: 1,
        label: "문제 정의",
        fullLabel: "01 문제 정의",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      };
    case "solution":
      return {
        number: 2,
        label: "해결방안 도출",
        fullLabel: "02 해결방안 도출",
        badgeClass: "bg-blue-950/80 text-blue-300 border-blue-700/60",
      };
    case "planning":
      return {
        number: 3,
        label: "기획·설계",
        fullLabel: "03 기획·설계",
        badgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-700/60",
      };
    case "production":
      return {
        number: 4,
        label: "제작·실험",
        fullLabel: "04 제작·실험",
        badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-700/60",
      };
    case "validation":
      return {
        number: 5,
        label: "검증·개선",
        fullLabel: "05 검증·개선",
        badgeClass: "bg-amber-950/80 text-amber-300 border-amber-700/60",
      };
    case "completed":
      return {
        number: 6,
        label: "완료",
        fullLabel: "06 완료",
        badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
      };
    default:
      return {
        number: 1,
        label: "문제 정의",
        fullLabel: "01 문제 정의",
        badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
      };
  }
}

/**
 * 8. 현직자 검토 상태 라벨 및 뱃지 스타일
 */
export function getReviewStatusInfo(status: MentorReviewStatus) {
  switch (status) {
    case "not_requested":
      return {
        label: "검토 미요청",
        badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
        dotClass: "bg-slate-500",
      };
    case "review_requested":
      return {
        label: "현직자 검토 요청",
        badgeClass: "bg-rose-950/80 text-rose-300 border-rose-700/60",
        dotClass: "bg-rose-400 animate-pulse",
      };
    case "reviewing":
      return {
        label: "검토 중",
        badgeClass: "bg-amber-950/80 text-amber-300 border-amber-700/60",
        dotClass: "bg-amber-400",
      };
    case "feedback_received":
      return {
        label: "피드백 도착",
        badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
        dotClass: "bg-emerald-400",
      };
    case "revision_in_progress":
      return {
        label: "학생 반영 중",
        badgeClass: "bg-cyan-950/80 text-cyan-300 border-cyan-700/60",
        dotClass: "bg-cyan-400",
      };
    case "review_completed":
      return {
        label: "피드백 반영 완료",
        badgeClass: "bg-indigo-950/80 text-indigo-300 border-indigo-700/60",
        dotClass: "bg-indigo-400",
      };
    default:
      return {
        label: "검토 미요청",
        badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
        dotClass: "bg-slate-500",
      };
  }
}

export interface ProjectFilterOptions {
  origin?: "all" | "student" | "company";
  university?: string;
  department?: string;
  category?: string;
  projectType?: string;
  stage?: string;
  collaborationNeed?: string;
  reviewStatus?: string;
  searchQuery?: string;
  sort?:
    | "recent_update"
    | "review_requested"
    | "in_progress"
    | "recent_created"
    | "connectable"
    | "testbed_needed";
}

/**
 * 9. 다차원 필터링 및 정렬 함수
 */
export function filterProjects(
  projects: MentoringProject[],
  options: ProjectFilterOptions
): MentoringProject[] {
  const {
    origin = "all",
    university = "all",
    department = "all",
    category = "all",
    projectType = "all",
    stage = "all",
    collaborationNeed = "all",
    reviewStatus = "all",
    searchQuery = "",
    sort = "recent_update",
  } = options;

  let result = projects.filter((project) => {
    if (origin !== "all" && project.origin !== origin) {
      return false;
    }

    if (university !== "all") {
      const u = university.trim();
      const pUniv = project.university || "";
      if (!pUniv.includes(u) && !u.includes(pUniv)) {
        return false;
      }
    }

    if (department !== "all") {
      const d = department.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
      const pDept = (project.department || "").toLowerCase();
      if (!pDept.includes(d) && !d.includes(pDept)) {
        return false;
      }
    }

    if (category !== "all" && category !== "전체 분야") {
      if (project.category !== category) {
        return false;
      }
    }

    if (projectType !== "all" && projectType !== "전체 유형") {
      if (!project.projectTypes.some((t) => t.includes(projectType) || projectType.includes(t))) {
        return false;
      }
    }

    if (stage !== "all") {
      if (project.progressStage !== stage) {
        return false;
      }
    }

    if (collaborationNeed !== "all") {
      if (
        !project.collaborationNeeds?.includes(collaborationNeed as CollaborationNeedType) &&
        !project.collaborationNeedLabels?.some((l) => l.includes(collaborationNeed))
      ) {
        return false;
      }
    }

    if (reviewStatus !== "all") {
      if (project.mentorReviewStatus !== reviewStatus) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inTitle = project.title.toLowerCase().includes(q);
      const inDesc = project.description.toLowerCase().includes(q);
      const inUniv = (project.university || "").toLowerCase().includes(q);
      const inDept = (project.department || "").toLowerCase().includes(q);
      const inCompany = (project.company || "").toLowerCase().includes(q);
      const inSkills = project.skills.some((s) => s.toLowerCase().includes(q));
      const inMembers = project.teamMembers.some((m) => m.name.toLowerCase().includes(q));
      if (!inTitle && !inDesc && !inUniv && !inDept && !inCompany && !inSkills && !inMembers) {
        return false;
      }
    }

    return true;
  });

  result.sort((a, b) => {
    if (sort === "review_requested") {
      const aReq = a.mentorReviewStatus === "review_requested" ? 1 : 0;
      const bReq = b.mentorReviewStatus === "review_requested" ? 1 : 0;
      if (aReq !== bReq) return bReq - aReq;
    } else if (sort === "in_progress") {
      const aProg = a.progressStage !== "completed" ? 1 : 0;
      const bProg = b.progressStage !== "completed" ? 1 : 0;
      if (aProg !== bProg) return bProg - aProg;
    } else if (sort === "connectable") {
      const aConn = (a.connectedProjects?.length || 0) + (a.relatedChallengeIds?.length || 0);
      const bConn = (b.connectedProjects?.length || 0) + (b.relatedChallengeIds?.length || 0);
      if (aConn !== bConn) return bConn - aConn;
    } else if (sort === "testbed_needed") {
      const aTest = a.collaborationNeeds.includes("testbed") ? 1 : 0;
      const bTest = b.collaborationNeeds.includes("testbed") ? 1 : 0;
      if (aTest !== bTest) return bTest - aTest;
    }
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });

  return result;
}

/**
 * 10. 상단 동적 메트릭 통계
 */
export function getProjectSummaryMetrics(projects: MentoringProject[]) {
  const total = projects.length;
  const studentCount = projects.filter((p) => p.origin === "student").length;
  const companyCount = projects.filter((p) => p.origin === "company").length;
  const reviewRequestedCount = projects.filter(
    (p) => p.mentorReviewStatus === "review_requested"
  ).length;
  const activeCount = projects.filter((p) => p.progressStage !== "completed").length;
  const connectedCount = ALL_CONNECTIONS.length;

  return {
    total,
    studentCount,
    companyCount,
    reviewRequestedCount,
    activeCount,
    connectedCount,
  };
}
