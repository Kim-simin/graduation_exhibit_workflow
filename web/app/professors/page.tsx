"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getCurriculums } from "@/lib/data";
import { DepartmentCurriculum, LeadingUniversityTarget } from "@/types/curriculum";
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
  const [masterCategories, setMasterCategories] = useState<any[]>(masterCategoriesData);
  const [selectedDeptCategory, setSelectedDeptCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedShorts, setSelectedShorts] = useState<DepartmentCurriculum | null>(null);

  // 동적 커리큘럼 데이터 로드 (Read-only API)
  const fetchCurriculums = useCallback(async () => {
    try {
      const res = await fetch("/api/curriculums");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SUCCESS") {
          if (Array.isArray(data.curriculums)) {
            setCurriculums(data.curriculums);
          }
          if (Array.isArray(data.master_categories) && data.master_categories.length > 0) {
            setMasterCategories(data.master_categories);
          }
        }
      }
    } catch (err) {
      console.warn("Curriculums dynamic load error:", err);
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

  // 전체 선도학과 목표 대상 슬롯과 현재 작성 완료된 카드의 매핑
  const allUniversityTargets: LeadingUniversityTarget[] = useMemo(() => {
    const list: LeadingUniversityTarget[] = [];

    masterCategories.forEach((cat) => {
      cat.universities.forEach((u: any) => {
        const matched = curriculums.find(
          (c) =>
            (c.department_category.includes(cat.category) ||
              cat.category.includes(c.department_category)) &&
            (c.lead_school.university.includes(u.university) ||
              u.university.includes(c.lead_school.university))
        );

        list.push({
          category: cat.category,
          category_id: cat.id,
          university: u.university,
          default_dept: u.default_dept,
          sub_track: u.sub_track,
          status: matched ? "COMPLETED" : "PENDING",
          curriculum: matched,
        });
      });
    });

    return list;
  }, [masterCategories, curriculums]);

  // 필터링 적용 목록 (공개 웹: 작성 완료된 카드만 노출)
  const displayedItems = useMemo(() => {
    let targets = allUniversityTargets.filter((t) => t.status === "COMPLETED");

    // 1. 학과 카테고리 필터
    if (selectedDeptCategory !== "all") {
      const catObj = DEPARTMENT_CATEGORIES.find((c) => c.id === selectedDeptCategory);
      if (catObj) {
        targets = targets.filter(
          (t) => t.category.includes(catObj.name) || catObj.name.includes(t.category)
        );
      }
    }

    // 2. 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      targets = targets.filter((t) => {
        const matchUniv = t.university.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchDept = (t.default_dept || "").toLowerCase().includes(q);
        const matchSub = (t.sub_track || "").toLowerCase().includes(q);

        if (matchUniv || matchCat || matchDept || matchSub) return true;

        if (t.curriculum) {
          const c = t.curriculum;
          return (
            c.curriculum_title.toLowerCase().includes(q) ||
            c.lead_school.badge_title.toLowerCase().includes(q) ||
            (c.tech_stack || []).some((tool) => tool.toLowerCase().includes(q)) ||
            (c.grade_tech_tree || []).some(
              (g) =>
                g.grade.toLowerCase().includes(q) ||
                g.stage.toLowerCase().includes(q) ||
                g.desc.toLowerCase().includes(q) ||
                g.tools.some((tool) => tool.toLowerCase().includes(q))
            )
          );
        }
        return false;
      });
    }

    return targets;
  }, [allUniversityTargets, selectedDeptCategory, searchQuery]);

  return (
    <div style={{ maxWidth: "84rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 헤더 및 테마 토글 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              color: "#818cf8",
              fontSize: "0.75rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            <GraduationCap style={{ width: "0.875rem", height: "0.875rem" }} />
            Verified Leading University Department & Curriculum Archive
          </div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>
            전국 대학교 표준 커리큘럼 & 실무 테크트리 아카이브
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#94a3b8", maxWidth: "52rem", lineHeight: 1.6, margin: 0 }}>
            사용자가 지정한 분야별 선도대학 표준 커리큘럼과 핵심 소프트웨어 툴, 숏폼 요약 및 1~4학년 실무 테크트리를 확인하세요.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      {/* [1. 상단 필터 칩: 14개 선도학과 카테고리] */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {DEPARTMENT_CATEGORIES.map((cat) => {
          const isSelected = selectedDeptCategory === cat.id;
          const matchCount =
            cat.id === "all"
              ? allUniversityTargets.filter((t) => t.status === "COMPLETED").length
              : allUniversityTargets.filter(
                  (t) =>
                    (t.category.includes(cat.name) || cat.name.includes(t.category)) &&
                    t.status === "COMPLETED"
                ).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedDeptCategory(cat.id)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? "#6366f1" : "#1e293b",
                color: isSelected ? "#ffffff" : "#cbd5e1",
                border: isSelected ? "1px solid #818cf8" : "1px solid #334155",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span style={{ fontSize: "0.6875rem", opacity: 0.85, fontWeight: "bold" }}>
                ({matchCount})
              </span>
            </button>
          );
        })}
      </div>

      {/* 검색 바 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* 검색 인풋 */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="선도 대학교(서울대, KAIST 등), 학과, 실무 툴(Figma, ROS2, PyTorch 등) 검색..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          현재 표시 대상:{" "}
          <strong className="text-cyan-400 font-bold">{displayedItems.length}개</strong>
        </div>
      </div>

      {/* [2. '선도대학교 학과 카드' 쇼케이스 그리드] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedItems.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-2xl bg-[#0f172a] border border-dashed border-slate-800 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">선택한 조건에 일치하는 선도 대학교 커리큘럼 카드가 없습니다.</p>
          </div>
        ) : (
          displayedItems.map((target, idx) => {
            if (target.status === "COMPLETED" && target.curriculum) {
              return (
                <CurriculumCard
                  key={target.curriculum.id || `${target.university}-${idx}`}
                  curriculum={target.curriculum}
                  onOpenModal={(curr) => setSelectedShorts(curr)}
                />
              );
            }
            return null;
          })
        )}
      </div>

      {/* 9:16 숏츠 쇼케이스 팝업 모달 */}
      <CurriculumShortsModal
        isOpen={Boolean(selectedShorts)}
        onClose={() => setSelectedShorts(null)}
        curriculum={selectedShorts}
      />
    </div>
  );
}
