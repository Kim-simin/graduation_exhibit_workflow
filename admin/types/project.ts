export type ProjectOrigin = "student" | "company";

export type ProjectProgressStage =
  | "preparation"          // 준비 / 기업 제안
  | "problem_definition"   // 문제 정의 / 대학 검토
  | "solution"             // 해결방안 도출 / 학생 모집
  | "planning"             // 기획·설계 / 학생 매칭
  | "production"           // 제작·실험 / 프로젝트 수행
  | "validation"           // 검증·개선 / 기업 검토·실증
  | "completed";           // 프로젝트 완료

export type MentorReviewStatus =
  | "not_requested"        // 검토 미요청
  | "review_requested"     // 현직자 검토 요청
  | "reviewing"            // 검토 중
  | "feedback_received"    // 피드백 도착
  | "revision_in_progress" // 학생 반영 중
  | "review_completed";    // 피드백 반영 완료

export type CollaborationNeedType =
  | "industry_feedback"    // 현업 피드백 필요
  | "mentor"               // 기업 멘토 필요
  | "data"                 // 데이터 필요
  | "equipment"            // 장비 필요
  | "facility"             // 시설 필요
  | "testbed"              // 실증기업 필요 / 테스트베드
  | "research"             // 연구 지원
  | "company_problem"      // 기업 문제 연결 희망
  | "joint_development"    // 공동개발 희망
  | "commercialization";   // 사업화 / 실증

export type ProjectType =
  | "학생 제안"
  | "기업 제안"
  | "졸업작품"
  | "개인 프로젝트"
  | "캡스톤"
  | "캡스톤디자인"
  | "기업 Challenge"
  | "산학협력 IP"
  | "기업 애로기술"
  | "R&D"
  | "PBL"
  | "공모전"
  | "창업 프로젝트"
  | "University Platform";

export type FeedbackType =
  | "기술"
  | "현업 적합성"
  | "UX/UI"
  | "사업성"
  | "데이터"
  | "제조"
  | "실증"
  | "안전"
  | "시장"
  | "보안"
  | "성과물"
  | "기타";

export interface ProjectEvidence {
  id: string;
  projectId: string;
  milestoneId: string;
  type:
    | "Image"
    | "Video"
    | "Prototype"
    | "GitHub"
    | "Live Website"
    | "Figma"
    | "PDF"
    | "Architecture Diagram"
    | "Dataset"
    | "Research"
    | "Demo";
  title: string;
  description: string;
  thumbnail?: string;
  url?: string;
  contributors?: string[];
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  stage: ProjectProgressStage;
  stageNumber: number; // 1 to 6 (or 7)
  title: string;
  description: string;
  status: "completed" | "in_progress" | "upcoming";
  startedAt?: string;
  completedAt?: string;
  summary: string;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  evidence: ProjectEvidence[];
  images?: string[];
  externalLinks?: {
    label: string;
    url: string;
  }[];
  mentorQuestions?: string[];
}

export interface MentorFeedback {
  id: string;
  reviewId?: string;
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  mentorCompany: string;
  isVerifiedMentor?: boolean;
  feedbackType: FeedbackType;
  comment: string;
  studentReply?: string;
  studentResponse?: string;
  beforeEvidenceId?: string;
  afterEvidenceId?: string;
  beforeDescription?: string;
  afterDescription?: string;
  resolved: boolean;
  createdAt: string;
}

export interface MentorReviewRequest {
  id: string;
  projectId: string;
  milestoneId?: string;
  status: MentorReviewStatus;
  question: string;
  reviewFields: string[];
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProjectActivityLog {
  id: string;
  date: string; // e.g. "10.01", "2026.10.01"
  title: string;
  type: "milestone" | "evidence" | "review_request" | "feedback" | "revision" | "connection";
  description?: string;
}

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  department?: string;
  contributions: string[];
  avatarUrl?: string;
}

export interface ProjectConnection {
  id: string;
  studentProjectId: string;
  companyProjectId: string;
  relationshipType:
    | "interest"               // 관심 프로젝트 저장
    | "mentoring"              // 멘토링 연결
    | "problem_match"          // 기업 문제 연결
    | "testbed"                // 실증 협의
    | "industry_collaboration" // 산학협력 과제화
    | "official_project";      // 공식 산학 프로젝트 전환
  status: "active" | "pending" | "completed";
  createdAt: string;
  description?: string;
  counterpartTitle?: string;
  counterpartOrg?: string;
}

export interface MentoringProject {
  id: string;
  origin: ProjectOrigin; // "student" | "company"
  title: string;
  description: string;
  summary?: string;
  problem?: string;
  solution?: string;
  university?: string;
  department?: string;
  company?: string;
  companyLead?: {
    name: string;
    role: string;
    department?: string;
  };
  projectTypes: string[];
  category: string;
  thumbnail: string;
  coverImage?: string;
  progressStage: ProjectProgressStage;
  progressPercent: number; // 0 to 100
  mentorReviewStatus: MentorReviewStatus;
  collaborationNeeds: CollaborationNeedType[];
  collaborationNeedLabels?: string[];
  visibility?: "public" | "limited" | "private";
  createdAt: string;
  updatedAt: string;
  teamMembers: TeamMember[];
  skills: string[];
  links?: {
    live?: string;
    github?: string;
    figma?: string;
    demo?: string;
    portfolio?: string;
    official?: string;
  };
  milestones: ProjectMilestone[];
  mentorRequests: MentorReviewRequest[];
  feedbacks: MentorFeedback[];
  activityHistory: ProjectActivityLog[];
  isDemo?: boolean;

  // Bidirectional connections
  connectedProjects?: ProjectConnection[];
  relatedChallengeIds?: string[];
  relatedStudentProjectIds?: string[];
}
