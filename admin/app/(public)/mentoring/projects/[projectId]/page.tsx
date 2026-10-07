"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  getProjectById,
  getStageInfo,
  getReviewStatusInfo,
  STAGE_LIST_STUDENT,
  STAGE_LIST_COMPANY,
  getProjectConnections,
  getMatchedCounterpartProjects,
} from "@/lib/project";
import {
  MentoringProject,
  ProjectMilestone,
  MentorFeedback,
  FeedbackType,
  ProjectConnection,
} from "@/types/project";
import {
  isSupabaseConfigured,
  getLiveProjectFeedbacks,
  insertLiveFeedback,
  updateLiveFeedbackReply,
  insertLiveProjectConnection,
} from "@/lib/supabase";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  GitBranch,
  Github,
  Globe,
  Layers,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  FileText,
  Figma,
  Play,
  RotateCcw,
  Check,
  ChevronDown,
  Bookmark,
  Share2,
  Handshake,
  Lightbulb,
  Target,
  ArrowRight,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Boxes,
  Compass,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const project = getProjectById(projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0b0e17] text-slate-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-slate-900/60 p-8 rounded-3xl border border-slate-800">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">프로젝트를 찾을 수 없습니다</h2>
          <p className="text-xs text-slate-400 mb-6">
            요청하신 프로젝트 또는 기업 Challenge가 존재하지 않거나 비공개 상태입니다.
          </p>
          <Link
            href="/mentoring"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>프로젝트 목록으로 돌아가기</span>
          </Link>
        </div>
      </div>
    );
  }

  const isStudent = project.origin === "student";
  const stageList = isStudent ? STAGE_LIST_STUDENT : STAGE_LIST_COMPANY;

  const currentStageMilestone =
    project.milestones.find((m) => m.stage === project.progressStage) ||
    project.milestones[0] || {
      id: "ms-default",
      stage: project.progressStage,
      stageNumber: 1,
      title: isStudent ? "문제 정의" : "기업 제안",
      description: project.description,
      summary: project.problem || project.description,
      status: "in_progress",
      tasks: [],
      evidence: [],
    };

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    currentStageMilestone.id
  );

  const activeMilestone =
    project.milestones.find((m) => m.id === selectedMilestoneId) ||
    currentStageMilestone;

  const [feedbackType, setFeedbackType] = useState<FeedbackType>("현업 적합성");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbacksList, setFeedbacksList] = useState<MentorFeedback[]>(project.feedbacks || []);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedTargetProject, setSelectedTargetProject] = useState<MentoringProject | null>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const [connectRelType, setConnectRelType] = useState<
    "interest" | "mentoring" | "problem_match" | "testbed" | "industry_collaboration"
  >("problem_match");

  const matchedCounterparts = useMemo(() => getMatchedCounterpartProjects(project), [project]);
  const activeConnections = useMemo(() => getProjectConnections(project.id), [project.id]);

  const stageInfo = getStageInfo(project.progressStage, project.origin);
  const reviewInfo = getReviewStatusInfo(project.mentorReviewStatus);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch live feedbacks from Supabase when configured
  useEffect(() => {
    console.log(`[Project Page] Mount. projectId: "${project.id}", isSupabaseConfigured:`, isSupabaseConfigured);
    if (!isSupabaseConfigured) {
      console.warn("[Project Page] Supabase not configured in client environment. Showing static feedbacks.");
      return;
    }

    getLiveProjectFeedbacks(project.id).then((live) => {
      console.log(`[Project Page] getLiveProjectFeedbacks("${project.id}") returned ${live.length} items:`, live);
      if (live && live.length > 0) {
        setFeedbacksList((prev) => {
          const staticOnes = project.feedbacks || [];
          console.log(`[Project Page] Merging ${live.length} live feedbacks with ${staticOnes.length} static ones.`);
          const map = new Map<string, MentorFeedback>();
          // 1. Live database rows take precedence
          live.forEach((f) => map.set(f.id, f));
          // 2. Static fallbacks added if not present
          staticOnes.forEach((f) => {
            if (!map.has(f.id)) map.set(f.id, f);
          });
          const merged = Array.from(map.values());
          console.log(`[Project Page] Resulting feedbacksList: ${merged.length} items:`, merged);
          return merged;
        });
      }
    }).catch((err) => {
      console.error("[Project Page] Error fetching live feedbacks:", err);
    });
  }, [project.id]);

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    showToast(!isBookmarked ? "관심 프로젝트로 저장되었습니다." : "관심 저장이 해제되었습니다.");
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const commentText = feedbackComment.trim();
    if (!commentText) {
      showToast("피드백 내용을 입력해 주세요.");
      return;
    }

    console.log("[Project Page] Submitting feedback for projectId:", project.id, "Configured:", isSupabaseConfigured);

    if (!isSupabaseConfigured) {
      console.error("[Project Page] Cannot submit: Supabase is not configured in client!");
      showToast("Supabase 연결이 설정되지 않았습니다. 개발 서버를 재시작해 주세요.");
      return;
    }

    // Call Supabase INSERT first (No premature fake success!)
    try {
      const res = await insertLiveFeedback({
        projectId: project.id,
        mentorName: "현직자 멘토 (게스트)",
        mentorRole: "현업 R&D 전문가",
        mentorCompany: isStudent ? "산학협력 파트너사" : project.company || "파트너 기업",
        feedbackType: feedbackType,
        content: commentText,
        isPublic: true,
      });

      console.log("[Project Page] insertLiveFeedback result:", res);

      if (res.success && res.data) {
        console.log("[Project Page] Feedback persisted with ID:", res.data.id);
        const savedFeedback: MentorFeedback = {
          id: res.data.id,
          mentorId: res.data.mentor_id || "men-user",
          mentorName: res.data.mentor_name,
          mentorRole: res.data.mentor_role || "현업 R&D 전문가",
          mentorCompany: res.data.mentor_company || (isStudent ? "산학협력 파트너사" : project.company || "파트너 기업"),
          isVerifiedMentor: Boolean(res.data.is_verified_mentor),
          feedbackType: res.data.feedback_type as FeedbackType,
          comment: res.data.content || res.data.comment || commentText,
          resolved: false,
          createdAt: res.data.created_at ? res.data.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        };

        // Add to UI ONLY on verified DB INSERT success
        setFeedbacksList((prev) => [savedFeedback, ...prev.filter((f) => f.id !== savedFeedback.id)]);
        setFeedbackComment("");
        setIsSubmittingFeedback(false);
        showToast("현업 피드백이 실시간 클라우드 DB(Supabase)에 성공적으로 저장되었습니다.");
      } else {
        console.error("[Project Page] Feedback insert failed:", res.error);
        showToast(`피드백 저장 실패: ${res.error || "DB 오류"}`);
      }
    } catch (err: any) {
      console.error("[Project Page] Feedback insert exception:", err);
      showToast(`피드백 저장 중 오류가 발생했습니다: ${err.message}`);
    }
  };

  const handleStudentReply = async (feedbackId: string) => {
    showToast("학생 답변 등록은 로그인(Auth) 기능 연결 후 활성화됩니다. (보안 보호)");
  };

  const handleOpenConnectModal = (target: MentoringProject) => {
    setSelectedTargetProject(target);
    setIsConnectModalOpen(true);
  };

  const handleConfirmConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectMessage.trim()) {
      showToast("제안 메시지를 입력해 주세요.");
      return;
    }
    if (!selectedTargetProject) return;

    setIsConnectModalOpen(false);

    if (isSupabaseConfigured) {
      const res = await insertLiveProjectConnection({
        sourceProjectId: project.id,
        targetProjectId: selectedTargetProject.id,
        proposerType: isStudent ? "student" : "company",
        proposerName: isStudent ? (project.student?.name || "학생 대표") : (project.company || "기업 담당자"),
        message: connectMessage.trim(),
        status: "대기 중",
      });
      if (res.success) {
        showToast(
          isStudent
            ? `[${selectedTargetProject?.company}] 연결 제안이 Supabase에 저장되었습니다 (상태: 대기 중).`
            : `[${selectedTargetProject?.title}] 학생 프로젝트에 산학 연계 제안이 저장되었습니다 (상태: 대기 중).`
        );
        setConnectMessage("");
        return;
      }
    }

    showToast(
      isStudent
        ? `[${selectedTargetProject?.company}] 기업 문제와의 연결 제안이 전송되었습니다.`
        : `[${selectedTargetProject?.title}] 학생 프로젝트에 산학 연계 제안이 전송되었습니다.`
    );
    setConnectMessage("");
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 font-sans pb-28">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="border-b border-slate-800/80 bg-[#0e1322]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/mentoring"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>현직자 프로젝트 멘토링 목록</span>
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isStudent
                  ? "bg-indigo-950/80 text-indigo-300 border-indigo-700/60"
                  : "bg-purple-950/80 text-purple-300 border-purple-700/60"
              }`}
            >
              {isStudent ? "[학생 제안]" : "[기업 제안]"}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-medium truncate max-w-xs">{project.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-10">
        <section className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-slate-800/80 shadow-inner group">
                <img
                  src={project.coverImage || project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121626]/90 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  {isStudent ? (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-950/90 text-indigo-300 border border-indigo-500/60 backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                      학생 제안
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-950/90 text-purple-200 border border-purple-500/60 backdrop-blur-sm shadow-sm flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-pink-400" />
                      기업 제안
                    </span>
                  )}

                  {project.projectTypes
                    .filter((t) => t !== "학생 제안" && t !== "기업 제안")
                    .map((type, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0b0e17]/90 text-slate-300 border border-slate-700/60 backdrop-blur-sm"
                      >
                        [{type}]
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {project.links?.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isStudent ? "Live Website" : "공식 웹사이트"}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                {project.links?.github && (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub 저장소</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                {project.links?.figma && (
                  <a
                    href={project.links.figma}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 transition"
                  >
                    <Figma className="w-3.5 h-3.5" />
                    <span>Figma 디자인</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                {project.links?.demo && (
                  <a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>데모 영상</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                  {isStudent ? (
                    <>
                      <span className="flex items-center gap-1 font-semibold text-cyan-400">
                        <Building2 className="w-3.5 h-3.5" />
                        {project.university}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">{project.department}</span>
                    </>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 font-semibold text-purple-400">
                        <Briefcase className="w-3.5 h-3.5" />
                        {project.company}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300">운영: {project.university}</span>
                    </>
                  )}
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{project.category}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {project.title}
                </h1>

                <p className="mt-3 text-sm text-slate-300/90 leading-relaxed bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/60">
                  {project.summary || project.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/60">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">A. 프로젝트 진행 단계</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${stageInfo.badgeClass}`}>
                    <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                    {stageInfo.fullLabel} ({project.progressPercent}%)
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">B. 현직자 검토 상태</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${reviewInfo.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${reviewInfo.dotClass}`} />
                    {reviewInfo.label}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isStudent ? "참여 팀원 및 역할 분담 (Team Roles)" : "기업 담당자 및 지도 멘토 (Industry Lead)"}</span>
                </div>
                <div className="space-y-2">
                  {project.teamMembers.map((member, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{member.name}</span>
                        <span className="text-slate-500">({member.role})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {member.contributions.map((c, ci) => (
                          <span
                            key={ci}
                            className="px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 text-[10px] border border-cyan-500/20"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">
                  {isStudent ? "활용 기술 및 도구" : "요구 기술 및 전공 역량"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300 text-xs border border-slate-700/60"
                    >
                      #{skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleToggleBookmark}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    isBookmarked
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700"
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-400 text-amber-400" : ""}`} />
                  <span>{isBookmarked ? "저장됨" : "관심 프로젝트 저장"}</span>
                </button>

                <button
                  onClick={() => setIsSubmittingFeedback(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>현직자 의견 남기기</span>
                </button>

                {matchedCounterparts.length > 0 && (
                  <button
                    onClick={() => handleOpenConnectModal(matchedCounterparts[0])}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-md shadow-purple-600/20"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>{isStudent ? "기업 문제와 연결 제안" : "학생 프로젝트와 연결 제안"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 md:p-7 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Target className="w-4 h-4" />
              <span>{isStudent ? "어떤 문제를 해결하고 싶은가? (Problem)" : "기업이 해결하고 싶은 문제 (Problem Statement)"}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-2xl border border-slate-800/60">
              {project.problem || project.description}
            </p>
          </div>

          <div className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 md:p-7 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Lightbulb className="w-4 h-4" />
              <span>{isStudent ? "현재 생각하고 있는 해결방법 (Solution & Goal)" : "프로젝트 목표 및 기대 결과물 (Solution & Outcome)"}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/60 p-4 rounded-2xl border border-slate-800/60">
              {project.solution || "구체적인 솔루션 프로토타입 및 아키텍처 구현을 마일스톤별로 진행하고 있습니다."}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-400" />
                <span>{isStudent ? "학생 프로젝트 진행 단계 (Student Stepper)" : "기업 Challenge 진행 단계 (Company Stepper)"}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                각 마일스톤을 클릭하여 해당 단계에서 생성된 실제 작업 내용과 Evidence를 검토하세요.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded-full">
              전체 진행률 {project.progressPercent}%
            </span>
          </div>

          <div className="bg-[#121626]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className={`hidden md:grid grid-cols-${stageList.length} gap-2`}>
              {stageList.map((step) => {
                const milestone = project.milestones.find((m) => m.stage === step.id);
                const isSelected = activeMilestone.stage === step.id;
                const isCurrentStage = project.progressStage === step.id;
                const isPastStage = milestone?.status === "completed";

                return (
                  <button
                    key={step.id}
                    onClick={() => milestone && setSelectedMilestoneId(milestone.id)}
                    className={`text-left p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? "bg-indigo-950/70 border-indigo-500 shadow-md shadow-indigo-950/40"
                        : isCurrentStage
                        ? "bg-cyan-950/40 border-cyan-500/60"
                        : isPastStage
                        ? "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                        : "bg-slate-900/30 border-slate-800/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-[11px] text-slate-400">
                        0{step.stageNumber}
                      </span>
                      {isPastStage ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isCurrentStage ? (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      ) : null}
                    </div>
                    <div className="text-xs font-bold text-white truncate">{step.stepName}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {isPastStage ? "완료됨" : isCurrentStage ? "현재 작업 중" : "예정"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 md:p-7 shadow-xl space-y-6">
              <div className="border-b border-slate-800/70 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                    STAGE 0{activeMilestone.stageNumber} : {activeMilestone.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeMilestone.startedAt} ~ {activeMilestone.completedAt || "진행 중"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {activeMilestone.description}
                </h3>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>단계 요약 및 목표 (Summary)</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                  {activeMilestone.summary}
                </p>
              </div>

              {activeMilestone.tasks && activeMilestone.tasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>주요 수행 작업 (Key Tasks)</span>
                  </h4>
                  <div className="space-y-2">
                    {activeMilestone.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40 text-xs"
                      >
                        <span
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            task.completed
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-slate-800 border border-slate-700 text-slate-500"
                          }`}
                        >
                          {task.completed ? <Check className="w-3 h-3" /> : null}
                        </span>
                        <span className={task.completed ? "text-slate-200" : "text-slate-400"}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeMilestone.evidence && activeMilestone.evidence.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>실제 작업 증빙 (Evidence & Deliverables)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeMilestone.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                              [{ev.type}]
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{ev.createdAt}</span>
                          </div>
                          <div className="text-xs font-bold text-white mb-1">{ev.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {ev.description}
                          </div>
                        </div>

                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 mt-1"
                          >
                            <span>자료 확인</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span>{isStudent ? "현재 필요한 협력 (Collaboration Needed)" : "기업 제공 및 참여 형태"}</span>
              </h3>
              <div className="space-y-2">
                {(project.collaborationNeedLabels || [
                  "현업 피드백 필요",
                  "기업 멘토 필요",
                  "실증기업 필요",
                ]).map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeConnections.length > 0 && (
              <div className="bg-[#121626]/90 border border-indigo-900/50 rounded-3xl p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-purple-400" />
                  <span>진행 중인 산학 매칭 (Active Connections)</span>
                </h3>
                <div className="space-y-2">
                  {activeConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-indigo-700/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                        <span>[{conn.relationshipType}]</span>
                        <span className="text-emerald-400">{conn.status === "active" ? "협력 진행 중" : "검토 중"}</span>
                      </div>
                      <div className="text-white font-bold">{conn.counterpartTitle}</div>
                      <p className="text-[11px] text-slate-400">{conn.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {matchedCounterparts.length > 0 && (
          <section className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-purple-400" />
                  <span>
                    {isStudent
                      ? "🔗 연계 가능한 기업 산학협력 Challenge"
                      : "👥 제안된 관련 학생 프로젝트 (Matching Student Projects)"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isStudent
                    ? "학생의 기술 스택 및 문제 정의와 일치하는 기업 현장 애로기술 과제입니다. 프로젝트를 기업 문제와 직접 연결할 수 있습니다."
                    : "기업이 제시한 해결 과제와 부합하는 전국 대학생 프로젝트입니다. 멘토링 제안 또는 실증 협력을 요청할 수 있습니다."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {matchedCounterparts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/60 transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="px-2 py-0.5 rounded font-bold bg-purple-950/80 text-purple-300 border border-purple-700/60">
                        {item.origin === "company" ? `[${item.company}]` : `[${item.university}]`}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">{item.category}</span>
                    </div>
                    <Link
                      href={`/mentoring/projects/${item.id}`}
                      className="text-xs sm:text-sm font-bold text-white hover:text-indigo-400 transition line-clamp-1 block"
                    >
                      {item.title}
                    </Link>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.summary || item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <Link
                      href={`/mentoring/projects/${item.id}`}
                      className="text-xs text-slate-400 hover:text-white transition font-medium"
                    >
                      상세보기
                    </Link>
                    <button
                      onClick={() => handleOpenConnectModal(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
                    >
                      <Handshake className="w-3 h-3" />
                      <span>연결 제안</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-[#121626]/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>현직자 피드백 및 개선 기록 (Feedback & Evolution)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                현업 전문가의 조언과 학생의 개선 과정(Before & After)을 투명하게 기록합니다.
              </p>
            </div>
            <button
              onClick={() => setIsSubmittingFeedback(!isSubmittingFeedback)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isSubmittingFeedback ? "작성 취소" : "새 피드백 작성"}</span>
            </button>
          </div>

          {isSubmittingFeedback && (
            <form
              onSubmit={handleAddFeedback}
              className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-700/50 space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">피드백 유형:</span>
                {[
                  "기술",
                  "현업 적합성",
                  "UX/UI",
                  "사업성",
                  "데이터",
                  "제조",
                  "실증",
                  "안전",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFeedbackType(type as FeedbackType)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      feedbackType === type
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="프로젝트의 문제 정의, 기술적 타당성, 현업 적용 가능성에 대해 구체적인 조언을 남겨주세요."
                  rows={3}
                  className="w-full bg-[#171e35] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>피드백 등록하기</span>
                </button>
              </div>
            </form>
          )}

          <div className="space-y-5">
            {feedbacksList.map((fb) => (
              <div
                key={fb.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                      {fb.mentorName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs">{fb.mentorName}</span>
                        {fb.isVerifiedMentor && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fb.mentorCompany} · {fb.mentorRole}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                      [{fb.feedbackType}]
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{fb.createdAt}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-[#171e35]/60 p-3.5 rounded-xl border border-slate-800/60">
                  &quot;{fb.comment}&quot;
                </p>

                {(fb.beforeDescription || fb.afterDescription) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-rose-900/30 text-xs">
                      <span className="text-[10px] font-bold text-rose-400 block mb-1">
                        BEFORE (피드백 전 상태)
                      </span>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {fb.beforeDescription}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-900/30 text-xs">
                      <span className="text-[10px] font-bold text-emerald-400 block mb-1">
                        AFTER (피드백 반영 개선)
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed font-medium">
                        {fb.afterDescription}
                      </p>
                    </div>
                  </div>
                )}

                {fb.studentReply ? (
                  <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-cyan-300 font-bold">
                      <span>학생 피드백 반영 완료</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <p className="text-slate-200 leading-relaxed">{fb.studentReply}</p>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-800/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>학생 반영 답변 작성하기</span>
                      <span className="text-[10px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                        🔒 학생 로그인 연동 후 활성화 (보안 정책 적용)
                      </span>
                    </div>
                    <div className="flex gap-2 opacity-60">
                      <input
                        type="text"
                        disabled
                        placeholder="학생 로그인 후 본인 프로젝트 피드백에 답변할 수 있습니다."
                        className="flex-1 bg-[#171e35] border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-400 cursor-not-allowed"
                      />
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-slate-700 text-slate-400 text-xs font-bold cursor-not-allowed"
                      >
                        답변 등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {isConnectModalOpen && selectedTargetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121626] border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Handshake className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {isStudent ? "기업 문제와 프로젝트 연결 제안" : "학생 프로젝트와 산학 연계 제안"}
                </h3>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">연결 대상:</div>
              <div className="text-white font-bold text-sm">{selectedTargetProject.title}</div>
              <div className="text-cyan-400">
                {selectedTargetProject.origin === "company"
                  ? `${selectedTargetProject.company} (기업 Challenge)`
                  : `${selectedTargetProject.university} · ${selectedTargetProject.department}`}
              </div>
            </div>

            <form onSubmit={handleConfirmConnection} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">
                  희망 연계 형태
                </label>
                <select
                  value={connectRelType}
                  onChange={(e) => setConnectRelType(e.target.value as any)}
                  className="w-full bg-[#171e35] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="problem_match">기업 문제 해결 연계 (Problem Match)</option>
                  <option value="mentoring">현업 멘토링 및 기술 검토 (Mentoring)</option>
                  <option value="testbed">실증 테스트베드 협력 (Testbed)</option>
                  <option value="industry_collaboration">정규 산학협력 프로젝트 전환</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">
                  제안 메시지
                </label>
                <textarea
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  placeholder="어떤 방식으로 두 프로젝트를 연계하여 시너지를 내고자 하는지 간단히 작성해주세요."
                  rows={3}
                  className="w-full bg-[#171e35] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30"
                >
                  연결 제안 전송
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
