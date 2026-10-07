import { AccessLevel } from "./challenge";

export type OpportunityType =
  | "EDUCATION"
  | "RND"
  | "CAPSTONE"
  | "COMPETITION"
  | "STARTUP"
  | "MULTIDISCIPLINARY"
  | "SHARED_INFRASTRUCTURE"
  | "EQUIPMENT"
  | "RESEARCH_EQUIPMENT";

export type OpportunityStatus = "UPCOMING" | "OPEN" | "CLOSED" | "ONGOING" | "UNKNOWN";

export type AccessScope =
  | "UNIVERSITY_ONLY"
  | "SHARED_UNIVERSITY"
  | "REGIONAL_STUDENT"
  | "PUBLIC"
  | "EXTERNAL_RESEARCHER"
  | "UNKNOWN";

export type ApprovalStatus = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";

export type ApplicantType =
  | "undergraduate_student"
  | "graduate_student"
  | "student"
  | "employee"
  | "researcher"
  | "startup"
  | "company"
  | "institution"
  | "faculty"
  | "mixed"
  | "unknown";

export type EligibilityStatus = "verified" | "needs_review" | "excluded";

export interface RecruitmentEvidence {
  sourceUrl: string;
  sourceKind: "NST" | "UNIVERSITY_OFFICIAL" | "RESEARCH_INSTITUTE_OFFICIAL";
  isOfficialDetail: boolean;
  eligibilityText: string;
  recruitmentText: string;
  verifiedAt: string;
  rollingAdmission?: boolean;
}

export interface Opportunity {
  id: string;
  type: OpportunityType;

  title: string;
  providerName: string;
  universityId?: string;

  region: string;
  description: string;

  targetStudents: string;
  // 🎓 Student Eligibility Gate Verification Fields
  applicantType?: ApplicantType;
  studentEligible?: boolean;
  studentEligibilityVerified?: boolean;
  eligibleStudentStatus?: string;
  eligibilityText?: string;
  eligibilityEvidence?: string;
  officialSourceUrl?: string;
  eligibilityStatus?: EligibilityStatus;
  exclusionReason?: string;
  lastVerifiedAt?: string;

  // Discovery records without recruitment evidence remain general R&D information.
  eligibleAudience?: string[];
  studentParticipationVerified?: boolean;
  officialSourceVerified?: boolean;
  recruitmentStatus?: OpportunityStatus;
  recruitmentEvidence?: RecruitmentEvidence;
  verificationReason?: string;
  eligibleUniversities: string[];
  eligibleDepartments: string[];
  eligibleMajors: string[];

  majorRestriction: boolean;
  crossUniversityAvailable: boolean;

  accessScope: AccessScope;

  recruitmentStartAt?: string | null;
  recruitmentEndAt?: string | null;

  programStartAt?: string | null;
  programEndAt?: string | null;

  status: OpportunityStatus;
  programStatus?: "UPCOMING" | "ONGOING" | "COMPLETED" | "UNKNOWN";

  benefits: string[];
  technologies: string[];
  fields: string[];

  applicationMethod?: string | null;
  applicationUrl?: string | null;

  sourceUrl: string;
  sourceType: string;
  sourceOrganization: string;

  sourcePublishedAt?: string | null;
  sourceVerifiedAt: string;

  tags: string[];

  // 🛡️ Provenance & Deduplication
  contentHash?: string;
  lastCheckedAt?: string;
  lastChangedAt?: string;

  // 🛡️ Approval & System State
  approvalStatus: ApprovalStatus;

  createdAt: string;
  updatedAt: string;

  // Extended fields for specific types
  project_type?: "GENERAL" | "COMPANY_LINKED" | "LOCAL_GOV_LINKED";
  prizeOrReward?: string;
  teamComposition?: string;
  contact?: string;
  dDayText?: string;
}

export interface Equipment {
  id: string;
  equipment_keyno?: string;
  equipment_name: string;
  equipment_name_ko?: string;
  equipment_name_en?: string;
  equipment_category: string;
  university: string;
  facility_name?: string;
  center_name?: string;
  lab_category?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  quantity?: number | string;
  specification?: string;
  performance?: string;
  features?: string;
  supported_work?: string;
  supported_research?: string;
  use_procedure?: string;
  cost_info?: string;
  etc_notice?: string;
  eligible_users: string;
  external_user_access: boolean;
  accessScope: AccessScope;
  reservation_required: boolean;
  reservation_method?: string;
  usage_method_raw?: string;
  usage_type?: "ANALYSIS_REQUEST" | "DIRECT_USE" | "CONSULTATION_REQUIRED";
  is_urgent_analysis_available?: boolean;
  image_url?: string | null;
  analysis_request_available?: boolean;
  reservation_url?: string;
  official_guide_urls?: {
    general_user: string;
    direct_user: string;
    pnu_internal: string;
    login: string;
    detail: string;
  };
  operator?: string;
  contact?: string;
  install_status?: string;
  source_url: string;
  source_organization: string;
  source_title: string;
  verified_at: string;
  sourceUrl?: string;
  sourceOrganization?: string;
  sourceType?: string;
  sourceVerifiedAt?: string;
  approvalStatus: ApprovalStatus;
  status: string;
  related_majors: string[];
  tags: string[];
  contentHash?: string;
  lastCheckedAt?: string;
  lastChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CoreCategory = "PROJECT" | "COMPETITION" | "FACILITY";
export type FacilitySubTab = "ALL" | "SPACE" | "EQUIPMENT";

export interface FacilityItem {
  id: string;
  name: string;
  nameKo?: string;
  nameEn?: string;
  model?: string;
  subType: "SPACE" | "EQUIPMENT";
  university: string;
  managingOrg: string;
  location: string;
  labCategory?: string;
  eligibleMajors: string[];
  externalUserAccess: boolean;
  accessScope: AccessScope | string;
  usageCondition: string;
  cost: string;
  reservationRequired: boolean;
  reservationMethod?: string;
  reservationUrl?: string;
  sourceOrg: string;
  sourceUrl: string;
  verifiedAt: string;
  status: string;
  tags: string[];
  rawItem: Equipment | Opportunity;
  rawKind: "EQUIPMENT" | "OPPORTUNITY";

  // Specialized Research Equipment Extended Fields
  equipmentKeyno?: string;
  usageMethodRaw?: string;
  usageType?: "ANALYSIS_REQUEST" | "DIRECT_USE" | "CONSULTATION_REQUIRED";
  urgentAvailable?: boolean;
  imageUrl?: string | null;
  operator?: string;
  contact?: string;
  features?: string;
  performance?: string;
  useProcedure?: string;
  officialGuideUrls?: {
    general_user: string;
    direct_user: string;
    pnu_internal: string;
    login: string;
    detail: string;
  };
}

