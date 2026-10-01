"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { JobPosting } from "@/types";
import {
  Briefcase,
  Search,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter,
  Check,
  Target,
  Clock,
  RefreshCw,
  Loader2,
  FileCheck,
  ShieldCheck,
} from "lucide-react";

// 12대 산업군/직무 카테고리 목록
const JOB_CATEGORIES = [
  "전체",
  "경영·사무",
  "마케팅·광고·홍보",
  "무역·유통",
  "IT·인터넷",
  "생산·제조",
  "영업·고객상담",
  "건설",
  "금융",
  "연구개발·설계",
  "디자인",
  "미디어",
  "전문·특수직",
];

// 대학생 맞춤형 전공 프리셋 목록
const DEPARTMENT_OPTIONS = [
  { value: "all", label: "🌐 전체 학과 (선택 안 함)" },
  { value: "시각디자인", label: "🎨 시각디자인학과 / 시각디자인전공" },
  { value: "산업정보디자인", label: "📐 산업정보디자인전공 / 융합디자인" },
  { value: "산업디자인", label: "🚗 산업디자인학과 / 공업디자인" },
  { value: "디자인조형", label: "🏛️ 디자인조형학부 / 조형예술" },
  { value: "컴퓨터공학", label: "💻 컴퓨터공학과 / 소프트웨어학부" },
  { value: "인공지능", label: "🤖 인공지능학과 / 데이터사이언스" },
  { value: "디지털미디어", label: "📱 디지털미디어학과 / 인터랙션디자인" },
  { value: "미디어커뮤니케이션", label: "🎬 미디어커뮤니케이션 / 영상디자인 / 광고홍보" },
  { value: "경영학", label: "📊 경영학과 / 경제학과 / 패션비즈니스" },
  { value: "건축학", label: "🏗️ 건축학과 / 실내건축디자인" },
  { value: "전자공학", label: "⚡ 전자공학과 / 신소재공학과" },
  { value: "지식재산", label: "⚖️ 지식재산 / 기술경영 / 법학" },
];

const UNIVERSITY_OPTIONS = [
  "건국대학교",
  "경희대학교",
  "고려대학교",
  "국민대학교",
  "단국대학교",
  "동국대학교",
  "명지대학교",
  "상명대학교",
  "서강대학교",
  "서울과학기술대학교",
  "서울대학교",
  "서울시립대학교",
  "성균관대학교",
  "세종대학교",
  "숙명여자대학교",
  "연세대학교",
  "이화여자대학교",
  "인하대학교",
  "중앙대학교",
  "한국예술종합학교",
  "한양대학교",
  "홍익대학교",
];

export default function JobsPage() {
  // 실시간 API 연동 상태
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>("recruitment-intelligence-db");

  // 필터 상태
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [partnershipOnly, setPartnershipOnly] = useState<boolean>(false);

  // [2. 실시간 검증 채용공고 패칭 함수] Intelligence DB 및 실시간 API 연동 엔드포인트 호출
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "전체") {
        params.append("category", selectedCategory);
      }
      if (selectedDepartment !== "all") {
        params.append("department", selectedDepartment);
      }
      if (searchQuery.trim()) {
        params.append("keyword", searchQuery.trim());
      }

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        setDataSource(data.source || "recruitment-intelligence-db");
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error("Failed to fetch jobs from API:", err);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedDepartment, searchQuery]);

  // 카테고리, 학과, 검색어 변경 시 실시간 데이터 패칭
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs();
    }, 200); // 디바운스
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  // [신입 전용 강제 필터링 + 학과/카테고리/검색어 필터링 + 매칭도 우선 정렬]
  const filteredAndSortedJobs = useMemo(() => {
    // 1. [원천 방어] 신입 전용 강제 필터 (경력직 전용 공고 원천 배제)
    const juniorOnlyJobs = jobs.filter(
      (job) => job.careerLevel === "신입" || job.careerLevel === "신입/경력무관"
    );

    // 2. 산학협력 연계 필터
    const filtered = juniorOnlyJobs.filter((job) => {
      if (partnershipOnly && !job.isPartnership) {
        return false;
      }
      return true;
    });

    // 3. 학과 매칭 알고리즘 및 우선순위 정렬
    return [...filtered].sort((a, b) => {
      if (selectedDepartment === "all") {
        if (a.isPartnership !== b.isPartnership) {
          return a.isPartnership ? -1 : 1;
        }
        return 0;
      }

      const cleanDept = selectedDepartment.replace("학과", "").replace("전공", "").replace("학부", "").trim();
      const aMatched =
        a.preferredDepartments?.some((dept) => dept.includes(cleanDept) || cleanDept.includes(dept)) ||
        (a.matchedDepartment && a.matchedDepartment.includes(cleanDept));
      const bMatched =
        b.preferredDepartments?.some((dept) => dept.includes(cleanDept) || cleanDept.includes(dept)) ||
        (b.matchedDepartment && b.matchedDepartment.includes(cleanDept));

      // 1순위: 선택 학과 매칭 공고 최상단 배치
      if (aMatched && !bMatched) return -1;
      if (!aMatched && bMatched) return 1;

      // 2순위: 산학협력 연계 기업 우선
      if (a.isPartnership && !b.isPartnership) return -1;
      if (!a.isPartnership && b.isPartnership) return 1;

      return 0;
    });
  }, [jobs, selectedDepartment, partnershipOnly]);

  // 학과 매칭 여부 판단 함수
  const isDeptMatched = (job: JobPosting): boolean => {
    if (selectedDepartment === "all") return false;
    const cleanDept = selectedDepartment.replace("학과", "").replace("전공", "").replace("학부", "").trim();
    return (
      (job.preferredDepartments && job.preferredDepartments.some(
        (dept) => dept.includes(cleanDept) || cleanDept.includes(dept)
      )) ||
      (job.matchedDepartment ? job.matchedDepartment.includes(cleanDept) : false)
    );
  };

  // D-Day 계산 헬퍼
  const getDDayBadge = (deadline: string) => {
    if (!deadline || deadline === "상시채용") {
      return { text: "상시채용", className: "bg-slate-700/80 text-slate-300 border-slate-600/50" };
    }
    const today = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "마감", className: "bg-red-950/80 text-red-300 border-red-700/50" };
    }
    if (diffDays === 0) {
      return { text: "오늘 마감", className: "bg-rose-900/90 text-rose-200 border-rose-600 animate-pulse" };
    }
    if (diffDays <= 7) {
      return { text: `D-${diffDays}`, className: "bg-rose-950/80 text-rose-300 border-rose-700/50 font-bold" };
    }
    return { text: `D-${diffDays}`, className: "bg-amber-950/80 text-amber-300 border-amber-700/50 font-bold" };
  };

  return (
    <div className="w-full min-h-screen px-4 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* 1. 상단 히어로 헤더 */}
      <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>실시간 채용정보 Research & Crawler</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              신입 전용 공고 강제 큐레이션 (경력직 배제)
            </span>
            <button
              onClick={() => fetchJobs()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="새로고침"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <span>채용공고 및 스카우팅</span>
          <span className="text-xs md:text-sm font-semibold px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Source Verified
          </span>
        </h1>
        <p className="mt-2 text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          사용자가 선택한 실제 전공/학과 및 커리큘럼 데이터에 기반하여, 원문 증거(Evidence)와 전공 우대 조건이 교차검증된{" "}
          <strong>신입 채용 공고(VERIFIED)</strong>만 제공합니다.
        </p>
      </div>

      {/* 2. 내 학과 맞춤 공고 필터링 영역 (대학/학과 선택 + 검색) */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 via-slate-900/60 to-indigo-950/20 border border-blue-500/30 shadow-lg shadow-blue-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>어느 학과에 재학 중이신가요?</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                  전공 우대 매칭
                </span>
              </div>
              <p className="text-xs text-slate-400">
                학과를 선택하면 공고 중 해당 전공자를 우선 채용/우대하는 공고가 최상단에 하이라이트됩니다.
              </p>
            </div>
          </div>

          {/* 산학협력 기업만 보기 토글 */}
          <button
            type="button"
            onClick={() => setPartnershipOnly(!partnershipOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              partnershipOnly
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <span>🏢</span>
            <span>산학협력 연계 기업만 보기</span>
            {partnershipOnly && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 대학교 선택 + 학과 선택 + 검색창 통합 컨트롤 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* 소속 대학교 선택 드롭다운 */}
          <div className="md:col-span-3 relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              소속 대학교 선택
            </label>
            <div className="relative">
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none text-xs md:text-sm text-white font-medium transition cursor-pointer pr-10"
              >
                <option value="all">🏛️ 전체 대학교 (선택 안 함)</option>
                {UNIVERSITY_OPTIONS.map((univ) => (
                  <option key={univ} value={univ} className="bg-slate-900 text-white py-1">
                    {univ}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 대학교 드롭다운 메뉴 오른쪽에 배치된 학과/전공 드롭다운 */}
          <div className="md:col-span-4 relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              내 전공 학과 선택
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none text-xs md:text-sm text-white font-medium transition cursor-pointer pr-10"
              >
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white py-1">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 통합 검색창 */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              기업명, 공고명, 요구 스킬 키워드 검색
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: 현대자동차, 네이버, Figma, 프론트엔드 등"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none text-xs md:text-sm text-white placeholder:text-slate-500 transition"
              />
            </div>
          </div>
        </div>

        {/* 선택된 학과 매칭 안내 뱃지 */}
        {selectedDepartment !== "all" && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-blue-300 font-medium">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>
                <strong>[{selectedDepartment}]</strong> 전공자를 우대하거나 직무 연관성이 검증된 공고가 우선 정렬되었습니다.
              </span>
            </div>
            <button
              onClick={() => setSelectedDepartment("all")}
              className="text-slate-400 hover:text-white underline text-[11px] transition"
            >
              선택 해제
            </button>
          </div>
        )}
      </div>

      {/* 3. 12대 산업군/직무 카테고리 칩 필터 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>12대 산업군 및 직무 카테고리</span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            {isLoading ? (
              <span className="inline-flex items-center gap-1 text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" /> 검증 데이터 로드 중...
              </span>
            ) : (
              <span>
                총 <strong>{filteredAndSortedJobs.length}</strong>개의 검증된 실시간 신입 공고
              </span>
            )}
          </span>
        </div>

        {/* 가로 스크롤 가능한 알약(Pill) 형태의 칩 필터 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {JOB_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 scale-105"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/90 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800"
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 채용공고 카드 그리드 / 로딩 스켈레톤 / 빈 상태 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse flex flex-col justify-between h-[360px]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800"></div>
                  <div className="w-16 h-5 rounded-full bg-slate-800"></div>
                </div>
                <div className="w-3/4 h-5 rounded bg-slate-800 mb-2"></div>
                <div className="w-1/2 h-4 rounded bg-slate-800 mb-4"></div>
                <div className="w-full h-16 rounded-xl bg-slate-800/60 mb-3"></div>
              </div>
              <div className="w-full h-10 rounded-2xl bg-slate-800"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedJobs.length === 0 ? (
        <div className="py-24 px-4 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
            현재 선택한 전공에 대해 검증된 공개 채용공고가 없습니다.
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            실제 웹페이지 원문 증거(Evidence) 및 출처 URL이 교차검증된 공고만 노출됩니다. 다른 전공 학과 또는 직무 카테고리를 선택해 보세요.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("전체");
              setSelectedDepartment("all");
              setSearchQuery("");
              setPartnershipOnly(false);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedJobs.map((job) => {
            const isMatched = isDeptMatched(job);
            const dday = getDDayBadge(job.deadline);
            const targetUrl = job.originUrl || job.sourceUrl || "#";

            return (
              <div
                key={job.id}
                className={`flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900/90 border transition-all relative ${
                  isMatched
                    ? "border-blue-500 shadow-xl shadow-blue-500/15 ring-2 ring-blue-500/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md"
                }`}
              >
                {/* 상단: 내 전공 맞춤 배지 (매칭 시) */}
                {isMatched && (
                  <div className="absolute -top-3 left-6 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white shadow-md shadow-blue-600/40 border border-blue-400">
                      <Target className="w-3 h-3" />
                      <span>🎯 내 전공 맞춤 추천</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* 상단 정보 행: 기업 로고 + 기업명 + 신입 전용 배지 + D-Day */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl p-1 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                        {job.logoEmoji || "🏢"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {job.companyName}
                          </span>
                          <span className="text-blue-400 font-bold text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 shrink-0">
                            대기업 공채
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                          {job.employmentType} · {job.location || "수도권"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {/* [🌱 신입 전용] 고정 노출 배지 */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        🌱 신입 전용
                      </span>
                      {/* D-Day 배지 */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${dday.className}`}
                      >
                        {dday.text}
                      </span>
                    </div>
                  </div>

                  {/* 공고 타이틀 */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 tracking-tight hover:text-blue-500 transition cursor-pointer">
                    <a href={targetUrl} target="_blank" rel="noopener noreferrer">
                      {job.title}
                    </a>
                  </h3>

                  {/* 직무 카테고리 태그 & 전공 우대 상태 */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                      {job.jobCategory}
                    </span>

                    {/* Major Preference Status 배지 */}
                    {job.majorPreferenceStatus === "MAJOR_PREFERENCE_CONFIRMED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        🎯 전공 우대 확인
                      </span>
                    ) : job.majorPreferenceStatus === "MAJOR_RELATION_INFERRED" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        🔍 직무 연관 추정
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        전공 조건 명시 없음
                      </span>
                    )}
                  </div>

                  {/* 학과 매칭 하이라이트 (우대 전공 목록) */}
                  <div
                    className={`p-3 rounded-2xl mb-3.5 transition-colors border ${
                      isMatched
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                      <GraduationCap
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isMatched ? "text-blue-500" : "text-slate-400"
                        }`}
                      />
                      <span>우대/타깃 전공:</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {job.preferredDepartments && job.preferredDepartments.length > 0
                        ? job.preferredDepartments.join(", ")
                        : "명시된 학과 제한 없음"}
                    </p>
                  </div>

                  {/* 원문 검증 증거 스니펫 (Evidence Text) */}
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 mb-3 leading-relaxed">
                    <div className="text-[10px] font-semibold text-blue-400 mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        <span>원문 검증 증거 (Evidence)</span>
                      </div>
                      <span className="text-cyan-400 font-bold text-[10px] tracking-wide px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/50">
                        링커리어 실시간
                      </span>
                    </div>
                    <p className="line-clamp-2 text-slate-300 text-[10.5px]">
                      <span className="text-cyan-400 font-semibold mr-1">[실시간 공채]</span>
                      {job.evidenceText || "공식 채용 포털 원문 요구조건 및 우대전공 스펙 검증 데이터"}
                    </p>
                    {job.contentHash && (
                      <span className="block text-[9px] font-mono text-slate-500 mt-1">
                        SHA256: {job.contentHash.slice(0, 16)}...
                      </span>
                    )}
                  </div>

                  {/* 요구 기술 스택 태그 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.techStacks &&
                      job.techStacks.slice(0, 4).map((tech, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"
                        >
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>

                <div>
                  {/* 산학협력 연계 안내 / 검증 뱃지 */}
                  <div className="pt-3 mb-3 border-t border-slate-100 dark:border-slate-800/80">
                    {job.isPartnership ? (
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300 text-[11px] flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="leading-tight">
                          <strong className="font-bold">🏢 산학협력 연계 기업 (CORROBORATED)</strong>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                            대학 및 학과와 산학협력 연구 및 인턴십 연계 이력이 검증된 기업입니다.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-semibold">🟢 VERIFIED (Source Verified)</span>
                      </div>
                    )}
                  </div>

                  {/* 실제 공고 원문 페이지 링크 */}
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-2xl font-semibold text-xs transition-colors shadow-md shadow-blue-600/20 active:scale-[0.99]"
                  >
                    <span>🚀 채용공고 원문 상세보기</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
