"use client";

import React from "react";
import { Clock, PlusCircle, Building2, Video, Sparkles, Layers } from "lucide-react";
import { LeadingUniversityTarget } from "@/types/curriculum";

interface PendingCurriculumCardProps {
  target: LeadingUniversityTarget;
  onWrite: (target: LeadingUniversityTarget) => void;
}

export default function PendingCurriculumCard({
  target,
  onWrite,
}: PendingCurriculumCardProps) {
  return (
    <div className="relative min-w-0 bg-[#0d1322]/80 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-5 transition-all duration-300 shadow-lg flex flex-col justify-between group hover:bg-[#11192e]">
      {/* 상단 태그 및 식별 배지 */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>미작성 대기</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
            {target.category}
          </span>
        </div>

        {/* 대학교명 및 권장 기본 학과 */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-slate-300 font-extrabold text-sm mb-1">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-white text-base font-black">{target.university}</span>
            {target.sub_track && (
              <span className="text-[11px] text-cyan-300 font-medium bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                {target.sub_track}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-medium">
            권장 학과: <span className="text-slate-300">{target.default_dept || "선도학과"}</span>
          </div>
        </div>

        {/* 숏폼 영상 자리표시 가이드 프레임 */}
        <div className="w-full h-36 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center p-3 text-center mb-4 group-hover:border-slate-700 transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-inner group-hover:scale-105 transition-transform">
            <Video className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-300">
            30초 숏츠 영상 및 실무 테크트리 미등록
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            관제모드에서 클릭하여 숏폼 영상 URL 및 1~4학년 툴을 등록하세요
          </p>
        </div>
      </div>

      {/* 하단 작성 버튼 */}
      <div>
        <button
          type="button"
          onClick={() => onWrite(target)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 hover:from-amber-500 to-amber-700 hover:to-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 hover:shadow-amber-500/20 active:scale-98"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>커리큘럼 영상 카드 작성</span>
        </button>
      </div>
    </div>
  );
}
