"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Construction, Layers, Sparkles } from "lucide-react";

interface FeaturePreparedNoticeProps {
  featureName: string;
}

export default function FeaturePreparedNotice({ featureName }: FeaturePreparedNoticeProps) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-slate-100 font-sans">
      <div className="max-w-md w-full bg-[#121626]/90 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-5">
          <Construction className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          3개월 실증(PoC) 범위 안내
        </span>

        <h2 className="text-xl font-bold text-white mb-3">
          현재 실증 범위 조정을 위해 준비 중인 기능입니다
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          현재 <strong>GRAD EXHIBIT PRO</strong>는 대학생의 프로젝트와 기업의 실전 문제를 연결하기 위해{" "}
          <span className="text-cyan-400 font-semibold">졸업전시 아카이브</span>,{" "}
          <span className="text-indigo-400 font-semibold">대학생</span>,{" "}
          <span className="text-purple-400 font-semibold">프로젝트 공고</span>를 중심으로 운영하고 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>홈으로</span>
          </Link>
          <Link
            href="/mentoring"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <span>프로젝트 공고 보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
