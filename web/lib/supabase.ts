import { supabase, isSupabaseConfigured } from "./supabase/client";
import { MentorFeedback, FeedbackType } from "@/types/project";

export { supabase, isSupabaseConfigured };

// ==========================================================
// 1. 현직자 멘토 피드백 API (mentor_feedbacks)
// ==========================================================

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

/**
 * 특정 프로젝트의 실시간 멘토 피드백 목록을 조회합니다.
 * (project_id 기준 필터링)
 */
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
      isVerifiedMentor: row.is_verified_mentor ?? true,
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

/**
 * 현직자 피드백을 Supabase에 저장합니다.
 */
export async function insertLiveFeedback(
  params: InsertFeedbackInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    console.error("[Supabase insertLiveFeedback] Supabase is NOT configured!");
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  // 필수값 검증 (TEST 3)
  if (!params.projectId?.trim()) {
    return { success: false, error: "프로젝트 ID가 누락되었습니다." };
  }
  if (!params.mentorName?.trim()) {
    return { success: false, error: "멘토 이름을 입력해 주세요." };
  }
  if (!params.content?.trim()) {
    return { success: false, error: "피드백 내용을 입력해 주세요." };
  }

  const payload = {
    project_id: params.projectId,
    mentor_id: params.mentorId || "guest-mentor",
    mentor_name: params.mentorName.trim(),
    mentor_role: params.mentorRole?.trim() || "현업 R&D 전문가",
    mentor_company: params.mentorCompany?.trim() || "파트너 기업",
    is_verified_mentor: params.isVerifiedMentor ?? true,
    feedback_type: params.feedbackType,
    content: params.content.trim(),
    comment: params.content.trim(),
    is_public: params.isPublic ?? true,
    student_reply: params.studentReply || null,
  };

  console.log("[Supabase insertLiveFeedback] Sending payload to DB:", payload);

  try {
    const { data, error } = await supabase
      .from("mentor_feedbacks")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("[Supabase insertLiveFeedback] PostgREST Error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Supabase insertLiveFeedback Success] Created row in DB:", data);
    return { success: true, data };
  } catch (err: any) {
    console.error("[Supabase insertLiveFeedback] Exception:", err);
    return { success: false, error: err?.message || "피드백 저장 중 오류가 발생했습니다." };
  }
}

/**
 * 학생 답변 반영 및 해결 상태 업데이트 (Auth 도입 전까지 비활성화)
 */
export async function updateLiveFeedbackReply(
  feedbackId: string,
  reply: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "학생 답변 등록은 로그인(Auth) 기능 연결 후 활성화됩니다. (보안 보호)" };
}

// ==========================================================
// 2. 프로젝트 연결 제안 API (project_connections)
// ==========================================================

export interface InsertConnectionInput {
  sourceProjectId: string;
  targetProjectId: string;
  proposerType: "student" | "company" | "mentor";
  proposerName: string;
  proposerEmail?: string;
  message: string;
  status?: string;
}

/**
 * 특정 프로젝트와 연관된 연결 제안 목록 조회
 */
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

/**
 * 프로젝트 연결 제안을 저장합니다. (기본 상태: "대기 중")
 */
export async function insertLiveProjectConnection(
  params: InsertConnectionInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: "Supabase가 설정되지 않았습니다." };
  }

  // 필수값 검증 (TEST 3)
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

// ==========================================================
// 3. Realtime 구독 헬퍼 (STEP 6)
// ==========================================================

export function subscribeToProjectFeedbacks(
  projectId: string,
  onNewFeedback: (feedback: MentorFeedback) => void
): () => void {
  if (!supabase || !isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`feedbacks-channel-${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mentor_feedbacks",
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        const row = payload.new as any;
        const mapped: MentorFeedback = {
          id: row.id,
          mentorId: row.mentor_id || "guest-mentor",
          mentorName: row.mentor_name || "현직자 멘토",
          mentorRole: row.mentor_role || "현업 전문가",
          mentorCompany: row.mentor_company || "파트너 기업",
          isVerifiedMentor: row.is_verified_mentor ?? true,
          feedbackType: (row.feedback_type || "현업 적합성") as FeedbackType,
          comment: row.content || row.comment || "",
          studentReply: row.student_reply || undefined,
          resolved: Boolean(row.resolved || row.student_reply),
          createdAt: row.created_at ? row.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        };
        onNewFeedback(mapped);
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
