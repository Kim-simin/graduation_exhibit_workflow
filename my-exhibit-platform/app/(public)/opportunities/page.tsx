"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Search,
  Filter,
  Layers,
  Sparkles,
  Building2,
  GraduationCap,
  Calendar,
  Wrench,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Cpu,
  Clock,
  Briefcase,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getOpportunities, getEquipments, isStudentRnDOpportunity } from "@/lib/opportunity";
import { Opportunity, Equipment, OpportunityType, OpportunityStatus, AccessScope } from "@/types/opportunity";
import OpportunityCard from "@/components/opportunity/OpportunityCard";
import EquipmentCard from "@/components/opportunity/EquipmentCard";
import ResourceDetailModal from "@/components/opportunity/ResourceDetailModal";

const UNIVERSITY_OPTIONS = [
  { id: "all", label: "전체 대학교 (전국/공유대학)" },
  { id: "부산대학교", label: "부산대학교 (PNU)" },
  { id: "UNIST", label: "UNIST (울산과학기술원)" },
  { id: "부산공유대학", label: "부산공유대학 14개 참여대학" },
  { id: "국립부경대학교", label: "국립부경대학교" },
  { id: "동아대학교", label: "동아대학교" },
  { id: "국립한국해양대학교", label: "국립한국해양대학교" },
  { id: "한양대학교", label: "한양대학교 (ERICA 연계)" },
];

const MAJOR_OPTIONS = [
  { id: "all", label: "전체 전공 (제한 없음)" },
  { id: "컴퓨터공학과", label: "💻 컴퓨터공학 / 소프트웨어 / 인공지능" },
  { id: "기계공학과", label: "⚙️ 기계공학 / 메카트로닉스 / 로봇" },
  { id: "디자인학과", label: "🎨 시각디자인 / 산업디자인 / 제품디자인" },
  { id: "신소재공학과", label: "🔬 신소재공학 / 화학 / 물리학" },
  { id: "전기전자공학과", label: "⚡ 전기전자공학 / 반도체공학" },
  { id: "경영학과", label: "📊 경영 / 기술창업 / 창업기획" },
  { id: "건축공학과", label: "🏛️ 건축학 / 실내건축디자인" },
  { id: "바이오메디컬", label: "🧪 바이오 / 생명과학 / 환경공학" },
];

export default function OpportunitiesPage() {
  const [referenceTime, setReferenceTime] = useState<string | undefined>(undefined);
  useEffect(() => {
    const refreshTime = () => setReferenceTime(new Date().toISOString());
    refreshTime();
    const timer = window.setInterval(refreshTime, 60_000);
    window.addEventListener("focus", refreshTime);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshTime);
    };
  }, []);
  const allOpportunities = useMemo(() => getOpportunities(referenceTime).filter(o => o.approvalStatus === "PUBLISHED"), [referenceTime]);
  const allEquipments = useMemo(() => getEquipments(), []);

  // Filter States
  const [selectedUniv, setSelectedUniv] = useState<string>("all");
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"ALL" | "RESOURCES" | "RND" | "PROJECTS" | "EQUIPMENT">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [equipmentCategory, setEquipmentCategory] = useState<string>("all");

  // Modal State
  const [selectedItem, setSelectedItem] = useState<Opportunity | Equipment | null>(null);
  const [selectedKind, setSelectedKind] = useState<"OPPORTUNITY" | "EQUIPMENT" | null>(null);

  // General Filtered Opportunities (with Search & Status)
  const filteredOpportunities = useMemo(() => {
    return allOpportunities.filter((opp) => {
      // University filter
      if (selectedUniv !== "all") {
        const uMatch =
          opp.crossUniversityAvailable ||
          opp.eligibleUniversities.includes("ALL") ||
          opp.eligibleUniversities.some((u) => u.includes(selectedUniv) || selectedUniv.includes(u));
        if (!uMatch) return false;
      }

      // Major filter
      if (selectedMajor !== "all") {
        const mClean = selectedMajor.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
        const isAllEligible = !opp.majorRestriction || opp.eligibleMajors.includes("ALL");
        if (!isAllEligible) {
          const matchMajor = opp.eligibleMajors.some((em) => {
            const emClean = em.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
            return emClean.includes(mClean) || mClean.includes(emClean);
          });
          const matchTag = opp.tags.some((t) => t.toLowerCase().includes(mClean));
          const matchField = opp.fields.some((f) => f.toLowerCase().includes(mClean));
          if (!matchMajor && !matchTag && !matchField) return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && opp.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = opp.title.toLowerCase().includes(q);
        const matchDesc = opp.description.toLowerCase().includes(q);
        const matchProvider = opp.providerName.toLowerCase().includes(q);
        const matchTags = opp.tags.some((t) => t.toLowerCase().includes(q));
        const matchTech = opp.technologies.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchProvider && !matchTags && !matchTech) {
          return false;
        }
      }

      return true;
    });
  }, [allOpportunities, selectedUniv, selectedMajor, statusFilter, searchQuery]);

  // Filtered Equipments
  const filteredEquipments = useMemo(() => {
    return allEquipments.filter((eq) => {
      // University filter
      if (selectedUniv !== "all") {
        const uMatch =
          eq.external_user_access ||
          eq.university.includes(selectedUniv) ||
          selectedUniv.includes(eq.university);
        if (!uMatch) return false;
      }

      // Major filter
      if (selectedMajor !== "all") {
        const mClean = selectedMajor.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
        const majorMatch =
          eq.related_majors.some((rm) => {
            const rmClean = rm.replace(/학과|전공|학부|과/g, "").trim().toLowerCase();
            return rmClean.includes(mClean) || mClean.includes(rmClean);
          }) || eq.tags.some((t) => t.toLowerCase().includes(mClean));
        if (!majorMatch) return false;
      }

      // Equipment Category filter
      if (equipmentCategory !== "all" && eq.equipment_category !== equipmentCategory) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = eq.equipment_name.toLowerCase().includes(q);
        const matchModel = (eq.model || "").toLowerCase().includes(q);
        const matchWork = (eq.supported_work || eq.supported_research || "").toLowerCase().includes(q);
        const matchTags = eq.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchModel && !matchWork && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }, [allEquipments, selectedUniv, selectedMajor, equipmentCategory, searchQuery]);

  // Derived sections for the 4 core student questions
  const section1Resources = useMemo(() => {
    return filteredOpportunities.filter(
      (o) =>
        o.type === "SHARED_INFRASTRUCTURE" ||
        o.type === "EDUCATION" ||
        o.type === "EQUIPMENT" ||
        o.type === "RESEARCH_EQUIPMENT"
    );
  }, [filteredOpportunities]);

  const section2RnD = useMemo(() => {
    return filteredOpportunities.filter(o => isStudentRnDOpportunity(o, referenceTime));
  }, [filteredOpportunities, referenceTime]);

  const section3Projects = useMemo(() => {
    return filteredOpportunities.filter(
      (o) =>
        (o.type === "CAPSTONE" ||
          o.type === "COMPETITION" ||
          o.type === "MULTIDISCIPLINARY" ||
          o.type === "STARTUP" ||
          isStudentRnDOpportunity(o, referenceTime)) &&
        (o.status === "OPEN" || o.status === "UPCOMING")
    );
  }, [filteredOpportunities, referenceTime]);

  const handleOpenOpportunityModal = (opp: Opportunity) => {
    setSelectedItem(opp);
    setSelectedKind("OPPORTUNITY");
  };

  const handleOpenEquipmentModal = (eq: Equipment) => {
    setSelectedItem(eq);
    setSelectedKind("EQUIPMENT");
  };

  const handleResetFilters = () => {
    setSelectedUniv("all");
    setSelectedMajor("all");
    setActiveTab("ALL");
    setSearchQuery("");
    setStatusFilter("all");
    setEquipmentCategory("all");
  };

  // Distinct equipment categories
  const equipmentCategories = useMemo(() => {
    const set = new Set<string>();
    allEquipments.forEach((e) => {
      if (e.equipment_category) set.add(e.equipment_category);
    });
    return Array.from(set);
  }, [allEquipments]);

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 font-sans pb-24">
      {/* 1. Header Banner */}
      <section className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#13192a] via-[#0f1424] to-[#0b0e17] pt-12 pb-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              공식 출처 기반 공유자원·모집 정보
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              대학·지자체·컨소시엄 정품 데이터
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50">
              R&D 모집기간 현재 시각 기준
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            전국 대학 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400">공유자원 & 실전 R&D·프로젝트</span> 허브
          </h1>
          <p className="mt-3.5 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            학생이 자신의 <strong>소속 학교</strong>와 <strong>전공</strong>을 기준으로 지금 즉시 신청 가능한
            공유 캠퍼스 인프라, 실전 산학 R&D, 캡스톤 프로젝트, 최첨단 연구장비를 원클릭으로 탐색하고 공식 신청하세요.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">내 전공 사용 가능 자원</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">{section1Resources.length}건</p>
              </div>
            </div>

            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">지금 참여 가능한 R&D</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">{section2RnD.length}건</p>
              </div>
            </div>

            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">모집 중인 프로젝트</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">
                  {section3Projects.filter((p) => p.status === "OPEN" || p.status === "UPCOMING").length}건
                </p>
              </div>
            </div>

            <div className="bg-[#151a2e]/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">개방 연구·제작 장비</p>
                <p className="text-xl font-extrabold text-white font-mono mt-0.5">{filteredEquipments.length}종</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Discovery Filters (Sticky Bar) */}
      <section className="sticky top-16 z-40 bg-[#0f1424]/95 backdrop-blur-md border-b border-slate-800/80 py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* School & Major Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
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

              <div className="flex items-center gap-2 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">내 전공:</span>
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

              <div className="flex items-center gap-2 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">모집 상태:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-[#171e35] text-white">전체 보기 (마감 포함)</option>
                  <option value="OPEN" className="bg-[#171e35] text-white">모집중 (OPEN)</option>
                  <option value="UPCOMING" className="bg-[#171e35] text-white">모집예정 (UPCOMING)</option>
                  <option value="CLOSED" className="bg-[#171e35] text-white">모집마감 (CLOSED)</option>
                </select>
              </div>

              {(selectedUniv !== "all" || selectedMajor !== "all" || statusFilter !== "all" || searchQuery || equipmentCategory !== "all") && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition"
                  title="필터 초기화"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>초기화</span>
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div className="relative min-w-[260px] lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="과제명, 장비명, 주관기관 검색..."
                className="w-full bg-[#171e35] border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
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
          </div>

          {/* Core Navigation Tabs (4-Questions + ALL) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "ALL"
                  ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>전체 종합 탐색</span>
            </button>

            <button
              onClick={() => setActiveTab("RESOURCES")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "RESOURCES"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>1. 내 전공 사용 가능 자원 ({section1Resources.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("RND")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "RND"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. 지금 참여 가능한 R&D ({section2RnD.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("PROJECTS")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "PROJECTS"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>3. 모집 중인 프로젝트 ({section3Projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("EQUIPMENT")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === "EQUIPMENT"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span>4. 활용 가능한 장비·시설 ({filteredEquipments.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Discovery Content Areas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* SECTION 1: 내 전공으로 사용 가능한 자원 */}
        {(activeTab === "ALL" || activeTab === "RESOURCES") && (
          <section id="section-resources" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>1. 내 전공으로 사용 가능한 자원</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {section1Resources.length}개
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    부산공유대학 14개교 공동 캠퍼스 인프라, 무료 AI 실전 교육(Gemini Academy), 메이커 스페이스
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                Eligible & Cross-University Open
              </span>
            </div>

            {section1Resources.length === 0 ? (
              <div className="p-8 text-center bg-[#111422] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                선택하신 대학 및 전공 조건에 맞는 공유 인프라 자원이 없습니다. 필터를 재설정해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section1Resources.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} onOpenDetail={handleOpenOpportunityModal} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: 지금 참여할 수 있는 R&D */}
        {(activeTab === "ALL" || activeTab === "RND") && (
          <section id="section-rnd" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>2. 지금 참여할 수 있는 R&D 및 산학 협력</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      {section2RnD.length}개
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    공식 모집공고에서 대학생 지원자격과 현재 모집중 상태가 확인된 연구 참여 기회
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                Industry-Academia Co-op & Research
              </span>
            </div>

            {section2RnD.length === 0 ? (
              <div className="p-8 text-center bg-[#111422] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                현재 조건에서 학생 지원자격과 모집기간이 확인된 R&D 공고가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section2RnD.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} onOpenDetail={handleOpenOpportunityModal} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 3: 현재 모집 중인 프로젝트 */}
        {(activeTab === "ALL" || activeTab === "PROJECTS") && (
          <section id="section-projects" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>3. 현재 모집 중인 프로젝트 & 경진대회</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      {section3Projects.length}개
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    2026 AI 창업 경진대회, 컴퓨터공학 캡스톤디자인 1·2차, 글로벌 AX-PBL 베트남 연수 등
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
                Active Deadlines & D-Day Tracking
              </span>
            </div>

            {section3Projects.length === 0 ? (
              <div className="p-8 text-center bg-[#111422] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                선택하신 조건에 해당하는 모집 프로젝트가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section3Projects.map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} onOpenDetail={handleOpenOpportunityModal} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 4: 활용 가능한 장비 및 시설 */}
        {(activeTab === "ALL" || activeTab === "EQUIPMENT") && (
          <section id="section-equipment" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>4. 활용 가능한 대학 장비 및 연구 시설</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      {filteredEquipments.length}종 개방
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    부산대 V-Space 시제품 제작 장비(3D프린터·CNC·4K스튜디오) 및 UNIST UCRF 공용 연구분석 장비(TEM·FT-NMR·현미경)
                  </p>
                </div>
              </div>

              {/* Equipment Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setEquipmentCategory("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    equipmentCategory === "all"
                      ? "bg-amber-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  전체 장비 ({allEquipments.length})
                </button>
                {equipmentCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEquipmentCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      equipmentCategory === cat
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredEquipments.length === 0 ? (
              <div className="p-8 text-center bg-[#111422] rounded-2xl border border-slate-800 text-slate-400 text-xs">
                조건에 맞는 개방 장비가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredEquipments.map((eq) => (
                  <EquipmentCard key={eq.id} equipment={eq} onOpenDetail={handleOpenEquipmentModal} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* 4. Detail Modal with Full Provenance */}
      {selectedItem && selectedKind && (
        <ResourceDetailModal
          item={selectedItem}
          kind={selectedKind}
          onClose={() => {
            setSelectedItem(null);
            setSelectedKind(null);
          }}
        />
      )}
    </div>
  );
}
