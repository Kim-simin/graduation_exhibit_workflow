"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  GraduationCap,
  Sparkles,
  GitBranch,
  Clock,
  Briefcase,
  RotateCcw,
  X,
  Layers,
  CheckCircle2,
  Filter,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  HelpCircle,
} from "lucide-react";
import {
  getProjects,
  filterProjects,
  getProjectSummaryMetrics,
  STAGE_LIST_STUDENT,
  STAGE_LIST_COMPANY,
  REVIEW_STATUS_LIST,
  COLLABORATION_NEEDS_LIST,
  PROJECT_CATEGORIES,
  PROJECT_TYPES_FILTER,
} from "@/lib/project";
import { ProjectOrigin } from "@/types/project";
import ProjectCard from "@/components/mentoring/ProjectCard";

const UNIVERSITY_OPTIONS = [
  { id: "all", label: "전체 대학교 / 공유대학" },
  { id: "부산경상대학교", label: "부산경상대학교" },
  { id: "부산대학교", label: "부산대학교 (PNU)" },
  { id: "국립부경대학교", label: "국립부경대학교 (PKNU)" },
  { id: "동아대학교", label: "동아대학교" },
  { id: "UNIST", label: "UNIST (울산과학기술원)" },
  { id: "부산공유대학", label: "부산공유대학 14개 대학" },
  { id: "USG 공유대학", label: "USG 공유대학 (동남권)" },
  { id: "DSC 공유대학", label: "DSC 공유대학 (중부권)" },
  { id: "홍익대학교", label: "홍익대학교" },
  { id: "국민대학교", label: "국민대학교" },
  { id: "서울여자대학교", label: "서울여자대학교" },
];

const MAJOR_OPTIONS = [
  { id: "all", label: "전체 전공 / 관련 분야" },
  { id: "컴퓨터공학과", label: "💻 컴퓨터공학 / AI / SW" },
  { id: "디지털크리에이터과", label: "🎬 디지털크리에이터 / 미디어콘텐츠" },
  { id: "기계공학과", label: "⚙️ 기계공학 / 메카트로닉스 / 로봇" },
  { id: "시각디자인학과", label: "🎨 시각디자인 / UX/UI / 브랜드" },
  { id: "산업디자인학과", label: "🔩 산업디자인 / 제품인터랙션" },
  { id: "조선해양공학", label: "🚢 조선해양공학 / 스마트야드" },
  { id: "전자공학", label: "⚡ 전기전자 / 반도체 / IoT" },
  { id: "바이오메디컬", label: "🧬 바이오 / 의료 / 헬스케어" },
];

const SORT_OPTIONS = [
  { id: "recent_update", label: "최근 업데이트순" },
  { id: "review_requested", label: "현직자 검토 요청순" },
  { id: "in_progress", label: "진행 중 프로젝트" },
  { id: "connectable", label: "기업 연결 가능" },
  { id: "testbed_needed", label: "실증 필요 우선" },
];

export default function MentoringProjectsPage() {
  // Single Source of Truth: 검증된 데이터만 로드 및 ID 기준 중복 제거 (De-duplication)
  const allProjects = useMemo(() => {
    const list = getProjects();
    return Array.from(new Map(list.map((p) => [p.id, p])).values());
  }, []);

  const [activeOriginTab, setActiveOriginTab] = useState<"all" | "student" | "company">("all");

  const [selectedUniv, setSelectedUniv] = useState<string>("all");
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProjectType, setSelectedProjectType] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedCollabNeed, setSelectedCollabNeed] = useState<string>("all");
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<any>("recent_update");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProjects = useMemo(() => {
    return filterProjects(allProjects, {
      origin: activeOriginTab,
      university: selectedUniv,
      department: selectedMajor,
      category: selectedCategory,
      projectType: selectedProjectType,
      stage: selectedStage,
      collaborationNeed: selectedCollabNeed,
      reviewStatus: selectedReviewStatus,
      searchQuery: searchQuery,
      sort: selectedSort,
    });
  }, [
    allProjects,
    activeOriginTab,
    selectedUniv,
    selectedMajor,
    selectedCategory,
    selectedProjectType,
    selectedStage,
    selectedCollabNeed,
    selectedReviewStatus,
    searchQuery,
    selectedSort,
  ]);

  const summaryMetrics = useMemo(() => {
    return getProjectSummaryMetrics(allProjects);
  }, [allProjects]);

  const handleResetFilters = () => {
    setSelectedUniv("all");
    setSelectedMajor("all");
    setSelectedCategory("all");
    setSelectedProjectType("all");
    setSelectedStage("all");
    setSelectedCollabNeed("all");
    setSelectedReviewStatus("all");
    setSelectedSort("recent_update");
    setSearchQuery("");
  };

  const isFilterActive =
    selectedUniv !== "all" ||
    selectedMajor !== "all" ||
    selectedCategory !== "all" ||
    selectedProjectType !== "all" ||
    selectedStage !== "all" ||
    selectedCollabNeed !== "all" ||
    selectedReviewStatus !== "all" ||
    selectedSort !== "recent_update" ||
    searchQuery.trim() !== "";

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 font-sans pb-24">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#13192a] via-[#0f1424] to-[#0b0e17] pt-12 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              PROJECT × INDUSTRY MENTORING
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              양방향 프로젝트 매칭 플랫폼
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            프로젝트 현직자 멘토링
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            학생이 준비 중인 프로젝트와 기업이 제안한 산학협력 Challenge를 함께 확인하고,
            현업 피드백 · 멘토링 · 실증 · 산학협력 연결을 만들 수 있습니다.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">학생 제안 프로젝트</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {summaryMetrics.studentCount}건
                </p>
              </div>
            </div>

            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">기업 제안 Challenge</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {summaryMetrics.companyCount}건
                </p>
              </div>
            </div>

            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">현직자 검토 요청</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {summaryMetrics.reviewRequestedCount}건
                </p>
              </div>
            </div>

            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">산학 양방향 연계</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {summaryMetrics.connectedCount}건 매칭
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top Navigation Tabs */}
      <section className="bg-[#0e1322] border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveOriginTab("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeOriginTab === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>전체 프로젝트</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeOriginTab === "all" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {summaryMetrics.total}
              </span>
            </button>

            <button
              onClick={() => setActiveOriginTab("student")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeOriginTab === "student"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>학생 제안</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeOriginTab === "student" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {summaryMetrics.studentCount}
              </span>
            </button>

            <button
              onClick={() => setActiveOriginTab("company")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeOriginTab === "company"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>기업 제안</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeOriginTab === "company" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}
              >
                {summaryMetrics.companyCount}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Multi-dimensional Filters & Search Bar */}
      <section className="relative z-20 bg-[#0f1424] border-b border-slate-800/80 py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">소속 대학:</span>
                <select
                  value={selectedUniv}
                  onChange={(e) => setSelectedUniv(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {UNIVERSITY_OPTIONS.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#171e35] text-white">
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">전공:</span>
                <select
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {MAJOR_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#171e35] text-white">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">분야:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {PROJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat === "전체 분야" ? "all" : cat} className="bg-[#171e35] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Tag className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">유형:</span>
                <select
                  value={selectedProjectType}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {PROJECT_TYPES_FILTER.map((pt) => (
                    <option key={pt} value={pt === "전체 유형" ? "all" : pt} className="bg-[#171e35] text-white">
                      {pt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <GitBranch className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">진행 단계:</span>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#171e35] text-white">전체 단계</option>
                  <option value="problem_definition" className="bg-[#171e35] text-white">문제 정의 / 대학 검토</option>
                  <option value="solution" className="bg-[#171e35] text-white">해결방안 도출 / 학생 모집</option>
                  <option value="planning" className="bg-[#171e35] text-white">기획·설계 / 학생 매칭</option>
                  <option value="production" className="bg-[#171e35] text-white">제작·실험 / 프로젝트 수행</option>
                  <option value="validation" className="bg-[#171e35] text-white">검증·개선 / 기업 실증</option>
                  <option value="completed" className="bg-[#171e35] text-white">완료</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">필요한 협력:</span>
                <select
                  value={selectedCollabNeed}
                  onChange={(e) => setSelectedCollabNeed(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#171e35] text-white">전체 협력</option>
                  {COLLABORATION_NEEDS_LIST.map((cn) => (
                    <option key={cn.id} value={cn.id} className="bg-[#171e35] text-white">
                      {cn.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">검토 상태:</span>
                <select
                  value={selectedReviewStatus}
                  onChange={(e) => setSelectedReviewStatus(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#171e35] text-white">전체 검토 상태</option>
                  {REVIEW_STATUS_LIST.map((rs) => (
                    <option key={rs.id} value={rs.id} className="bg-[#171e35] text-white">
                      {rs.label}
                    </option>
                  ))}
                </select>
              </div>

              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  title="필터 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>초기화</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[240px] lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="프로젝트명, 학생, 대학, 기업, 기술 검색..."
                  className="w-full bg-[#171e35] border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[#171e35] px-2.5 py-1.5 rounded-xl border border-slate-700/80 shrink-0">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                >
                  {SORT_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#171e35] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Project Card Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <p>
            {activeOriginTab === "all"
              ? "학생이 제안한 프로젝트와 기업이 제안한 산학협력 Challenge를 함께 탐색하고 피드백과 실증 협의를 진행하세요."
              : activeOriginTab === "student"
              ? "전국 대학생들이 직접 문제를 정의하고 기획·제작 중인 프로젝트의 실제 진행 과정과 Evidence를 확인하세요."
              : "기업이 현장 애로기술 해결을 위해 직접 제안한 산학협력 IP 및 Challenge 과제 목록입니다."}
          </p>
          <span className="font-mono text-slate-400 font-semibold bg-slate-900/60 px-3 py-1 rounded-xl border border-slate-800">
            총 {filteredProjects.length}개 프로젝트
          </span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8 max-w-xl mx-auto">
            <GitBranch className="w-12 h-12 text-slate-600 mx-auto mb-3.5" />
            <h3 className="text-base font-bold text-slate-200 mb-1.5">
              {allProjects.length === 0
                ? "등록된 프로젝트가 없습니다."
                : activeOriginTab === "student"
                ? "아직 공개된 학생 프로젝트가 없습니다."
                : activeOriginTab === "company"
                ? "현재 공개된 기업 Challenge가 없습니다."
                : "조건에 일치하는 프로젝트가 없습니다."}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              {allProjects.length === 0
                ? "현재 등록된 프로젝트가 없습니다."
                : activeOriginTab === "student"
                ? "학생 프로젝트가 등록되면 실시간 진행 과정과 검토 요청을 이곳에서 확인할 수 있습니다."
                : activeOriginTab === "company"
                ? "기업 산학협력 과제가 승인되는 대로 업데이트됩니다."
                : "선택하신 필터 조건을 변경하거나 검색어를 재설정해 보세요."}
            </p>
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shadow-indigo-600/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>필터 초기화</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
