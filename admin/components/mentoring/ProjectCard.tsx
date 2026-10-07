"use client";

import React from "react";
import Link from "next/link";
import { MentoringProject } from "@/types/project";
import { getStageInfo, getReviewStatusInfo, DEFAULT_PROJECT_IMAGE } from "@/lib/project";
import {
  Building2,
  Calendar,
  Clock,
  ChevronRight,
  Layers,
  GraduationCap,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  GitBranch,
  Briefcase,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

interface ProjectCardProps {
  project: MentoringProject;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const isStudent = project.origin === "student";
  const stageInfo = getStageInfo(project.progressStage, project.origin);
  const reviewInfo = getReviewStatusInfo(project.mentorReviewStatus);

  const participantDisplay = isStudent
    ? project.teamMembers && project.teamMembers.length > 0
      ? project.teamMembers.map((m) => m.name).join(" · ")
      : "학생 참가자"
    : project.companyLead?.name || (project.teamMembers && project.teamMembers.length > 0 ? project.teamMembers[0].name : "기업 R&D 멘토");

  const collaborationLabels =
    project.collaborationNeedLabels && project.collaborationNeedLabels.length > 0
      ? project.collaborationNeedLabels
      : isStudent
      ? ["현업 피드백", "기업 멘토", "실증기업"]
      : ["문제 제공", "현직자 멘토링", "최종 평가"];

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20 flex flex-col justify-between group">
      <div>
        <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden border-b border-slate-800/60">
          <img
            src={project.thumbnail || DEFAULT_PROJECT_IMAGE}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121626] via-transparent to-black/50 pointer-events-none" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex flex-wrap items-center gap-1.5">
              {isStudent ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-950/90 text-indigo-300 border border-indigo-500/60 backdrop-blur-sm shadow-sm">
                  <GraduationCap className="w-3 h-3 text-cyan-400" />
                  학생 제안
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-purple-950/90 text-purple-200 border border-purple-500/60 backdrop-blur-sm shadow-sm">
                  <Building2 className="w-3 h-3 text-pink-400" />
                  기업 제안
                </span>
              )}

              {project.projectTypes
                .filter((t) => t !== "학생 제안" && t !== "기업 제안")
                .slice(0, 2)
                .map((type, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0b0e17]/85 text-slate-300 border border-slate-700/60 backdrop-blur-sm"
                  >
                    [{type}]
                  </span>
                ))}
            </div>

            {project.isDemo && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-md">
                DEMO
              </span>
            )}
          </div>

          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border backdrop-blur-sm ${stageInfo.badgeClass}`}
            >
              <GitBranch className="w-3 h-3 text-cyan-400" />
              {stageInfo.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-sm ${reviewInfo.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${reviewInfo.dotClass}`} />
              {reviewInfo.label}
            </span>
          </div>
        </div>

        <div className="p-5 md:p-6 pb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 truncate">
            {isStudent ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-semibold text-slate-300 truncate">{project.university}</span>
                <span className="text-slate-600">·</span>
                <span className="truncate text-slate-400">{project.department}</span>
              </>
            ) : (
              <>
                <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-semibold text-purple-300 truncate">{project.company}</span>
                <span className="text-slate-600">·</span>
                <span className="truncate text-slate-400">운영: {project.university}</span>
              </>
            )}
          </div>

          <Link
            href={`/mentoring/projects/${project.id}`}
            className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 block mb-2"
          >
            {project.title}
          </Link>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[36px]">
            {project.summary || project.description}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-3 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/60">
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">{isStudent ? "참여 학생:" : "기업 담당:"}</span>
            <span className="font-semibold text-white truncate text-[11px]">{participantDisplay}</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {project.skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#171e35] text-slate-300 border border-slate-700/60"
              >
                #{skill}
              </span>
            ))}
          </div>

          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <span>현재 단계:</span>
                <strong className="text-slate-200">{stageInfo.label}</strong>
              </span>
              <span className="font-mono font-bold text-cyan-400">
                {project.progressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(project.progressPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              {isStudent ? "필요한 협력 (Collaboration Needed)" : "기업 참여 형태 (Company Participation)"}
            </span>
            <div className="flex flex-wrap gap-1">
              {collaborationLabels.slice(0, 4).map((label, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    isStudent
                      ? "bg-indigo-950/40 text-indigo-300 border-indigo-700/40"
                      : "bg-purple-950/40 text-purple-300 border-purple-700/40"
                  }`}
                >
                  [{label}]
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs bg-[#0f1322]/50">
        <span className="text-[11px] text-slate-500 font-mono">
          {project.updatedAt ? `${project.updatedAt} 갱신` : "최신"}
        </span>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/mentoring/projects/${project.id}`}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition shadow-sm ${
              isStudent
                ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                : "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
            }`}
          >
            <span>{isStudent ? "프로젝트 보기" : "Challenge 보기"}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
