"use client";

import React from "react";
import Link from "next/link";
import { Challenge } from "@/types/challenge";
import {
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface ChallengeCardProps {
  challenge: Challenge;
  selectedMajorId?: string;
  onOpenTeamModal?: (challenge: Challenge, preselectedMajor?: string) => void;
}

export default function ChallengeCard({
  challenge,
  selectedMajorId,
  onOpenTeamModal,
}: ChallengeCardProps) {
  // Check if any major still has recruiting slots
  const hasRecruitingSlots = challenge.majorRequirements.some(
    (req) => req.currentMembers < req.capacity
  );

  // Status badge config
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECRUITING":
      case "OPEN":
        return {
          label: "모집중",
          style: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60",
          dot: "bg-emerald-400",
        };
      case "PROPOSAL_REVIEW":
        return {
          label: "제안 검토중",
          style: "bg-amber-950/70 text-amber-300 border-amber-700/60",
          dot: "bg-amber-400",
        };
      case "IN_PROGRESS":
        return {
          label: "프로젝트 진행중",
          style: "bg-blue-950/70 text-blue-300 border-blue-700/60",
          dot: "bg-blue-400",
        };
      case "COMPLETED":
        return {
          label: "완료",
          style: "bg-slate-800 text-slate-400 border-slate-700",
          dot: "bg-slate-500",
        };
      default:
        return {
          label: "모집 마감",
          style: "bg-slate-800 text-slate-400 border-slate-700",
          dot: "bg-slate-500",
        };
    }
  };

  const statusBadge = getStatusBadge(challenge.status);

  // Difficulty badge
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Intermediate":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Advanced":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  // Find matching major requirement name if filtered
  const filteredReq = selectedMajorId && selectedMajorId !== "all"
    ? challenge.majorRequirements.find((r) => r.majorCategoryId === selectedMajorId)
    : null;

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between group">
      <div>
        {/* 상단 뱃지 라인 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 상위 메가 챌린지 뱃지 */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              {challenge.parentChallengeTitle.split(" ")[0]}
            </span>

            {/* 난이도 뱃지 */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getDifficultyBadge(
                challenge.difficulty
              )}`}
            >
              {challenge.difficulty}
            </span>

            {/* 공개 범위 */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/70 text-slate-400 border border-slate-700/50">
              <ShieldCheck className="w-2.5 h-2.5 text-slate-400" />
              {challenge.accessLevel === "PUBLIC" ? "전국 대학 공개" : challenge.accessLevel}
            </span>
          </div>

          {/* 모집 상태 뱃지 */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.style}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot} animate-pulse`} />
            {statusBadge.label}
          </span>
        </div>

        {/* 챌린지 타이틀 */}
        <Link
          href={`/industry-challenges/${challenge.id}`}
          className="block group-hover:text-indigo-400 transition-colors"
        >
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight line-clamp-2 leading-snug">
            {challenge.title}
          </h3>
        </Link>

        {/* Short Problem 요약 */}
        <p className="mt-2 text-xs md:text-sm text-slate-400 leading-relaxed line-clamp-2">
          &ldquo;{challenge.shortProblem}&rdquo;
        </p>

        {/* 제공 기관 & 지역 메타 정보 (클릭 시 공식 사이트 연계) */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {challenge.providerUrl ? (
              <a
                href={challenge.providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-300 hover:text-indigo-300 font-medium truncate max-w-[200px] hover:underline flex items-center gap-1"
                title={`${challenge.providerName} 공식 웹사이트`}
              >
                <span className="truncate">{challenge.providerName}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              </a>
            ) : (
              <span className="text-slate-300 font-medium truncate max-w-[200px]">
                {challenge.providerName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            {challenge.regionUrl ? (
              <a
                href={challenge.regionUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-indigo-300 truncate hover:underline flex items-center gap-1"
                title={`${challenge.region} 포털`}
              >
                <span className="truncate">{challenge.region}</span>
                <ExternalLink className="w-2.5 h-2.5 text-slate-500 shrink-0" />
              </a>
            ) : (
              <span className="truncate">{challenge.region}</span>
            )}
          </div>
        </div>

        {/* 6. 학과별 모집 현황 (Required Majors Progress) */}
        <div className="mt-4 p-3 rounded-xl bg-[#0b0e1b]/80 border border-slate-800/70">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>학과별 모집 역할 현황</span>
            </span>
            <span className="text-[10px] text-slate-500">참여인원 / 모집정원</span>
          </div>

          <div className="space-y-1.5">
            {challenge.majorRequirements.map((req) => {
              const isFilled = req.currentMembers >= req.capacity;
              const isTargetFilter = filteredReq?.id === req.id;

              return (
                <div
                  key={req.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    isTargetFilter
                      ? "bg-indigo-950/60 border border-indigo-500/40 text-indigo-200"
                      : "bg-slate-900/50 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{req.majorCategoryName}</span>
                    <span className="text-[10px] text-slate-500 hidden sm:inline truncate max-w-[120px]">
                      ({req.roleName})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isFilled ? "text-slate-500" : "text-emerald-400"
                      }`}
                    >
                      {req.currentMembers}/{req.capacity}
                    </span>
                    {isFilled ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 font-semibold">
                        모집 완료
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/50">
                        {req.capacity - req.currentMembers}명 모집중
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 필요 역량 Skill Chips */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {challenge.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/60 text-slate-300 border border-slate-700/40"
            >
              #{skill}
            </span>
          ))}
          {challenge.skills.length > 5 && (
            <span className="text-[10px] text-slate-500 self-center">
              +{challenge.skills.length - 5}
            </span>
          )}
        </div>
      </div>

      <div>
        {/* 원천 공고 검증 및 공식 링크 바 */}
        <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-slate-300 font-medium">
              {challenge.providerName.split("&")[0].trim()}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-emerald-400 font-bold">공식 산학공고</span>
          </div>

          {challenge.officialUrl && (
            <a
              href={challenge.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold hover:underline shrink-0 transition-colors"
              title="주관기관 공식 공고 원문 확인"
            >
              <span>공식 공고</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* 하단 메타 & 액션 버튼 영역 */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="whitespace-nowrap">기간 {challenge.duration}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 공식 공고 바로가기 버튼 */}
            {challenge.officialUrl && (
              <a
                href={challenge.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#171e35] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-sm whitespace-nowrap"
                title="공식 공고 및 원문 확인"
              >
                <span>공식 원문</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            {/* 팀 참여 버튼 */}
            {hasRecruitingSlots && onOpenTeamModal && (
              <button
                type="button"
                onClick={() => onOpenTeamModal(challenge, filteredReq?.majorCategoryName)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1e2338] hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-700/40 hover:border-indigo-500 transition-all shadow-sm whitespace-nowrap"
              >
                팀 참여
              </button>
            )}

            {/* 상세보기 버튼 */}
            <Link
              href={`/industry-challenges/${challenge.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm shadow-indigo-600/30 whitespace-nowrap"
            >
              <span>상세보기</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
