"use client";

import React from "react";
import { Opportunity } from "@/types/opportunity";
import { getRecruitmentStatusInfo } from "@/lib/opportunity";
import {
  Trophy,
  Building2,
  Calendar,
  Users,
  GraduationCap,
  School,
  ExternalLink,
  ChevronRight,
  Gift,
  Clock,
  Sparkles,
} from "lucide-react";

interface CompetitionCardProps {
  competition: Opportunity;
  onOpenDetail: (competition: Opportunity) => void;
}

export default function CompetitionCard({ competition, onOpenDetail }: CompetitionCardProps) {
  const statusInfo = getRecruitmentStatusInfo(
    competition.status,
    competition.recruitmentEndAt,
    competition.recruitmentEvidence?.rollingAdmission
  );

  // 대상 전공 포맷팅
  const majorText =
    !competition.majorRestriction || competition.eligibleMajors.includes("ALL")
      ? "전공 무관 (모든 전공 가능)"
      : competition.eligibleMajors.slice(0, 3).join(", ") +
        (competition.eligibleMajors.length > 3 ? ` 외 ${competition.eligibleMajors.length - 3}개` : "");

  // 참여 가능 대학 포맷팅 (공식 근거가 확인된 경우에만 표시, 근거 없으면 필드 숨김)
  const hasSpecificUniversities =
    competition.eligibleUniversities &&
    competition.eligibleUniversities.length > 0 &&
    !competition.eligibleUniversities.includes("ALL");

  const hasVerifiedNationwide =
    (competition.crossUniversityAvailable || competition.eligibleUniversities?.includes("ALL")) &&
    competition.studentEligibilityVerified === true &&
    (competition.eligibilityEvidence?.includes("전국") ||
      competition.targetStudents?.includes("전국") ||
      competition.targetStudents?.includes("모든"));

  const universityText = hasSpecificUniversities
    ? competition.eligibleUniversities.slice(0, 2).join(", ") +
      (competition.eligibleUniversities.length > 2 ? ` 외 ${competition.eligibleUniversities.length - 2}개교` : "")
    : hasVerifiedNationwide
    ? "전국 모든 대학 (제한 없음)"
    : null;

  // 모집기간 포맷팅
  const getRecruitmentPeriod = () => {
    if (competition.recruitmentStartAt && competition.recruitmentEndAt) {
      const start = competition.recruitmentStartAt.split("T")[0];
      const end = competition.recruitmentEndAt.split("T")[0];
      return `${start} ~ ${end}`;
    }
    if (competition.recruitmentEndAt) {
      return `~ ${competition.recruitmentEndAt.split("T")[0]} 마감`;
    }
    return "공식 상세 공고 참조";
  };

  // 행사기간 포맷팅
  const getEventPeriod = () => {
    if (competition.programStartAt && competition.programEndAt) {
      const start = competition.programStartAt.split("T")[0];
      const end = competition.programEndAt.split("T")[0];
      return `${start} ~ ${end}`;
    }
    if (competition.programStartAt) {
      return `${competition.programStartAt.split("T")[0]} 예정`;
    }
    return "모집 완료 후 별도 공지";
  };

  // 상금/혜택
  const prizeText = competition.prizeOrReward || competition.benefits?.[0] || "공식 공고 확인";

  // 개인/팀 여부
  const teamText = competition.teamComposition || competition.targetStudents || "개인 및 팀 참가 가능";

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/20 flex flex-col justify-between group">
      <div>
        {/* 상단 뱃지 영역: 공모전 뱃지 & 모집 상태 Badge (검증 완료된 상태만 표시) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
              <Trophy className="w-3 h-3 text-amber-400" />
              [공모전·경진대회]
            </span>
            {competition.dDayText && !competition.dDayText.includes("확인 필요") && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  competition.dDayText.includes("D-1") || competition.dDayText.includes("오늘")
                    ? "bg-rose-950/80 text-rose-300 border border-rose-700/60 animate-pulse"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {competition.dDayText}
              </span>
            )}
          </div>

          {statusInfo.key !== "UNKNOWN" && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
              [{statusInfo.label}]
            </span>
          )}
        </div>

        {/* 공모전명 */}
        <h3
          onClick={() => onOpenDetail(competition)}
          className="text-base md:text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug cursor-pointer mb-2.5"
        >
          {competition.title}
        </h3>

        {/* 주최 기관 */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
          <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-500 font-medium shrink-0">주최기관:</span>
          <span className="text-slate-200 font-medium truncate">{competition.providerName}</span>
        </div>

        {/* 상금/혜택 하이라이트 박스 */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-amber-950/20 border border-amber-700/30 flex items-center gap-2 text-xs">
          <Gift className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-300/80 font-medium shrink-0">상금·혜택:</span>
          <span className="text-amber-200 font-bold truncate">{prizeText}</span>
        </div>

        {/* 핵심 조건 요약 */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-3.5">
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">모집 기간:</span>
            <span className="text-slate-200 font-medium">{getRecruitmentPeriod()}</span>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">행사 일정:</span>
            <span className="text-slate-200 font-medium">{getEventPeriod()}</span>
          </div>

          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">참가 형태:</span>
            <span className="text-slate-200 font-medium truncate">{teamText}</span>
          </div>

          <div className="flex items-start gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">대상 전공:</span>
            <span className="text-amber-300 font-medium truncate">{majorText}</span>
          </div>

          {universityText && (
            <div className="flex items-start gap-2">
              <School className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="text-slate-400 shrink-0">참여 대학:</span>
              <span className="text-slate-200 truncate">{universityText}</span>
            </div>
          )}
        </div>

        {/* 공모전 설명 요약 */}
        <p className="text-xs text-slate-300/80 line-clamp-2 mb-4 leading-relaxed bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/30">
          {competition.description}
        </p>
      </div>

      <div>
        {/* 원천 공고 링크 바 */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{competition.sourceOrganization}</span>
          </div>

          <a
            href={competition.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 font-medium shrink-0 transition-colors"
          >
            <span>공식 공고</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onOpenDetail(competition)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/60 hover:border-amber-500/40 transition-all"
          >
            <span>상세보기</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {(competition.applicationUrl || competition.sourceUrl) && (
            <a
              href={competition.applicationUrl || competition.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all shrink-0"
            >
              <span>접수처 이동</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
