export type ResourceKind = 'program' | 'model' | 'tool' | 'agent_skill' | 'human_skill' | 'mcp';
export const RESOURCE_LABELS: Record<ResourceKind, string> = { program: 'Program / Software', model: 'AI Model', tool: 'AI Tool', agent_skill: 'AI 에이전트 Skill / Workflow', human_skill: '직무 역량 / 학습 Skill', mcp: 'MCP / Integration' };
export interface IndustryProfile {
    user_id: string;
    display_name: string;
    requested_role: 'student' | 'mentor' | 'company' | 'professor';
    expertise: string;
    affiliation: string;
    bio: string;
    career_source: string;
    links: Record<string, string>;
    is_public: boolean;
    updated_at?: string;
}
export interface ProjectResource {
    id?: string;
    name: string;
    kind: ResourceKind;
    official_url: string;
    version: string;
    pricing: string;
    prerequisites: string;
    security_notes: string;
    verified_date: string;
    status?: 'proposed' | 'approved' | 'update_needed';
    reason: string;
    usage: string;
}
export interface RecommendationStep {
    title: string;
    instructions: string;
    deliverable: string;
    position?: number;
}
export interface RecommendationDraft {
    id?: string;
    title: string;
    summary: string;
    category: string;
    difficulty: '입문' | '중급' | '고급';
    duration: string;
    image_url: string;
    target_majors: string[];
    target_roles: string[];
    body: {
        purpose: string;
        problem: string;
        deliverables: string;
        reason: string;
        industry_tech: string;
        curriculum_gap: string;
        competencies: string;
        work_context: string;
    };
    criteria: string[];
    resources: ProjectResource[];
    steps: RecommendationStep[];
}
export interface Recommendation extends Omit<RecommendationDraft, 'body' | 'resources' | 'steps'> {
    id: string;
    author_id: string;
    body: RecommendationDraft;
    status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
    review_note?: string;
    reviewed_at?: string;
    revision: number;
    created_at: string;
    updated_at: string;
    profile?: IndustryProfile;
    resources?: ProjectResource[];
    steps?: RecommendationStep[];
}
export interface IndustryReview {
    reviewer_snapshot?: {display_name:string;expertise?:string;affiliation?:string};
    id: string;
    project_id: string;
    reviewer_id: string;
    criteria: string;
    evidence_basis: string;
    comment: string;
    is_public: boolean;
    reviewed_at: string;
    profile?: IndustryProfile;
    project_title?: string;
}
export interface PortfolioEvidence {
    title: string;
    url: string;
    notes: string;
}
export interface Workspace {
    current_step: number;
    tools: string;
    process: string;
    problem_solving: string;
    result: string;
    validation: string;
    contribution: string;
    ai_usage: string;
    visibility: 'public' | 'private' | 'limited';
    stage: string;
    progress: number;
    evidence: PortfolioEvidence[];
}
export const emptyDraft: RecommendationDraft = { title: '', summary: '', category: '', difficulty: '입문', duration: '', image_url: '', target_majors: [], target_roles: [], body: { purpose: '', problem: '', deliverables: '', reason: '', industry_tech: '', curriculum_gap: '', competencies: '', work_context: '' }, criteria: [], resources: [], steps: [] };
