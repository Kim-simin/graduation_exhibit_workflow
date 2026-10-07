"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  getMajorCategories,
  getChallenges,
  getParentChallenges,
  getChallengeMajorCounts,
  filterChallenges,
} from "@/lib/data";
import { Challenge, MajorCategory } from "@/types/challenge";
import MajorFilterChips from "@/components/challenge/MajorFilterChips";
import ChallengeCard from "@/components/challenge/ChallengeCard";
import TeamApplicationModal from "@/components/challenge/TeamApplicationModal";
import OfficialIndustryNotices from "@/components/challenge/OfficialIndustryNotices";
import {
  Rocket,
  Search,
  Filter,
  Briefcase,
  Users,
  Sparkles,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function IndustryChallengesPage() {
  const categories = getMajorCategories();
  const allChallenges = getChallenges();
  const parentChallenges = getParentChallenges();

  // State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showOnlyRecruiting, setShowOnlyRecruiting] = useState<boolean>(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Modal State
  const [selectedChallengeForTeam, setSelectedChallengeForTeam] = useState<Challenge | null>(null);
  const [preselectedMajorForTeam, setPreselectedMajorForTeam] = useState<string | undefined>(undefined);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);

  // Dynamic Recruiting Counts per Major (Section 4 & 7)
  const majorCounts = useMemo(() => {
    return getChallengeMajorCounts();
  }, []);

  // Filtered Challenges
  const filteredList = useMemo(() => {
    return filterChallenges(allChallenges, {
      majorCategoryId: selectedCategoryId,
      searchQuery,
      industry: selectedIndustry,
      difficulty: selectedDifficulty,
      region: selectedRegion,
      status: showOnlyRecruiting ? "RECRUITING" : "all",
      includeFilledForMajor: !showOnlyRecruiting,
    });
  }, [
    allChallenges,
    selectedCategoryId,
    searchQuery,
    selectedIndustry,
    selectedDifficulty,
    selectedRegion,
    showOnlyRecruiting,
  ]);

  // Selected Category Info
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  // Industry options extracted from parent/sub challenges
  const industryList = useMemo(() => {
    const set = new Set<string>();
    parentChallenges.forEach((p) => set.add(p.industry.split("/")[0].trim()));
    allChallenges.forEach((c) => set.add(c.industry.split("/")[0].trim()));
    return Array.from(set);
  }, [parentChallenges, allChallenges]);

  // Open modal handler
  const handleOpenTeamModal = (challenge: Challenge, majorName?: string) => {
    setSelectedChallengeForTeam(challenge);
    setPreselectedMajorForTeam(majorName);
    setIsTeamModalOpen(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategoryId("all");
    setSearchQuery("");
    setSelectedIndustry("all");
    setSelectedDifficulty("all");
    setSelectedRegion("all");
    setShowOnlyRecruiting(true);
  };

  return (
    <div className="min-w-0 w-full px-4 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* 3. Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#13172e] via-[#101322] to-[#0a0d18] border border-slate-800 p-6 md:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* 배지 */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 mb-4 shadow-sm">
            <Rocket className="w-3.5 h-3.5 text-indigo-400" />
            <span>Project Opportunity Marketplace</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            산학협력 IP / Challenge
          </h1>

          {/* 설명 문구 */}
          <p className="mt-3 text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            &ldquo;기업·대학·연구기관이 제시한 산업 문제를 학생 프로젝트 단위로 탐색하고 해결해보세요.&rdquo;
          </p>

          <p className="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed">
            전공별 역할을 확인하고 다른 학과 학생들과 팀을 구성하여 실제 산업 문제에 도전할 수 있습니다.
          </p>

          {/* CTA 버튼 그룹 */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowOnlyRecruiting(true);
                const el = document.getElementById("challenge-list-view");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>모집 중 Challenge 보기 ({majorCounts["all"] || 0}건)</span>
            </button>

            <Link
              href="/rfp/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs md:text-sm font-bold bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 transition-all"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>과제 제안서 제출</span>
            </Link>
          </div>

          {/* 핵심 지표 바 */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-lg text-left">
            <div>
              <div className="text-xl md:text-2xl font-black text-white">
                {parentChallenges.length}대
              </div>
              <div className="text-[11px] text-slate-400 font-medium">산업 메가테마</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black text-indigo-400">
                {allChallenges.length}개
              </div>
              <div className="text-[11px] text-slate-400 font-medium">분해형 학생 과제</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black text-emerald-400">
                {majorCounts["all"] || 0}건
              </div>
              <div className="text-[11px] text-slate-400 font-medium">실시간 팀 모집중</div>
            </div>
          </div>
        </div>
      </section>

      <OfficialIndustryNotices />

      {/* 4. 학과별 FILTER UI (Pill / Chip Buttons) */}
      <section className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-base font-extrabold text-white flex items-center gap-1.5">
              <span>🎯</span>
              <span>참여 희망 전공 선택</span>
            </h2>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (각 학과별 현재 모집 인원이 남아있는 Challenge 수를 실시간 표시합니다)
            </span>
          </div>

          {selectedCategoryId !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategoryId("all")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>전체 전공으로 복원</span>
            </button>
          )}
        </div>

        {/* 14개 학과 + 전체 학과 필터 칩 */}
        <MajorFilterChips
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(id) => setSelectedCategoryId(id)}
          majorCounts={majorCounts}
        />
      </section>

      {/* 14. 검색 & 기본 필터 바 */}
      <section
        id="challenge-list-view"
        className="mb-8 p-4 rounded-2xl bg-[#121626]/80 border border-slate-800/80 shadow-md"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 검색창 */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="과제명, 핵심 키워드(LLM, RAG, CAD), 기관명 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                지우기
              </button>
            )}
          </div>

          {/* 우측 퀵 컨트롤 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 모집중 전용 토글 */}
            <button
              type="button"
              onClick={() => setShowOnlyRecruiting(!showOnlyRecruiting)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showOnlyRecruiting
                  ? "bg-emerald-950/70 border-emerald-600/60 text-emerald-300"
                  : "bg-slate-900 border-slate-700 text-slate-400"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>모집중만 보기</span>
            </button>

            {/* 상세 필터 토글 */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showAdvancedFilters
                  ? "bg-indigo-950/70 border-indigo-600/60 text-indigo-300"
                  : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>상세 필터</span>
            </button>
          </div>
        </div>

        {/* 상세 필터 드롭다운 영역 */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            {/* 산업군 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                산업군 / 테마
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전체 산업군</option>
                {industryList.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* 난이도 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                프로젝트 난이도
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">모든 난이도</option>
                <option value="Beginner">Beginner (입문/기초)</option>
                <option value="Intermediate">Intermediate (중급/실무)</option>
                <option value="Advanced">Advanced (고급/심화)</option>
              </select>
            </div>

            {/* 권역 / 공유대학 */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                지역 / 공유대학
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">전국 모든 권역</option>
                <option value="동남권">동남권 공유대학 (부산·울산·경남)</option>
                <option value="수도권">수도권 바이오메디컬 클러스터</option>
                <option value="중부권">중부권 스마트모빌리티 협의체</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* 필터 결과 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {selectedCategoryId === "all" ? (
              "전체 산학협력 Challenge"
            ) : (
              <>
                <span className="text-indigo-400 font-extrabold">[{currentCategory?.name}]</span> 학생 참여 가능 Challenge
              </>
            )}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">
            {filteredList.length}건
          </span>
        </div>

        {(searchQuery || selectedCategoryId !== "all" || selectedIndustry !== "all" || selectedDifficulty !== "all" || selectedRegion !== "all") && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>필터 초기화</span>
          </button>
        )}
      </div>

      {/* 16. Challenge Card Grid or Empty State */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              selectedMajorId={selectedCategoryId}
              onOpenTeamModal={handleOpenTeamModal}
            />
          ))}
        </div>
      ) : (
        /* 16. 빈 상태 EMPTY STATE */
        <div className="py-16 px-6 text-center rounded-3xl bg-[#121626]/50 border border-slate-800/80 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">
            {currentCategory ? (
              <>현재 <span className="text-indigo-400">&lsquo;{currentCategory.name}&rsquo;</span> 전공을 모집 중인 Challenge가 없습니다.</>
            ) : (
              "조건에 맞는 산학협력 Challenge가 없습니다."
            )}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            새로운 산업 문제와 과제가 지속적으로 업데이트됩니다. 다른 전공 카테고리를 탐색하거나 전체 Challenge를 확인해보세요.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>전체 Challenge 보기</span>
            </button>
          </div>
        </div>
      )}

      {/* 9. 팀 참여 모달 (TeamApplicationModal) */}
      <TeamApplicationModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        challenge={selectedChallengeForTeam}
        initialMajor={preselectedMajorForTeam}
      />
    </div>
  );
}
