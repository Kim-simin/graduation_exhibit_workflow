"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Building2,
  Sparkles,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Calendar,
  Tag,
  Users,
  Compass,
} from "lucide-react";
import { insertMentoringProject } from "@/lib/supabase";

const STUDENT_PROJECT_TYPES = [
  "개인 프로젝트",
  "졸업작품",
  "캡스톤디자인",
  "창업 프로젝트",
  "공유대학 프로젝트",
  "연구 프로젝트",
  "기타",
];

const STUDENT_STAGES = [
  { id: "problem_definition", label: "문제 정의" },
  { id: "solution", label: "해결방안 도출" },
  { id: "planning", label: "기획·설계" },
  { id: "production", label: "제작·실험" },
  { id: "validation", label: "검증·개선" },
  { id: "completed", label: "완료" },
];

const COMPANY_CHALLENGE_TYPES = [
  "산학협력 IP",
  "기업 애로기술",
  "실증 과제",
  "PBL 과제",
  "공동 R&D",
  "기타",
];

const COMPANY_STAGES = [
  { id: "preparation", label: "기업 제안" },
  { id: "problem_definition", label: "대학 검토" },
  { id: "solution", label: "학생 모집 중" },
  { id: "planning", label: "학생 매칭" },
  { id: "production", label: "프로젝트 수행" },
  { id: "validation", label: "기업 검토·실증" },
  { id: "completed", label: "완료" },
];

const COLLABORATION_OPTIONS = [
  "현업 피드백",
  "기업 멘토",
  "데이터 제공/수급",
  "장비/시설 지원",
  "실증기업 / 테스트베드",
  "기업 문제 연결",
  "공동개발",
];

const MENTOR_FIELDS = [
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

export default function NewMentoringProjectPage() {
  const router = useRouter();

  // 1. Post Type
  const [sourceType, setSourceType] = useState<"student" | "company">("student");

  // Common & Student Fields
  const [title, setTitle] = useState("");
  const [school, setSchool] = useState("");
  const [department, setDepartment] = useState("");
  const [teamName, setTeamName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("졸업작품");
  const [stage, setStage] = useState("problem_definition");
  const [progress, setProgress] = useState<number>(30);
  const [cooperation, setCooperation] = useState("현업 피드백");
  const [techTagsInput, setTechTagsInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [mentorField, setMentorField] = useState("AI / Software");

  // Company Specific Fields
  const [companyName, setCompanyName] = useState("");
  const [problemDefinition, setProblemDefinition] = useState("");
  const [requirements, setRequirements] = useState("");
  const [supportBenefit, setSupportBenefit] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Switch type handler
  const handleTypeChange = (type: "student" | "company") => {
    setSourceType(type);
    if (type === "student") {
      setProjectType("졸업작품");
      setStage("problem_definition");
    } else {
      setProjectType("산학협력 IP");
      setStage("preparation");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage("프로젝트명을 입력해 주세요.");
      return;
    }
    if (!summary.trim()) {
      setErrorMessage("한 줄 소개를 입력해 주세요.");
      return;
    }

    if (sourceType === "student") {
      if (!school.trim()) {
        setErrorMessage("학교명을 입력해 주세요.");
        return;
      }
      if (!department.trim()) {
        setErrorMessage("학과/전공을 입력해 주세요.");
        return;
      }
      if (!teamName.trim()) {
        setErrorMessage("참여 학생 또는 팀명을 입력해 주세요.");
        return;
      }
      if (!description.trim()) {
        setErrorMessage("프로젝트 설명을 입력해 주세요.");
        return;
      }
    } else {
      if (!companyName.trim()) {
        setErrorMessage("기업/기관명을 입력해 주세요.");
        return;
      }
      if (!problemDefinition.trim()) {
        setErrorMessage("문제 정의(해결이 필요한 산업 문제)를 입력해 주세요.");
        return;
      }
      if (!description.trim()) {
        setErrorMessage("과제 세부 내용을 입력해 주세요.");
        return;
      }
    }

    // Parse tech tags
    const techTags = techTagsInput
      .split(/[,#\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      source_type: sourceType,
      title: title.trim(),
      school: sourceType === "student" ? school.trim() : undefined,
      department: sourceType === "student" ? department.trim() : undefined,
      team_name: sourceType === "student" ? teamName.trim() : undefined,
      company_name: sourceType === "company" ? companyName.trim() : undefined,
      summary: summary.trim(),
      description: description.trim(),
      project_type: projectType,
      stage: stage,
      progress: Math.min(100, Math.max(0, Number(progress) || 0)),
      cooperation: cooperation,
      tech_tags: techTags,
      image_url: imageUrl.trim() || undefined,
      github_url: githubUrl.trim() || undefined,
      service_url: serviceUrl.trim() || undefined,
      portfolio_url: portfolioUrl.trim() || undefined,
      start_date: startDate || undefined,
      mentor_field: mentorField,
      problem_definition: sourceType === "company" ? problemDefinition.trim() : undefined,
      requirements: sourceType === "company" ? requirements.trim() : undefined,
      support_benefit: sourceType === "company" ? supportBenefit.trim() : undefined,
      contact_person: sourceType === "company" ? contactPerson.trim() : undefined,
      contact_email: sourceType === "company" ? contactEmail.trim() : undefined,
      contact_phone: sourceType === "company" ? contactPhone.trim() : undefined,
    };

    setIsSubmitting(true);

    try {
      const result = await insertMentoringProject(payload);
      if (!result.success) {
        setErrorMessage(result.error || "등록에 실패했습니다. 다시 시도해 주세요.");
        setIsSubmitting(false);
        return;
      }

      setSuccessToast(true);
      setTimeout(() => {
        router.push("/mentoring");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "저장 중 예기치 않은 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 font-sans pb-24">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">
            프로젝트가 성공적으로 등록되었습니다! 목록으로 이동합니다.
          </span>
        </div>
      )}

      {/* Header */}
      <section className="relative border-b border-slate-800/80 bg-gradient-to-b from-[#13192a] via-[#0f1424] to-[#0b0e17] pt-10 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/mentoring"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>현직자 멘토링 허브로 돌아가기</span>
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              NEW PROJECT / CHALLENGE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            신규 프로젝트 · 챌린지 등록
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            학생 연구 성과물 또는 기업 산업 과제를 등록하여 현직자 피드백과 산학 연계를 시작하세요.
          </p>
        </div>
      </section>

      {/* Main Content Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {/* Step 1: Post Type Selection */}
        <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-6 mb-8 shadow-sm">
          <label className="block text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
            1. 게시물 유형 선택 <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeChange("student")}
              className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                sourceType === "student"
                  ? "bg-indigo-950/50 border-indigo-500/80 ring-2 ring-indigo-500/30 text-white"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  sourceType === "student"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">학생 제안 프로젝트</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  졸업작품, 캡스톤디자인, 개인 프로젝트 등을 등록하고 현업 멘토의 리뷰와 조언을 요청합니다.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("company")}
              className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                sourceType === "company"
                  ? "bg-purple-950/50 border-purple-500/80 ring-2 ring-purple-500/30 text-white"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  sourceType === "company"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">기업 제안 Challenge</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  기업이 당면한 산업 현장 문제나 R&D 과제를 제안하여 우수 대학생 팀과 실증 해결을 도모합니다.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-600/50 flex items-center gap-3 text-rose-200 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Basic Information */}
          <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>기본 정보</span>
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {sourceType === "student" ? "프로젝트명" : "Challenge 과제명"}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  sourceType === "student"
                    ? "예: 에지 AI 기반 조선소 스마트 안전관제 플랫폼"
                    : "예: UAM 버티포트 여객 탑승 여정 공간 UX 표준화"
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-xs sm:text-sm outline-none"
              />
            </div>

            {/* Student specific: School & Department */}
            {sourceType === "student" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    학교명 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="예: 부산경상대학교, 부산대학교 등"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    학과 / 전공 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="예: AI문화콘텐츠스쿨, 컴퓨터공학과"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {/* Company specific: Company Name */}
            {sourceType === "company" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  기업 / 기관명 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="예: 한화시스템, 현대중공업, 한국조선해양"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                />
              </div>
            )}

            {/* Team / Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {sourceType === "student" ? "참여 학생 또는 팀명" : "과제 담당자 성함 / 직함"}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={sourceType === "student" ? teamName : contactPerson}
                onChange={(e) =>
                  sourceType === "student"
                    ? setTeamName(e.target.value)
                    : setContactPerson(e.target.value)
                }
                placeholder={
                  sourceType === "student"
                    ? "예: 김시민 (개인) 또는 비전AI랩팀"
                    : "예: 김영수 수석연구원 / 산학협력팀"
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                한 줄 소개 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="핵심 목표와 가치를 1문장으로 요약해 주세요."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
              />
            </div>

            {/* Company specific: Problem Definition */}
            {sourceType === "company" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  문제 정의 (해결이 필요한 실제 산업 현장 문제){" "}
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={problemDefinition}
                  onChange={(e) => setProblemDefinition(e.target.value)}
                  placeholder="기업이 겪고 있는 페인포인트나 기술적 난제를 구체적으로 기술해 주세요."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {sourceType === "student" ? "프로젝트 상세 설명" : "과제 세부 내용 / 요구사항"}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  sourceType === "student"
                    ? "어떤 문제를 해결하고자 하며 현재 어떤 기술 스택과 아키텍처로 구현 중인지 작성해 주세요."
                    : "학생 팀이 개발해야 할 목표 결과물 및 수행 범위를 상세히 적어주세요."
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Project Status & Cooperation */}
          <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>진행 단계 및 협력 요건</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {sourceType === "student" ? "프로젝트 유형" : "과제 유형"}{" "}
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                >
                  {(sourceType === "student" ? STUDENT_PROJECT_TYPES : COMPANY_CHALLENGE_TYPES).map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Progress Stage */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  현재 단계 <span className="text-rose-400">*</span>
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                >
                  {(sourceType === "student" ? STUDENT_STAGES : COMPANY_STAGES).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progress Percent (0 to 100 Slider + Number) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  전체 진행률 (%) <span className="text-rose-400">*</span>
                </label>
                <span className="text-xs font-mono font-bold text-indigo-400">{progress}%</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) =>
                    setProgress(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs text-center font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Collaboration Need */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  필요한 협력 분야 <span className="text-rose-400">*</span>
                </label>
                <select
                  value={cooperation}
                  onChange={(e) => setCooperation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                >
                  {COLLABORATION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mentor Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  희망 멘토 전문 분야 <span className="text-slate-500">(선택)</span>
                </label>
                <select
                  value={mentorField}
                  onChange={(e) => setMentorField(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                >
                  {MENTOR_FIELDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tech Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                기술 태그 <span className="text-rose-400">*</span>{" "}
                <span className="text-slate-500 font-normal">(쉼표 또는 띄어쓰기로 구분)</span>
              </label>
              <input
                type="text"
                value={techTagsInput}
                onChange={(e) => setTechTagsInput(e.target.value)}
                placeholder="예: Next.js, TypeScript, Tailwind CSS, ROS2, PyTorch"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
              />
            </div>
          </div>

          {/* Section: Additional Links & Contacts */}
          <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-cyan-400" />
              <span>연계 링크 및 상세 정보 (선택)</span>
            </h2>

            {/* Representative Image URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                대표 이미지 URL <span className="text-slate-500 font-normal">(선택, 미입력 시 표준 배너 기본 적용)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
              />
            </div>

            {/* URLs for Students */}
            {sourceType === "student" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    서비스 / 데모 URL
                  </label>
                  <input
                    type="url"
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    포트폴리오 URL
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>
            )}

            {/* Company Specific Support Benefit & Contacts */}
            {sourceType === "company" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    지원 혜택 (연구비, 실증 데이터, 현업 멘토링, 채용 우대 등)
                  </label>
                  <textarea
                    rows={2}
                    value={supportBenefit}
                    onChange={(e) => setSupportBenefit(e.target.value)}
                    placeholder="학생 팀 선발 시 기업에서 제공하는 지원 사항을 작성해 주세요."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      담당자 이메일
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      담당자 연락처
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                프로젝트 시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-60 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white text-xs sm:text-sm outline-none"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
            <Link
              href="/mentoring"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-xs sm:text-sm text-center transition"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Supabase DB에 등록 중..." : "프로젝트 등록 완료"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
