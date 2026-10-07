"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  GraduationCap,
  Clock,
  ShieldCheck,
  X,
  Briefcase,
  Trophy,
  Cpu,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  getOpportunities,
  getEquipments,
  categorizeOpportunity,
  getNormalizedFacilities,
  getRecruitmentStatusInfo,
  isUniversityEligible,
  isStrictMajorEligible,
  cleanMajorKeyword,
  isStudentEligibleOpportunity,
} from "@/lib/opportunity";
import { Opportunity, Equipment, FacilityItem, CoreCategory } from "@/types/opportunity";
import ProjectCard from "@/components/opportunity/ProjectCard";
import CompetitionCard from "@/components/opportunity/CompetitionCard";
import FacilityCard from "@/components/opportunity/FacilityCard";
import ResourceDetailModal from "@/components/opportunity/ResourceDetailModal";

const UNIVERSITY_OPTIONS = [
  { id: "all", label: "전체 대학교 (전국/공유대학)" },
  { id: "부산대학교", label: "부산대학교 (PNU)" },
  { id: "국립부경대학교", label: "국립부경대학교 (PKNU)" },
  { id: "동아대학교", label: "동아대학교" },
  { id: "국립한국해양대학교", label: "국립한국해양대학교" },
  { id: "UNIST", label: "UNIST (울산과학기술원)" },
  { id: "부산경상대학교", label: "부산경상대학교" },
  { id: "부산공유대학", label: "부산공유대학 14개 참여대학" },
  { id: "한양대학교", label: "한양대학교 (ERICA)" },
  { id: "고려대학교", label: "고려대학교" },
  { id: "경희대학교", label: "경희대학교" },
  { id: "경북대학교", label: "경북대학교" },
  { id: "영남대학교", label: "영남대학교" },
  { id: "강원대학교", label: "강원대학교" },
  { id: "전남대학교", label: "전남대학교" },
  { id: "충남대학교", label: "충남대학교" },
];

const MAJOR_OPTIONS = [
  { id: "all", label: "전체 전공 (제한 없음)" },
  { id: "디지털크리에이터과", label: "🎬 디지털크리에이터 / 미디어콘텐츠" },
  { id: "컴퓨터공학과", label: "💻 컴퓨터공학 / 소프트웨어 / 인공지능" },
  { id: "기계공학과", label: "⚙️ 기계공학 / 메카트로닉스 / 로봇" },
  { id: "디자인학과", label: "🎨 시각디자인 / 산업디자인 / 제품디자인" },
  { id: "전기전자공학과", label: "⚡ 전기전자공학 / 반도체공학" },
  { id: "신소재공학과", label: "🔬 신소재공학 / 화학 / 물리학" },
  { id: "경영학과", label: "📊 경영 / 기술창업 / 창업기획" },
  { id: "건축공학과", label: "🏛️ 건축학 / 실내건축디자인" },
  { id: "바이오메디컬", label: "🧪 바이오 / 생명과학 / 환경공학" },
];

const STATUS_OPTIONS = [
  { id: "all", label: "전체 보기 (마감 포함)" },
  { id: "OPEN", label: "모집중" },
  { id: "ROLLING", label: "상시모집" },
  { id: "UPCOMING", label: "모집예정" },
  { id: "CLOSED", label: "마감" },
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

  // Raw Published Data
  const allOpportunities = useMemo(
    () => getOpportunities(referenceTime).filter((o) => o.approvalStatus === "PUBLISHED"),
    [referenceTime]
  );
  const allEquipments = useMemo(() => getEquipments(), []);

  // Admin 전용 학생 참여 자격 Gate 필터:
  // "verified": 학생 참여 가능 [검증완료] (기본값)
  // "needs_review": [학생 참여 여부 확인 필요]
  // "excluded": [제외된 공고 (채용/기업/기관)]
  // "all": [전체 공고]
  const [gateFilter, setGateFilter] = useState<"verified" | "needs_review" | "excluded" | "all">("verified");

  // 3대 핵심 카테고리별 원시 데이터 분리 및 노멀라이징 (Admin Gate 필터 연동)
  const rawProjects = useMemo(() => {
    return allOpportunities.filter((o) => {
      if (categorizeOpportunity(o) !== "PROJECT") return false;
      if (gateFilter === "verified") return isStudentEligibleOpportunity(o) && o.status !== "UNKNOWN";
      if (gateFilter === "needs_review") return o.eligibilityStatus === "needs_review";
      if (gateFilter === "excluded") return o.eligibilityStatus === "excluded";
      return true;
    });
  }, [allOpportunities, gateFilter]);

  const rawCompetitions = useMemo(() => {
    return allOpportunities.filter((o) => {
      if (categorizeOpportunity(o) !== "COMPETITION") return false;
      if (gateFilter === "verified") return isStudentEligibleOpportunity(o) && o.status !== "UNKNOWN";
      if (gateFilter === "needs_review") return o.eligibilityStatus === "needs_review";
      if (gateFilter === "excluded") return o.eligibilityStatus === "excluded";
      return true;
    });
  }, [allOpportunities, gateFilter]);

  const rawFacilities = useMemo(() => {
    return getNormalizedFacilities(allOpportunities, allEquipments);
  }, [allOpportunities, allEquipments]);

  // 상단 3개 필터 상태 (소속 대학, 내 전공, 모집 상태)
  const [selectedUniv, setSelectedUniv] = useState<string>("all");
  const [selectedMajor, setSelectedMajor] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 검색어 상태
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 현재 활성 카테고리 탭 (PROJECT | COMPETITION | FACILITY)
  const [activeCategory, setActiveCategory] = useState<CoreCategory>("PROJECT");

  // 장비·시설 내부 Sub-tab 상태 ("ALL" | "SPACE" | "EQUIPMENT")
  const [facilitySubTab, setFacilitySubTab] = useState<"ALL" | "SPACE" | "EQUIPMENT">("ALL");

  // 장비 전용 이용방식 필터 ("all" | "ANALYSIS_REQUEST" | "DIRECT_USE")
  const [usageMethodFilter, setUsageMethodFilter] = useState<string>("all");

  // 장비 전용 연구실/분과 필터 ("all" | labCategory)
  const [labFilter, setLabFilter] = useState<string>("all");

  // 상세 모달 상태
  const [selectedItem, setSelectedItem] = useState<Opportunity | FacilityItem | null>(null);

  // 1. 프로젝트 엄격 필터링
  const filteredProjects = useMemo(() => {
    return rawProjects.filter((p) => {
      // 소속 대학 자격 검증
      if (!isUniversityEligible(selectedUniv, p.eligibleUniversities, p.crossUniversityAvailable, p.providerName)) {
        return false;
      }

      // 내 전공 자격 검증 (엄격 규칙: 설명 단순 매칭 금지, 공식 전공 배열 또는 전공무관만 허용)
      if (!isStrictMajorEligible(selectedMajor, p.eligibleMajors, p.eligibleDepartments, p.majorRestriction)) {
        return false;
      }

      // 모집 상태 검증
      const sInfo = getRecruitmentStatusInfo(p.status, p.recruitmentEndAt, p.recruitmentEvidence?.rollingAdmission);
      if (statusFilter !== "all") {
        if (statusFilter === "OPEN" && sInfo.key !== "OPEN" && sInfo.key !== "ROLLING") return false;
        if (statusFilter === "ROLLING" && sInfo.key !== "ROLLING") return false;
        if (statusFilter === "UPCOMING" && sInfo.key !== "UPCOMING") return false;
        if (statusFilter === "CLOSED" && sInfo.key !== "CLOSED") return false;
      }

      // 검색어 검증
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchProvider = p.providerName.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchProvider && !matchDesc && !matchTags) return false;
      }

      return true;
    });
  }, [rawProjects, selectedUniv, selectedMajor, statusFilter, searchQuery]);

  // 2. 공모전 엄격 필터링
  const filteredCompetitions = useMemo(() => {
    return rawCompetitions.filter((c) => {
      // 소속 대학 자격 검증
      if (!isUniversityEligible(selectedUniv, c.eligibleUniversities, c.crossUniversityAvailable, c.providerName)) {
        return false;
      }

      // 내 전공 자격 검증
      if (!isStrictMajorEligible(selectedMajor, c.eligibleMajors, c.eligibleDepartments, c.majorRestriction)) {
        return false;
      }

      // 모집 상태 검증
      const sInfo = getRecruitmentStatusInfo(c.status, c.recruitmentEndAt, c.recruitmentEvidence?.rollingAdmission);
      if (statusFilter !== "all") {
        if (statusFilter === "OPEN" && sInfo.key !== "OPEN" && sInfo.key !== "ROLLING") return false;
        if (statusFilter === "ROLLING" && sInfo.key !== "ROLLING") return false;
        if (statusFilter === "UPCOMING" && sInfo.key !== "UPCOMING") return false;
        if (statusFilter === "CLOSED" && sInfo.key !== "CLOSED") return false;
      }

      // 검색어 검증
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchProvider = c.providerName.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchTags = c.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchProvider && !matchDesc && !matchTags) return false;
      }

      return true;
    });
  }, [rawCompetitions, selectedUniv, selectedMajor, statusFilter, searchQuery]);

  // 장비·시설 카운트 (전체 / 공유 공간 / 전문 연구장비)
  const spaceCount = useMemo(
    () => rawFacilities.filter((f) => f.subType === "SPACE").length,
    [rawFacilities]
  );
  const equipmentCount = useMemo(
    () => rawFacilities.filter((f) => f.subType === "EQUIPMENT").length,
    [rawFacilities]
  );

  // 고유 연구실 분과 목록
  const labOptions = useMemo(() => {
    const labs = new Set<string>();
    rawFacilities.forEach((f) => {
      if (f.labCategory) labs.add(f.labCategory);
    });
    return Array.from(labs);
  }, [rawFacilities]);

  // 3. 장비 및 시설 엄격 필터링
  const filteredFacilities = useMemo(() => {
    return rawFacilities.filter((f) => {
      // Sub-tab 필터 ([전체] / [공유 공간] / [전문 연구장비])
      if (facilitySubTab === "SPACE" && f.subType !== "SPACE") return false;
      if (facilitySubTab === "EQUIPMENT" && f.subType !== "EQUIPMENT") return false;

      // 전문 연구장비 전용 이용방식 필터
      if (usageMethodFilter !== "all" && f.subType === "EQUIPMENT") {
        if (f.usageType !== usageMethodFilter) return false;
      }

      // 전문 연구장비 전용 연구실/분과 필터
      if (labFilter !== "all" && f.subType === "EQUIPMENT") {
        if (f.labCategory !== labFilter) return false;
      }

      // 소속 대학 자격 검증
      if (selectedUniv !== "all") {
        const canAccess =
          f.externalUserAccess ||
          f.university.includes(selectedUniv) ||
          selectedUniv.includes(f.university);
        if (!canAccess) return false;
      }

      // 내 전공 자격 검증
      if (selectedMajor !== "all") {
        const mClean = cleanMajorKeyword(selectedMajor);
        const isAll =
          f.eligibleMajors.length === 0 ||
          f.eligibleMajors.includes("ALL") ||
          f.eligibleMajors.includes("전공무관");
        if (!isAll) {
          const matched = f.eligibleMajors.some((em) => {
            const emClean = cleanMajorKeyword(em);
            return emClean.includes(mClean) || mClean.includes(emClean);
          });
          if (!matched) return false;
        }
      }

      // 모집/이용 상태 검증
      if (statusFilter !== "all") {
        if (statusFilter === "CLOSED" && f.status !== "MAINTENANCE" && f.status !== "CLOSED") {
          return false;
        }
        if (statusFilter === "UPCOMING" && f.status !== "UPCOMING") {
          return false;
        }
        if ((statusFilter === "OPEN" || statusFilter === "ROLLING") && (f.status === "MAINTENANCE" || f.status === "CLOSED")) {
          return false;
        }
      }

      // 검색어 다중 필드 검증 (장비명, 영문명, 모델명, 소속대학, 연구실, 설치장소)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = f.name.toLowerCase().includes(q);
        const matchNameEn = (f.nameEn || "").toLowerCase().includes(q);
        const matchModel = (f.model || "").toLowerCase().includes(q);
        const matchUniv = f.university.toLowerCase().includes(q);
        const matchOrg = f.managingOrg.toLowerCase().includes(q);
        const matchLab = (f.labCategory || "").toLowerCase().includes(q);
        const matchLocation = f.location.toLowerCase().includes(q);
        const matchCondition = f.usageCondition.toLowerCase().includes(q);
        const matchTags = f.tags.some((t) => t.toLowerCase().includes(q));

        if (
          !matchName &&
          !matchNameEn &&
          !matchModel &&
          !matchUniv &&
          !matchOrg &&
          !matchLab &&
          !matchLocation &&
          !matchCondition &&
          !matchTags
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    rawFacilities,
    facilitySubTab,
    usageMethodFilter,
    labFilter,
    selectedUniv,
    selectedMajor,
    statusFilter,
    searchQuery,
  ]);

  // 필터 초기화 핸들러
  const handleResetFilters = () => {
    setSelectedUniv("all");
    setSelectedMajor("all");
    setStatusFilter("all");
    setGateFilter("verified");
    setFacilitySubTab("ALL");
    setUsageMethodFilter("all");
    setLabFilter("all");
    setSearchQuery("");
  };

  const isFilterActive =
    selectedUniv !== "all" ||
    selectedMajor !== "all" ||
    statusFilter !== "all" ||
    gateFilter !== "verified" ||
    facilitySubTab !== "ALL" ||
    usageMethodFilter !== "all" ||
    labFilter !== "all" ||
    searchQuery.trim() !== "";

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
              공식 출처 기반 정보
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              신청 조건은 공식 원문에서 확인
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            전국 대학 <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400">공유자원 & 실전 R&D·공모전</span> 허브
          </h1>
          <p className="mt-3.5 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
            학생이 자신의 <strong>소속 학교</strong>와 <strong>전공</strong>을 기준으로 지원 가능한 실전 산학 프로젝트,
            상금과 혜택이 주어지는 공모전, 최첨단 연구·제작 공용 장비 및 시설을 한눈에 탐색하고 공식 신청하세요.
          </p>

          {/* Quick Metrics Bar: 3대 핵심 카테고리 현황 */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div
              onClick={() => setActiveCategory("PROJECT")}
              className={`border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                activeCategory === "PROJECT"
                  ? "bg-[#18203c] border-indigo-500/80 shadow-lg shadow-indigo-950/40"
                  : "bg-[#151a2e]/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">프로젝트 (R&D·산학·PBL)</p>
                <p className="text-2xl font-extrabold text-white font-mono mt-0.5">{filteredProjects.length}건</p>
              </div>
            </div>

            <div
              onClick={() => setActiveCategory("COMPETITION")}
              className={`border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                activeCategory === "COMPETITION"
                  ? "bg-[#1f1d2f] border-amber-500/80 shadow-lg shadow-amber-950/40"
                  : "bg-[#151a2e]/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">공모전 (경진대회·해커톤)</p>
                <p className="text-2xl font-extrabold text-white font-mono mt-0.5">{filteredCompetitions.length}건</p>
              </div>
            </div>

            <div
              onClick={() => setActiveCategory("FACILITY")}
              className={`border rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all ${
                activeCategory === "FACILITY"
                  ? "bg-[#132333] border-cyan-500/80 shadow-lg shadow-cyan-950/40"
                  : "bg-[#151a2e]/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">장비·시설 이용 (개방 인프라)</p>
                <p className="text-2xl font-extrabold text-white font-mono mt-0.5">{filteredFacilities.length}종</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Discovery Filters (소속 대학, 내 전공, 모집 상태 + 검색창) */}
      <section className="relative z-20 bg-[#0f1424] border-b border-slate-800/80 py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Top 3 Filters: [소속 대학], [내 전공], [모집 상태] */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 소속 대학 Dropdown */}
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

              {/* 내 전공 Dropdown */}
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

              {/* 모집 상태 Dropdown */}
              <div className="flex items-center gap-2 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">모집 상태:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#171e35] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 관리자 전용: 학생 참여 자격 Gate 상태 Dropdown */}
              <div className="flex items-center gap-2 bg-[#171e35] px-3 py-1.5 rounded-xl border border-slate-700/80">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">자격 Gate:</span>
                <select
                  value={gateFilter}
                  onChange={(e) => setGateFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="verified" className="bg-[#171e35] text-emerald-300">
                    학생 참여 가능 (검증완료)
                  </option>
                  <option value="needs_review" className="bg-[#171e35] text-amber-300">
                    [학생 참여 여부 확인 필요]
                  </option>
                  <option value="excluded" className="bg-[#171e35] text-rose-300">
                    [제외된 공고 (채용/기업/기관)]
                  </option>
                  <option value="all" className="bg-[#171e35] text-slate-300">
                    전체 DB 보기
                  </option>
                </select>
              </div>

              {/* 필터 초기화 버튼 */}
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                  title="필터 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>필터 초기화</span>
                </button>
              )}
            </div>

            {/* Keyword Search Bar */}
            <div className="relative min-w-[260px] lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="프로젝트, 공모전, 기업, 장비·시설 검색..."
                className="w-full bg-[#171e35] border border-slate-700/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
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

          {/* 3 Core Category Tab Buttons (Dynamic Counts Included) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/60">
            {/* 1. PROJECT */}
            <button
              onClick={() => setActiveCategory("PROJECT")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === "PROJECT"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Briefcase className="w-4 h-4 text-indigo-300" />
              <span>프로젝트 ({filteredProjects.length})</span>
            </button>

            {/* 2. COMPETITION */}
            <button
              onClick={() => setActiveCategory("COMPETITION")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === "COMPETITION"
                  ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-[1.02]"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>공모전 ({filteredCompetitions.length})</span>
            </button>

            {/* 3. FACILITY */}
            <button
              onClick={() => setActiveCategory("FACILITY")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === "FACILITY"
                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 scale-[1.02]"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-300" />
              <span>장비·시설 이용 ({filteredFacilities.length})</span>
            </button>
          </div>

          {/* FACILITY Sub-tab Bar & Specialized Equipment Filters */}
          {activeCategory === "FACILITY" && (
            <div className="pt-3 pb-1 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
              {/* Sub-tab Segmented Control */}
              <div className="flex items-center gap-1.5 bg-[#121626] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFacilitySubTab("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    facilitySubTab === "ALL"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  전체 ({rawFacilities.length})
                </button>
                <button
                  onClick={() => setFacilitySubTab("SPACE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    facilitySubTab === "SPACE"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  공유 공간 ({spaceCount})
                </button>
                <button
                  onClick={() => setFacilitySubTab("EQUIPMENT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    facilitySubTab === "EQUIPMENT"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  전문 연구장비 ({equipmentCount})
                </button>
              </div>

              {/* Specialized Research Equipment Filtering Chips */}
              {(facilitySubTab === "ALL" || facilitySubTab === "EQUIPMENT") && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* 이용 방식 필터 */}
                  <div className="flex items-center gap-1 bg-[#171e35] px-2.5 py-1 rounded-lg border border-slate-700/70 text-xs">
                    <span className="text-slate-400 text-[11px]">이용 방식:</span>
                    <select
                      value={usageMethodFilter}
                      onChange={(e) => setUsageMethodFilter(e.target.value)}
                      className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="all" className="bg-[#171e35] text-white">전체 방식</option>
                      <option value="ANALYSIS_REQUEST" className="bg-[#171e35] text-white">분석의뢰방식</option>
                      <option value="DIRECT_USE" className="bg-[#171e35] text-white">직접이용(자격/교육)</option>
                    </select>
                  </div>

                  {/* 연구실/분과 필터 */}
                  {labOptions.length > 0 && (
                    <div className="flex items-center gap-1 bg-[#171e35] px-2.5 py-1 rounded-lg border border-slate-700/70 text-xs">
                      <span className="text-slate-400 text-[11px]">실험실/분과:</span>
                      <select
                        value={labFilter}
                        onChange={(e) => setLabFilter(e.target.value)}
                        className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
                      >
                        <option value="all" className="bg-[#171e35] text-white">전체 실험실</option>
                        {labOptions.map((lab) => (
                          <option key={lab} value={lab} className="bg-[#171e35] text-white">
                            {lab}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Cards Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Category Description Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            {activeCategory === "PROJECT" && (
              <p>
                기업 산학협력, R&D 학생 참여과제, 기업연계 PBL, 캡스톤, 다학제 과제를 학생 조건에 맞춰 탐색합니다.
              </p>
            )}
            {activeCategory === "COMPETITION" && (
              <p>
                전국 대학생 대상 공모전, 경진대회, 해커톤, 아이디어톤 및 기업 챌린지 정보를 제공합니다.
              </p>
            )}
            {activeCategory === "FACILITY" && (
              <p>
                {facilitySubTab === "SPACE" ? (
                  <span>
                    <strong>[공유 공간]</strong> 부산공유대학 14개 참여대학 학생 및 교직원을 위한 강의실, 세미나실, 스터디룸 대여 공간입니다.
                  </span>
                ) : facilitySubTab === "EQUIPMENT" ? (
                  <span>
                    <strong>[전문 연구장비]</strong> 부산대학교 공동실험실습관의 첨단 분석·연구 기기입니다. 회원가입 및 소속 확인, 분석의뢰 또는 장비별 안전·자격 교육 승인 후 이용 가능합니다.
                  </span>
                ) : (
                  <span>
                    부산공유대학 개방 <strong>공유 공간</strong> 및 부산대학교 공동실험실습관 공식 <strong>전문 연구장비</strong>의 실시간 이용 정보를 제공합니다.
                  </span>
                )}
              </p>
            )}
          </div>
          <span className="font-mono text-slate-500">
            총{" "}
            {activeCategory === "PROJECT"
              ? filteredProjects.length
              : activeCategory === "COMPETITION"
              ? filteredCompetitions.length
              : filteredFacilities.length}
            개 항목
          </span>
        </div>

        {/* 1. PROJECT GRID */}
        {activeCategory === "PROJECT" && (
          <>
            {filteredProjects.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">
                  선택하신 조건에 부합하는 프로젝트가 없습니다
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  선택한 대학교, 전공, 또는 모집 상태 조건을 변경하거나 검색어를 재설정해 보세요.
                </p>
                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>필터 초기화</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onOpenDetail={(item) => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 2. COMPETITION GRID */}
        {activeCategory === "COMPETITION" && (
          <>
            {filteredCompetitions.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">
                  선택하신 조건에 부합하는 공모전이 없습니다
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  선택한 대학교, 전공, 또는 모집 상태 조건을 변경하거나 검색어를 재설정해 보세요.
                </p>
                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>필터 초기화</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCompetitions.map((c) => (
                  <CompetitionCard
                    key={c.id}
                    competition={c}
                    onOpenDetail={(item) => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 3. FACILITY GRID */}
        {activeCategory === "FACILITY" && (
          <>
            {filteredFacilities.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800/60 rounded-3xl p-8">
                <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">
                  {facilitySubTab === "SPACE"
                    ? "선택하신 조건에 부합하는 공유 공간이 없습니다"
                    : facilitySubTab === "EQUIPMENT"
                    ? "선택하신 조건에 부합하는 전문 연구장비가 없습니다"
                    : "선택하신 조건에 부합하는 장비·시설이 없습니다"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  {facilitySubTab === "EQUIPMENT"
                    ? "장비명, 모델명, 또는 실험실 필터를 변경하시거나 검색어를 재설정해 보세요."
                    : "소속 대학교를 전체로 설정하시거나, 타 대학 개방 시설 조건을 확인해 보세요."}
                </p>
                {isFilterActive && (
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>필터 초기화</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFacilities.map((f) => (
                  <FacilityCard
                    key={f.id}
                    facility={f}
                    onOpenDetail={(item) => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 4. Detail Modal */}
      {selectedItem && (
        <ResourceDetailModal
          item={selectedItem}
          category={activeCategory}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
