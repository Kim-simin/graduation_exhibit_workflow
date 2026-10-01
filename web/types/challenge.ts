export type ChallengeStatus =
  | "OPEN"
  | "RECRUITING"
  | "PROPOSAL_REVIEW"
  | "IN_PROGRESS"
  | "VALIDATION"
  | "COMPLETED"
  | "CLOSED";

export type ProjectDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type AccessLevel = "PUBLIC" | "UNIVERSITY_ONLY" | "PARTNER_ONLY" | "CONFIDENTIAL";

export type ResourceType =
  | "PATENT"
  | "DATASET"
  | "BRAND_IP"
  | "API"
  | "RESEARCH"
  | "EQUIPMENT"
  | "DESIGN_ASSET"
  | "OTHER";

export interface MajorCategory {
  id: string;
  name: string;
  subName?: string;
  icon: string;
  group?: string;
  description?: string;
}

export interface ChallengeMajorRequirement {
  id: string;
  challengeId: string;
  majorCategoryId: string;
  majorCategoryName: string;
  roleName: string;
  requiredSkills: string[];
  capacity: number;
  currentMembers: number;
  status: "RECRUITING" | "FILLED";
}

export interface ChallengeResource {
  id: string;
  challengeId: string;
  type: ResourceType;
  title: string;
  description: string;
  url?: string;
  accessLevel: AccessLevel;
  providerName?: string;
  metaInfo?: string;
}

export interface ChallengeMilestone {
  phase: string;
  period: string;
  description: string;
  status: "completed" | "current" | "upcoming";
}

export interface ParentChallenge {
  id: string;
  title: string;
  industry: string;
  provider: string;
  region: string;
  description: string;
  bannerImage?: string;
  officialUrl?: string;
  providerUrl?: string;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  parentChallengeId: string;
  parentChallengeTitle: string;
  industry: string;
  region: string;
  providerId: string;
  providerName: string;
  providerType: "기업" | "대학" | "연구소" | "지자체";
  status: ChallengeStatus;
  difficulty: ProjectDifficulty;
  duration: string;
  accessLevel: AccessLevel;
  shortProblem: string;
  problemStatement: string;
  goal: string;
  background: string;
  majorRequirements: ChallengeMajorRequirement[];
  skills: string[];
  resources: ChallengeResource[];
  expectedOutcomes: string[];
  timeline: ChallengeMilestone[];
  proposalDeadline: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  officialUrl?: string;
  providerUrl?: string;
  regionUrl?: string;
  applicationUrl?: string;
}

export interface TeamApplication {
  id: string;
  challengeId: string;
  userId?: string;
  applicantName: string;
  university: string;
  department: string;
  grade: string;
  email: string;
  role: string;
  skills: string[];
  portfolioUrl?: string;
  motivation: string;
  teamPreference: "NEED_TEAM" | "HAVE_TEAM";
  status: "APPLIED" | "IN_REVIEW" | "ACCEPTED";
  appliedAt: string;
}
