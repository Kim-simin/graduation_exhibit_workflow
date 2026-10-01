"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getCurriculums } from "@/lib/data";
import { DepartmentCurriculum } from "@/types/curriculum";
import masterCategoriesData from "@/data/published/leading_departments_master.json";
import {
  GraduationCap,
  Search,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import CurriculumCard from "@/components/CurriculumCard";
import CurriculumShortsModal from "@/components/CurriculumShortsModal";
import ThemeToggle from "@/components/theme-toggle";

const DEPARTMENT_CATEGORIES = [
  { id: "all", name: "전체 학과", icon: "🌐" },
  { id: "business", name: "상경 (경영/경제)", icon: "💼" },
  { id: "social", name: "사회 (사회/심리)", icon: "🤝" },
  { id: "media", name: "미디어 (언론/통계)", icon: "📊" },
  { id: "science", name: "수학 / 물리 / 화학", icon: "🔬" },
  { id: "bio", name: "생명 (바이오/제약)", icon: "🧬" },
  { id: "cs", name: "컴퓨터공학 (IT/SW)", icon: "💻" },
  { id: "mech", name: "기계공학 (자동차/중공업)", icon: "⚙️" },
  { id: "elec", name: "전자공학 (반도체/디스플레이)", icon: "⚡" },
  { id: "chem_eng", name: "화학공학 (정유/배터리)", icon: "🔋" },
  { id: "arch", name: "건축학 (설계/공학)", icon: "🏛️" },
  { id: "design", name: "디자인 (시각/산업 등)", icon: "🎨" },
  { id: "film_media", name: "영상 (제작/미디어)", icon: "🎬" },
  { id: "nursing", name: "간호학", icon: "🩺" },
  { id: "health_admin", name: "보건행정", icon: "🏥" },
];

export default function CurriculumsPage() {
  const initialCurriculums = getCurriculums();
  const [curriculums, setCurriculums] = useState<DepartmentCurriculum[]>(initialCurriculums);
  const [selectedDeptCategory, setSelectedDeptCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedShorts, setSelectedShorts] = useState<DepartmentCurriculum | null>(null);

  // 동적 커리큘럼 데이터 로드 (Read-only API)
  const fetchCurriculums = useCallback(async () => {
    try {
      const res = await fetch("/api/curriculums");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SUCCESS" && Array.isArray(data.curriculums)) {
          setCurriculums(data.curriculums);
        }
      }
    } catch (err) {
      console.warn("Curriculums load error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCurriculums();
  }, [fetchCurriculums]);

  // URL 쿼리 파라미터 연동
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const univParam = sp.get("univ") || "";
      const deptParam = sp.get("dept") || "";
      const categoryParam = sp.get("category") || "";
      if (univParam || deptParam) {
        setSearchQuery([univParam, deptParam].filter(Boolean).join(" "));
      }
      if (categoryParam) {
        const found = DEPARTMENT_CATEGORIES.find(
          (c) => c.name.includes(categoryParam) || c.id === categoryParam
        );
        if (found) {
          setSelectedDeptCategory(found.id);
        }
      }
    }
  }, []);

  // 필터링된 커리큘럼 리스트
  const filteredCurriculums = useMemo(() => {
    return curriculums.filter((item) => {
      const matchesCategory =
        selectedDeptCategory === "all" ||
        DEPARTMENT_CATEGORIES.some(
          (cat) =>
            cat.id === selectedDeptCategory &&
            (item.department_category.includes(cat.name) || cat.name.includes(item.department_category))
        );

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        item.lead_school.university.toLowerCase().includes(q) ||
        item.lead_school.department.toLowerCase().includes(q) ||
        item.curriculum_title.toLowerCase().includes(q) ||
        (item.grade_tech_tree &&
          item.grade_tech_tree.some((t) =>
            t.tools.some((tool) => tool.toLowerCase().includes(q)) ||
            t.desc.toLowerCase().includes(q)
          ));

      return matchesCategory && matchesSearch;
    });
  }, [curriculums, selectedDeptCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* 상단 헤더 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>전국 주요 대학교 선도학과 커리큘럼 아카이브</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              대학교 커리큘럼 & 테크트리
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              전국 주요 대학교 선도학과의 1~4학년 실무 툴 및 핵심 커리큘럼 테크트리를 확인하세요.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="대학교, 학과, 실무 툴 검색..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* 카테고리 필터 칩 */}
        <div className="py-4">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {DEPARTMENT_CATEGORIES.map((cat) => {
              const active = selectedDeptCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedDeptCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition border shadow-xs ${
                    active
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400"
                      : "bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 커리큘럼 카드 목록 */}
        <div className="pt-2 pb-16">
          {filteredCurriculums.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                조회된 커리큘럼이 없습니다
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                선택한 학과 분류나 검색 조건을 변경해 보세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition"
              >
                전체 목록 보기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCurriculums.map((curr) => (
                <CurriculumCard
                  key={curr.id}
                  curriculum={curr}
                  onOpenModal={(c: DepartmentCurriculum) => setSelectedShorts(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 30초 숏츠 쇼케이스 모달 */}
      <CurriculumShortsModal
        isOpen={Boolean(selectedShorts)}
        onClose={() => setSelectedShorts(null)}
        curriculum={selectedShorts}
      />
    </div>
  );
}
