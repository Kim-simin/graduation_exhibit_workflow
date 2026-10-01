"use client";

import React from "react";
import { Opportunity } from "@/types/opportunity";
import {
  Calendar,
  Building2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
} from "lucide-react";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onOpenDetail: (opp: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onOpenDetail }: OpportunityCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return {
          label: "모집중",
          badgeClass: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60",
          dotClass: "bg-emerald-400",
        };
      case "UPCOMING":
        return {
          label: "모집예정",
          badgeClass: "bg-sky-950/70 text-sky-300 border-sky-700/60",
          dotClass: "bg-sky-400",
        };
      case "CLOSED":
        return {
          label: "모집마감",
          badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
          dotClass: "bg-slate-500",
        };
      case "ONGOING":
        return {
          label: "진행중",
          badgeClass: "bg-indigo-950/70 text-indigo-300 border-indigo-700/60",
          dotClass: "bg-indigo-400",
        };
      default:
        return {
          label: "모집 여부 확인 필요",
          badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
          dotClass: "bg-slate-400",
        };
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "SHARED_UNIVERSITY":
        return { label: "부산공유대학", color: "bg-purple-950/70 text-purple-300 border-purple-700/50" };
      case "PUBLIC":
        return { label: "전국 대학생", color: "bg-blue-950/70 text-blue-300 border-blue-700/50" };
      case "REGIONAL_STUDENT":
        return { label: "지역 대학생", color: "bg-teal-950/70 text-teal-300 border-teal-700/50" };
      case "EXTERNAL_RESEARCHER":
        return { label: "외부 연구자/학생", color: "bg-amber-950/70 text-amber-300 border-amber-700/50" };
      case "UNIVERSITY_ONLY":
      default:
        return { label: "교내 재학생", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "EDUCATION":
        return "교육 프로그램";
      case "RND":
        return "실전 R&D";
      case "CAPSTONE":
        return "캡스톤디자인";
      case "COMPETITION":
        return "창업·경진대회";
      case "MULTIDISCIPLINARY":
        return "다학제 융합";
      case "SHARED_INFRASTRUCTURE":
        return "공유 인프라";
      case "EQUIPMENT":
        return "메이커 인프라";
      case "RESEARCH_EQUIPMENT":
        return "연구 장비";
      default:
        return type;
    }
  };

  const statusInfo = getStatusBadge(opportunity.status);
  const scopeInfo = getScopeBadge(opportunity.accessScope);

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between group">
      <div>
        {/* 상단 뱃지 라인 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              {getTypeLabel(opportunity.type)}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${scopeInfo.color}`}
            >
              {scopeInfo.label}
            </span>
            {opportunity.dDayText && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  opportunity.dDayText.includes("D-1") || opportunity.dDayText.includes("오늘")
                    ? "bg-rose-950/80 text-rose-300 border border-rose-700/60 animate-pulse"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {opportunity.dDayText}
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* 타이틀 */}
        <h3
          onClick={() => onOpenDetail(opportunity)}
          className="text-base md:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
        >
          {opportunity.title}
        </h3>

        {/* 제공 기관 & 지역 */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate max-w-[200px]">{opportunity.providerName}</span>
          </span>
          <span className="text-slate-600">·</span>
          <span>{opportunity.region}</span>
        </div>

        {/* 상세 설명 요약 */}
        <p className="text-xs text-slate-300/90 line-clamp-3 mb-4 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40">
          {opportunity.description}
        </p>

        {/* 관련 분야 및 주요 기술 태그 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opportunity.fields.slice(0, 3).map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-indigo-300/90 border border-indigo-500/20"
            >
              {f}
            </span>
          ))}
          {opportunity.technologies.slice(0, 2).map((t, i) => (
            <span
              key={`t-${i}`}
              className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-slate-800/40 text-cyan-300/80 border border-cyan-500/20"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div>
        {/* 원천 정보 검증 영역 (Source Provenance Bar) */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{opportunity.sourceOrganization}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">
              {opportunity.sourceVerifiedAt.split("T")[0]} 확인
            </span>
          </div>

          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 font-medium shrink-0 transition-colors"
          >
            <span>공식 원문</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onOpenDetail(opportunity)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/60 hover:border-indigo-500/40 transition-all"
          >
            <span>상세보기</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {opportunity.applicationUrl && (
            <a
              href={opportunity.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              <span>지원하기</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
