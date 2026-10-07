"use client";

import React from "react";
import { Opportunity } from "@/types/opportunity";
import { getProjectBadge, getRecruitmentStatusInfo } from "@/lib/opportunity";
import {
  Building2,
  Calendar,
  GraduationCap,
  Users,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  School,
  Clock,
  Briefcase,
} from "lucide-react";

interface ProjectCardProps {
  project: Opportunity;
  onOpenDetail: (project: Opportunity) => void;
}

export default function ProjectCard({ project, onOpenDetail }: ProjectCardProps) {
  const typeBadge = getProjectBadge(project);
  const statusInfo = getRecruitmentStatusInfo(
    project.status,
    project.recruitmentEndAt,
    project.recruitmentEvidence?.rollingAdmission
  );

  // 전공 텍스트 포맷팅
  const majorText =
    !project.majorRestriction || project.eligibleMajors.includes("ALL")
      ? "전공 무관 (모든 학과)"
      : project.eligibleMajors.slice(0, 3).join(", ") +
        (project.eligibleMajors.length > 3 ? ` 외 ${project.eligibleMajors.length - 3}개` : "");

  // 참여 가능 대학 포맷팅 (공식 근거가 확인된 경우에만 표시, 근거 없으면 필드 숨김)
  const hasSpecificUniversities =
    project.eligibleUniversities &&
    project.eligibleUniversities.length > 0 &&
    !project.eligibleUniversities.includes("ALL");

  const hasVerifiedNationwide =
    (project.crossUniversityAvailable || project.eligibleUniversities?.includes("ALL")) &&
    project.studentEligibilityVerified === true &&
    (project.eligibilityEvidence?.includes("전국") ||
      project.targetStudents?.includes("전국") ||
      project.targetStudents?.includes("모든 대학생"));

  const universityText = hasSpecificUniversities
    ? project.eligibleUniversities.slice(0, 2).join(", ") +
      (project.eligibleUniversities.length > 2 ? ` 외 ${project.eligibleUniversities.length - 2}개교` : "")
    : hasVerifiedNationwide
    ? "전국 모든 대학 (제한 없음)"
    : null;

  // 모집 기간 포맷팅
  const getPeriodText = () => {
    if (project.recruitmentEvidence?.rollingAdmission || (!project.recruitmentEndAt && project.status === "OPEN")) {
      return "상시 모집 (예산 소진 시까지)";
    }
    if (project.recruitmentStartAt && project.recruitmentEndAt) {
      const start = project.recruitmentStartAt.split("T")[0];
      const end = project.recruitmentEndAt.split("T")[0];
      return `${start} ~ ${end}`;
    }
    if (project.recruitmentEndAt) {
      return `~ ${project.recruitmentEndAt.split("T")[0]} 마감`;
    }
    return "공식 상세 공고 참조";
  };

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between group">
      <div>
        {/* 상단 뱃지 영역: 프로젝트 유형 Badge & 모집 상태 Badge (검증 완료된 상태만 표시) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${typeBadge.badgeClass}`}
            >
              [{typeBadge.label}]
            </span>
            {project.dDayText && !project.dDayText.includes("확인 필요") && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  project.dDayText.includes("D-1") || project.dDayText.includes("오늘")
                    ? "bg-rose-950/80 text-rose-300 border border-rose-700/60 animate-pulse"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {project.dDayText}
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

        {/* 프로젝트명 */}
        <h3
          onClick={() => onOpenDetail(project)}
          className="text-base md:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug cursor-pointer mb-2.5"
        >
          {project.title}
        </h3>

        {/* 기업/기관명 & 주관 대학 또는 사업단 */}
        <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-400 mb-3.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              기업·기관:
            </span>
            <span className="text-slate-200 font-medium truncate">{project.providerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-cyan-400" />
              주관·사업단:
            </span>
            <span className="text-slate-300 truncate">
              {project.sourceOrganization || project.region || "산학협력단"}
            </span>
          </div>
        </div>

        {/* 핵심 조건 요약 (모집기간, 요구전공, 참여가능대학, 모집인원) */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-3.5">
          <div className="flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">모집 기간:</span>
            <span className="text-slate-200 font-medium">{getPeriodText()}</span>
          </div>

          <div className="flex items-start gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">요구 전공:</span>
            <span className="text-indigo-300 font-medium truncate">{majorText}</span>
          </div>

          {universityText && (
            <div className="flex items-start gap-2">
              <School className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="text-slate-400 shrink-0">참여 대학:</span>
              <span className="text-slate-200 truncate">{universityText}</span>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">모집 대상:</span>
            <span className="text-slate-300 truncate">{project.targetStudents || "학부생 및 대학원생"}</span>
          </div>
        </div>

        {/* 프로젝트 간단 설명 */}
        <p className="text-xs text-slate-300/80 line-clamp-2 mb-4 leading-relaxed bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/30">
          {project.description}
        </p>
      </div>

      <div>
        {/* 원천 출처 정보 바 */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{project.sourceOrganization}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">
              {project.sourceVerifiedAt.split("T")[0]}
            </span>
          </div>

          <a
            href={project.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-indigo-400 font-medium shrink-0 transition-colors"
          >
            <span>원문 출처</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onOpenDetail(project)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/60 hover:border-indigo-500/40 transition-all"
          >
            <span>상세보기</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {project.applicationUrl && (
            <a
              href={project.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all shrink-0"
            >
              <span>지원하기</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
