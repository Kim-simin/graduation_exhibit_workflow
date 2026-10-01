"use client";

import React from "react";
import { MajorCategory } from "@/types/challenge";

interface MajorFilterChipsProps {
  categories: MajorCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  majorCounts: Record<string, number>;
}

export default function MajorFilterChips({
  categories,
  selectedCategoryId,
  onSelectCategory,
  majorCounts,
}: MajorFilterChipsProps) {
  const totalCount = majorCounts["all"] ?? 0;

  return (
    <div className="w-full">
      {/* 
        반응형 가로 칩 리스트: 
        모바일에서는 가로 스크롤(no-scrollbar), 
        태블릿/데스크톱에서는 자연스러운 flex-wrap multi-row 배치 
      */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:flex-wrap">
        {/* 1. 전체 학과 칩 */}
        <button
          type="button"
          onClick={() => onSelectCategory("all")}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 border ${
            selectedCategoryId === "all"
              ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/40"
              : "bg-[#181d2f]/90 hover:bg-[#222840] text-slate-300 hover:text-white border-slate-700/70 dark:bg-[#141829] dark:border-slate-800"
          }`}
        >
          <span className="text-sm">🌐</span>
          <span>전체 학과</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              selectedCategoryId === "all"
                ? "bg-white/20 text-white"
                : "bg-slate-800 text-slate-300 dark:bg-slate-700/60"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* 2. 14개 상세 전공 카테고리 칩 */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const count = majorCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-150 border ${
                isSelected
                  ? "bg-indigo-600 border-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/40"
                  : "bg-[#181d2f]/90 hover:bg-[#222840] text-slate-300 hover:text-white border-slate-700/70 dark:bg-[#141829] dark:border-slate-800"
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="whitespace-nowrap">{cat.name}</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                  isSelected
                    ? "bg-white/20 text-white font-bold"
                    : count > 0
                    ? "bg-indigo-950/70 text-indigo-300 border border-indigo-800/40"
                    : "bg-slate-800/80 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
