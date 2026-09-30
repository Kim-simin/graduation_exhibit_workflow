"use client";

import React from "react";
import Link from "next/link";
import { Challenge } from "@/types/challenge";
import { Users, Briefcase, ArrowRight, Sparkles } from "lucide-react";

interface ChallengeStickyCTAProps {
  challenge: Challenge;
  selectedMajor?: string;
  onOpenTeamModal: () => void;
}

export default function ChallengeStickyCTA({
  challenge,
  selectedMajor,
  onOpenTeamModal,
}: ChallengeStickyCTAProps) {
  // Check if any major still recruiting
  const hasRecruitingSlots = challenge.majorRequirements.some(
    (req) => req.currentMembers < req.capacity
  );

  // Proposal submit URL with prefill query params (Section 10)
  const proposalHref = `/rfp/submit?challengeId=${encodeURIComponent(
    challenge.id
  )}&challengeTitle=${encodeURIComponent(
    challenge.title
  )}&parentChallenge=${encodeURIComponent(
    challenge.parentChallengeTitle
  )}&industry=${encodeURIComponent(
    challenge.industry
  )}&provider=${encodeURIComponent(
    challenge.providerName
  )}${selectedMajor ? `&selectedMajor=${encodeURIComponent(selectedMajor)}` : ""}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c101d]/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-3 shadow-2xl transition-transform">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* 좌측 정보 (데스크톱 전용 노출) */}
        <div className="hidden md:flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
              {challenge.parentChallengeTitle.split(" ")[0]}
            </span>
            <span className="text-sm font-bold text-white truncate max-w-md">
              {challenge.title}
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5">
            제출 마감: <strong className="text-slate-300">{challenge.proposalDeadline}</strong> · {challenge.providerName}
          </span>
        </div>

        {/* 우측 CTA 버튼 그룹 (모바일은 가로 꽉 차게 배치) */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* 팀 참여 신청 버튼 */}
          {hasRecruitingSlots ? (
            <button
              type="button"
              onClick={onOpenTeamModal}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-[#1e243a] hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-600/40 hover:border-indigo-500 transition shadow-md whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>팀 참여 신청</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-slate-800 text-slate-500 cursor-not-allowed whitespace-nowrap"
            >
              <span>전공 모집 완료</span>
            </button>
          )}

          {/* 과제 제안서 제출 CTA (기존 RFP 제출 페이지로 자동 prefill 이동) */}
          <Link
            href={proposalHref}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30 whitespace-nowrap"
          >
            <Briefcase className="w-4 h-4" />
            <span>과제 제안서 제출</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
