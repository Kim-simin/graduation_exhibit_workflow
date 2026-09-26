"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getCurriculums } from "@/lib/data";
import { DepartmentCurriculum } from "@/types/curriculum";
import {
  GraduationCap,
  Search,
  Sparkles,
  BookOpen,
  Layers,
  Building2,
} from "lucide-react";
import CurriculumCard from "@/components/CurriculumCard";
import CurriculumShortsModal from "@/components/CurriculumShortsModal";

// 1. 전국 대학 표준 학과 분류 카테고리 (구글 시트 및 대학 기준)
export const DEPARTMENT_CATEGORIES = [
  { id: "all", name: "전체 학과", icon: "🌐" },
  { id: "cs", name: "컴퓨터공학·소프트웨어", icon: "💻" },
  { id: "visual_ux", name: "시각·인터랙션·UX디자인", icon: "🎨" },
  { id: "industrial", name: "산업·제품·모빌리티디자인", icon: "⚙️" },
  { id: "ai", name: "인공지능·데이터사이언스", icon: "🤖" },
  { id: "media", name: "영상·애니메이션·미디어", icon: "🎬" },
  { id: "space", name: "공간·실내건축·공공디자인", icon: "🏛️" },
  { id: "game", name: "게임그래픽·메타버스", icon: "🎮" },
];

export default function CurriculumsPage() {
  const initialCurriculums = getCurriculums();
  const [curriculums, setCurriculums] = useState<DepartmentCurriculum[]>(initialCurriculums);
  const [selectedDeptCategory, setSelectedDeptCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedShorts, setSelectedShorts] = useState<DepartmentCurriculum | null>(null);

  useEffect(() => {
    // 1. URL 쿼리 파라미터 읽기 (univ 또는 dept)
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const univParam = sp.get("univ") || "";
      const deptParam = sp.get("dept") || "";
      const categoryParam = sp.get("category") || "";
      if (univParam || deptParam) {
        setSearchQuery([univParam, deptParam].filter(Boolean).join(" "));
      }
      if (categoryParam) {
        const found = DEPARTMENT_CATEGORIES.find((c) => c.name.includes(categoryParam) || c.id === categoryParam);
        if (found) {
          setSelectedDeptCategory(found.id);
        }
      }
    }

    // 2. 동적 커리큘럼 데이터 로드 (API fallback)
    async function fetchDynamicCurriculums() {
      try {
        const res = await fetch("/api/curriculums");
        if (res.ok) {
          const data = await res.json();
          if (data.status === "SUCCESS" && Array.isArray(data.curriculums) && data.curriculums.length > 0) {
            setCurriculums(data.curriculums);
          }
        }
      } catch (err) {
        console.warn("Curriculums dynamic load fallback to static:", err);
      }
    }

    fetchDynamicCurriculums();
  }, []);

  // 학과(전공) 카테고리 및 검색어 기반 실시간 필터링
  const filteredCurriculums = useMemo(() => {
    return curriculums.filter((curr) => {
      // 1. 학과 카테고리 필터
      if (selectedDeptCategory !== "all") {
        const targetCategory = DEPARTMENT_CATEGORIES.find((c) => c.id === selectedDeptCategory);
        if (targetCategory) {
          const matchCategory =
            curr.department_category.includes(targetCategory.name) ||
            targetCategory.name.includes(curr.department_category);
          if (!matchCategory) return false;
        }
      }

      // 2. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          curr.curriculum_title.toLowerCase().includes(q) ||
          curr.department_category.toLowerCase().includes(q) ||
          curr.lead_school.university.toLowerCase().includes(q) ||
          curr.lead_school.department.toLowerCase().includes(q) ||
          (curr.tech_stack || []).some((tool) => tool.toLowerCase().includes(q)) ||
          curr.benchmarked_universities.some(
            (p) =>
              p.university.toLowerCase().includes(q) || p.department.toLowerCase().includes(q)
          ) ||
          (curr.grade_tech_tree || []).some(
            (g) =>
              g.grade.toLowerCase().includes(q) ||
              g.stage.toLowerCase().includes(q) ||
              g.desc.toLowerCase().includes(q) ||
              g.tools.some((t) => t.toLowerCase().includes(q))
          ) ||
          (curr.steps || []).some(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.desc.toLowerCase().includes(q) ||
              s.step_num.toLowerCase().includes(q)
          );
        if (!matchSearch) return false;
      }

      return true;
    });
  }, [curriculums, selectedDeptCategory, searchQuery]);

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: "2rem" }}>
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
        <p style={{ fontSize: "1rem", color: "#94a3b8", maxWidth: "52rem", lineHeight: 1.6, margin: 0 }}>
          각 분야 선도대학의 실무 중심 커리큘럼과 핵심 소프트웨어 툴, 숏폼 요약 및 동일 교육과정 운영 대학교를 확인하세요.
        </p>
      </div>

      {/* [1. 상단 필터 칩: '학과(전공)' 카테고리로 전면 교체] */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
        {DEPARTMENT_CATEGORIES.map((cat) => {
          const isSelected = selectedDeptCategory === cat.id;
          const matchCount =
            cat.id === "all"
              ? curriculums.length
              : curriculums.filter(
                  (c) =>
                    c.department_category.includes(cat.name) ||
                    cat.name.includes(c.department_category)
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

      {/* 커리큘럼 검색 바 */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "260px", maxWidth: "34rem" }}>
          <Search
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              width: "1rem",
              height: "1rem",
              color: "#64748b",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="선도 대학교, 학과, 커리큘럼 과정명, 실무 툴(Figma, ROS2, PyTorch 등) 검색..."
            style={{
              width: "100%",
              padding: "0.6rem 1rem 0.6rem 2.4rem",
              borderRadius: "0.75rem",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              color: "#ffffff",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
        </div>
        <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
          조회 결과: <strong style={{ color: "#ffffff" }}>{filteredCurriculums.length}개</strong> 선도 학과 커리큘럼
        </span>
      </div>

      {/* [2. '선도대학교 학과 카드' 쇼케이스 그리드] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCurriculums.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-2xl bg-[#0f172a] border border-dashed border-slate-800 text-slate-500">
            <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">선택한 학과 카테고리에 등록된 선도 커리큘럼이 없습니다.</p>
          </div>
        ) : (
          filteredCurriculums.map((curriculum) => (
            <CurriculumCard
              key={curriculum.id}
              curriculum={curriculum}
              onOpenModal={(curr) => setSelectedShorts(curr)}
            />
          ))
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
