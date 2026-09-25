export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  year: string;
  tags: string[];
}

export interface Student {
  id: string;
  name: string;
  university: string;
  department: string;
  year: number;
  bio: string;
  role: string;
  avatar_url?: string;
  skills: string[];
  portfolio_items: PortfolioItem[];
  contact_email: string;
  sns_links: {
    behance?: string;
    linkedin?: string;
    instagram?: string;
    github?: string;
  };
  status: "active" | "graduated";
  views?: number;
  likes?: number;
}

export interface ProfessorSubmission {
  id: string;
  student_name: string;
  title: string;
  image: string;
  comment: string;
}

export interface PartnerAcademyBanner {
  academy_name: string;
  slogan: string;
  guide_title: string;
  link_url?: string;
  phone?: string;
  discount_code?: string;
}

export interface IndustryCollaboration {
  id: string;
  company: string;
  company_logo?: string;
  title: string;
  period?: string;
  reward_or_budget?: string;
  description?: string;
}

export interface Professor {
  id: string;
  name: string;
  university: string;
  department: string;
  major?: string;
  lab_name: string;
  title: string;
  research_areas: string[];
  avatar_url?: string;
  bio: string;
  assignment_one_liner: string;
  assignment_details: {
    title: string;
    objective: string;
    semester: string;
    student_count: number;
  };
  student_submission_ids: string[];
  student_submissions: ProfessorSubmission[];
  partner_academy_banner: PartnerAcademyBanner;
  // 신규 자동화 및 출처 검증 메타데이터
  source_url?: string;
  collected_at?: string;
  verified_at?: string;
  is_verified?: boolean;
  verification_status?: "VERIFIED" | "REVIEW_REQUIRED" | "UNVERIFIED";
  confidence_score?: number;
  evidence_text?: string;
  inferred_fields?: string[];
  industry_collaborations?: IndustryCollaboration[];
  last_run_id?: string;
  version?: number;
}

export interface RFPSubmission {
  id: string;
  student_name: string;
  university: string;
  department: string;
  submitted_at: string;
  summary_title: string;
  problem_recognition: string;
  solution: string;
  outcome_image: string;
}

export interface RFP {
  id: string;
  company_name: string;
  company?: string;
  company_logo?: string;
  logo_emoji?: string;
  company_industry: string;
  industry?: string;
  title: string;
  original_brief?: string;
  abstract_brief: string;
  problem_statement: string;
  target_qualifications: string;
  target?: string;
  budget_or_reward: string;
  reward?: string;
  deadline: string;
  status: "open" | "evaluating" | "closed";
  submissions: RFPSubmission[];
  source_url?: string;
  verified_at?: string;
  is_verified?: boolean;
  verification_status?: "VERIFIED" | "REVIEW_REQUIRED" | "UNVERIFIED";
  confidence_score?: number;
  evidence_text?: string;
  corroboration_status?: string;
  cooperation_signal?: string;
  verified_required_skills?: string[];
  cooperation_companies?: string[];
}

export interface CareerMilestone {
  period: string;
  company: string;
  role: string;
  description: string;
}

export interface MentorReview {
  author: string;
  university: string;
  rating: number;
  date: string;
  content: string;
}

export interface AvailableSlot {
  date: string;
  time: string;
  booked?: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  company: string;
  company_logo?: string;
  role: string;
  industry?: string;
  experience_years: number;
  specialties: string[];
  bio: string;
  price_per_session: number;
  available_slots: AvailableSlot[];
  rating: number;
  review_count: number;
  career_timeline: CareerMilestone[];
  reviews: MentorReview[];
  career_evidence_url?: string;
  source_url?: string;
  verified_at?: string;
  is_verified?: boolean;
  verification_status?: "VERIFIED" | "REVIEW_REQUIRED" | "UNVERIFIED";
  confidence_score?: number;
  evidence_text?: string;
}

export interface CorporateRFP {
  id: string;
  company: string;
  logo_emoji?: string;
  industry?: string;
  title: string;
  original_brief?: string;
  abstract_brief: string;
  deadline: string;
  reward?: string;
  status?: string;
  target?: string;
  problem_statement?: string;
  source_url?: string;
  is_verified?: boolean;
  verification_status?: string;
}

export interface IPFreePassItem {
  id: string;
  company: string;
  logo_emoji?: string;
  category?: string;
  industry?: string;
  logo_url?: string;
  license: string;
  license_scope?: string;
  permitted_use?: string[];
  prohibited_use?: string[];
  official_policy_url?: string;
  description?: string;
  badge?: string;
  package_size?: string;
  download_count?: number;
  assets: string[];
  source_url?: string;
  verified_at?: string;
  is_verified?: boolean;
  verification_status?: "VERIFIED" | "REVIEW_REQUIRED" | "UNVERIFIED";
  confidence_score?: number;
  evidence_text?: string;
}

export type BrandAsset = IPFreePassItem;

export interface CorporateData {
  rfp_list: CorporateRFP[];
  ip_freepass_list: IPFreePassItem[];
}

// STEP 8: Content Generation & Verified Content Intelligence
export interface SourceTraceabilityItem {
  claim: string;
  fact_id: string;
  fact_text: string;
  source_id: string;
  publisher: string;
  source_url: string;
}

export interface ContentStructureBlock {
  section_name: string;
  content_text: string;
  visual_notes: string;
  asset_ref?: string;
}

export interface ContentQAResultItem {
  passed: boolean;
  score: number;
  checked_items: string[];
  errors: string[];
  warnings: string[];
  source_presence_verified: boolean;
  fact_consistency_verified: boolean;
  unsupported_claims: string[];
  format_adherence: boolean;
  cta_verified: boolean;
  asset_requirements_verified: boolean;
}

export interface ContentBriefItem {
  topic: string;
  sector: string;
  target_audience: string;
  research_goal: string;
  key_facts: any[];
  raw_facts_summary: string[];
  ai_inferences_summary: string[];
  sources_summary: Array<{ publisher: string; url: string }>;
  keywords: string[];
  entities: string[];
  opportunities: any[];
  platform_constraints: Record<string, any>;
  content_id?: string;
  content_type?: string;
  target?: string;
  title?: string;
  hook?: string;
  source_data_ids?: string[];
  related_professors?: string[];
  related_departments?: string[];
  related_industries?: string[];
  related_rfps?: string[];
  related_open_ips?: string[];
  related_mentors?: string[];
  source_urls?: string[];
  required_assets?: any[];
  target_platform?: string;
  status?: string;
}

export interface GeneratedContentItem {
  content_id: string;
  project_id: string;
  research_ids: string[];
  platform: "instagram" | "youtube" | "blog";
  content_type: "reels" | "carousel" | "post" | "video_script" | "blog_post";
  objective: string;
  target_audience: string;
  engagement_strategy: {
    share: string;
    save: string;
    retention: string;
  };
  title: string;
  hook: string;
  body: string;
  caption: string;
  cta: string;
  keywords: string[];
  hashtags: string[];
  structure: ContentStructureBlock[];
  visual_direction: string;
  asset_requirements: Array<{
    asset_type: string;
    resolution?: string;
    duration_sec?: number;
    notes?: string;
  }>;
  source_traceability: SourceTraceabilityItem[];
  qa_result?: ContentQAResultItem;
  version: number;
  parent_version_id?: string | null;
  status:
    | "DRAFT"
    | "QA_PASSED"
    | "QA_FAILED"
    | "HUMAN_REVIEW"
    | "APPROVED"
    | "REVISION_REQUIRED"
    | "REJECTED";
  created_at: string;
  updated_at: string;
  related_entity_id?: string;
  related_entity_type?: "professor" | "rfp" | "brand_asset" | "mentor" | "portfolio";
}

export * from "./platform";
