import { supabase, isSupabaseConfigured } from "./supabase/client";
import { MentorFeedback, FeedbackType } from "@/types/project";

export { supabase, isSupabaseConfigured };

export interface InsertFeedbackInput {
  projectId: string;
  mentorId?: string;
  mentorName: string;
  mentorRole?: string;
  mentorCompany?: string;
  isVerifiedMentor?: boolean;
  feedbackType: FeedbackType;
  content: string;
  studentReply?: string;
  isPublic?: boolean;
}

export async function getLiveProjectFeedbacks(projectId: string): Promise<MentorFeedback[]> {
  if (!supabase || !isSupabaseConfigured) {
    console.warn("[Supabase getLiveProjectFeedbacks] Not configured, returning empty array.");
    return [];
  }

  console.log(`[Supabase getLiveProjectFeedbacks] Fetching for project_id = "${projectId}"`);

  try {
    const { data, error } = await supabase
      .from("mentor_feedbacks")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase getLiveProjectFeedbacks] Query error:", error.message);
      return [];
    }

    console.log(`[Supabase getLiveProjectFeedbacks] Successfully fetched ${data?.length || 0} rows for "${projectId}":`, data);

    return (data || []).map((row: any) => ({
      id: row.id,
      mentorId: row.mentor_id || "guest-mentor",
      mentorName: row.mentor_name || "현직자 멘토",
      mentorRole: row.mentor_role || "현업 전문가",
      mentorCompany: row.mentor_company || "파트너 기업",
      isVerifiedMentor: Boolean(row.reviewer_user_id && row.industry_review_id && row.is_verified_mentor),
      feedbackType: (row.feedback_type || "현업 적합성") as FeedbackType,
      comment: row.content || row.comment || "",
      studentReply: row.student_reply || undefined,
      resolved: Boolean(row.resolved || row.student_reply),
      createdAt: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    }));
  } catch (err: any) {
    console.warn("[Supabase getLiveProjectFeedbacks] Exception:", err?.message || err);
    return [];
  }
}

export async function insertLiveFeedback(
  params: InsertFeedbackInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  return {success:false,error:'검증된 현직자 계정으로 로그인한 뒤 내정보의 검토 요청에서 피드백을 등록해 주세요. 기존 피드백 기록은 유지됩니다.'};
}

export async function updateLiveFeedbackReply(
  feedbackId: string,
  reply: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "학생 답변 등록은 로그인(Auth) 기능 연결 후 활성화됩니다. (보안 보호)" };
}

export interface InsertConnectionInput {
  sourceProjectId: string;
  targetProjectId: string;
  proposerType: "student" | "company" | "mentor";
  proposerName: string;
  proposerEmail?: string;
  message: string;
  status?: string;
}

export async function getLiveProjectConnections(projectId: string): Promise<any[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from("project_connections")
      .select("*")
      .or(`source_project_id.eq.${projectId},target_project_id.eq.${projectId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Supabase project_connections query error]:", error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.warn("[Supabase project_connections exception]:", err?.message || err);
    return [];
  }
}

export async function insertLiveProjectConnection(
  params: InsertConnectionInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  if (!params.sourceProjectId || !params.targetProjectId) {
    return { success: false, error: "연결할 대상 프로젝트 정보가 필요합니다." };
  }
  if (!params.proposerName?.trim()) {
    return { success: false, error: "제안자 성명 또는 기관명을 입력해 주세요." };
  }
  if (!params.message?.trim()) {
    return { success: false, error: "제안 메시지를 입력해 주세요." };
  }

  try {
    const payload = {
      source_project_id: params.sourceProjectId,
      target_project_id: params.targetProjectId,
      proposer_type: params.proposerType,
      proposer_name: params.proposerName.trim(),
      proposer_email: params.proposerEmail?.trim() || null,
      message: params.message.trim(),
      status: params.status || "대기 중",
    };

    const { data, error } = await supabase
      .from("project_connections")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("[Supabase project_connections insert error]:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "연결 제안 저장 중 오류가 발생했습니다." };
  }
}

export interface MentoringProjectRecord {
  id?: string;
  source_type: "student" | "company";
  title: string;
  school?: string;
  department?: string;
  team_name?: string;
  company_name?: string;
  summary?: string;
  description: string;
  project_type: string;
  stage: string;
  progress: number;
  cooperation?: string;
  tech_tags?: string[];
  image_url?: string;
  github_url?: string;
  service_url?: string;
  portfolio_url?: string;
  start_date?: string;
  mentor_field?: string;
  problem_definition?: string;
  requirements?: string;
  support_benefit?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export async function insertMentoringProject(
  projectData: MentoringProjectRecord
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (projectData.source_type === "student") return {success:false,error:"학생 게시물 등록이 중단되었습니다."};
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  try {
    const {data:auth,error:authError}=await supabase.auth.getUser();
    if(authError||!auth.user)return {success:false,error:'로그인 후 프로젝트를 등록해 주세요.'};
    const { data, error } = await supabase
      .from("mentoring_projects")
      .insert([{...projectData,owner_id:auth.user.id,visibility:'private'}])
      .select()
      .single();
    if(error)return {success:false,error:['PGRST204','42703','42P01'].includes(error.code)?'DB 업데이트 적용 후 프로젝트를 등록할 수 있습니다.':'프로젝트를 저장하지 못했습니다. 계정 권한을 확인해 주세요.'};
    return {success:true,data};
  } catch (err: any) {
    return { success: false, error: err?.message || "프로젝트 저장 중 오류가 발생했습니다." };
  }
}

export async function getLiveMentoringProjects(): Promise<MentoringProjectRecord[]> {

  if (!supabase || !isSupabaseConfigured) return [];

  const results: MentoringProjectRecord[] = [];

  // 1. Try mentoring_projects table
  try {
    const { data, error } = await supabase
      .from("mentoring_projects")
      .select("*")
      .eq("source_type", "company")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      results.push(...data);
    }
  } catch (err) {
    // ignore
  }

  // 2. Query from project_connections registry fallback
  try {
    const { data, error } = await supabase
      .from("project_connections")
      .select("*")
      .eq("target_project_id", "__project_registry__")
      .order("created_at", { ascending: false });

    // Excluded dummy/test project IDs (never show mock/test registrations)
    const EXCLUDED_IDS = new Set([
      "proj-1791342435931",
      "proj-reg-1791342670542",
      "proj-challenge-1791342680306",
      "proj-seed-1791342408973",
      "test-1791342386411",
      "test-1791342391301",
    ]);

    if (!error && data) {
      for (const row of data) {
        if (EXCLUDED_IDS.has(row.source_project_id)) continue;
        try {
          const parsed = JSON.parse(row.message);
          if (parsed.source_type !== "company") continue;
          if (parsed.id && EXCLUDED_IDS.has(parsed.id)) continue;
          if(results.some(project=>project.id===(row.source_project_id||parsed.id)))continue;
          results.push({
            ...parsed,
            id: row.source_project_id || parsed.id,
            created_at: row.created_at,
          });
        } catch {
          // ignore unparsable
        }
      }
    }
  } catch (err) {
    console.warn("[getLiveMentoringProjects fallback error]:", err);
  }

  return results;
}


