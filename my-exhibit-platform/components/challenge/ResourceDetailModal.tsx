"use client";

import React from "react";
import { ChallengeResource, AccessLevel } from "@/types/challenge";
import {
  X,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Layers,
  Database,
  Tag,
  Cpu,
  BookOpen,
  Lock,
} from "lucide-react";

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ChallengeResource | null;
}

export default function ResourceDetailModal({
  isOpen,
  onClose,
  resource,
}: ResourceDetailModalProps) {
  if (!isOpen || !resource) return null;

  const getAccessBadge = (level: AccessLevel) => {
    switch (level) {
      case "PUBLIC":
        return {
          label: "전국 대학 공개 (PUBLIC)",
          color: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
          icon: ShieldCheck,
          desc: "전국 모든 대학 소속 재학생 및 지도교수가 자유롭게 연구/과제에 열람 및 활용할 수 있는 공개 자산입니다.",
        };
      case "UNIVERSITY_ONLY":
        return {
          label: "대학 협약 한정 공개 (UNIVERSITY ONLY)",
          color: "bg-blue-950/80 text-blue-300 border-blue-700/60",
          icon: ShieldCheck,
          desc: "산학협력 협약 체결 대학의 재학생 및 참여 프로젝트 팀원에게만 인증 후 라이선스가 부여됩니다.",
        };
      case "PARTNER_ONLY":
        return {
          label: "기업 파트너십 한정 (PARTNER ONLY)",
          color: "bg-purple-950/80 text-purple-300 border-purple-700/60",
          icon: Lock,
          desc: "해당 기업 및 참여 기관의 정식 팀 승인 후 보안 서약서를 체결한 학생에게 제한적으로 제공됩니다.",
        };
      case "CONFIDENTIAL":
      default:
        return {
          label: "비공개 보안 자산 (CONFIDENTIAL)",
          color: "bg-rose-950/80 text-rose-300 border-rose-700/60",
          icon: ShieldAlert,
          desc: "기업 내부 보안 규정에 따라 온라인으로 자동 공개되지 않으며 오프라인 전용 연구소에서만 열람 가능합니다.",
        };
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "PATENT":
        return <FileCheck className="w-5 h-5 text-amber-400" />;
      case "DATASET":
        return <Database className="w-5 h-5 text-cyan-400" />;
      case "BRAND_IP":
        return <Tag className="w-5 h-5 text-pink-400" />;
      case "EQUIPMENT":
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case "RESEARCH":
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
      default:
        return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  const access = getAccessBadge(resource.accessLevel);
  const AccessIcon = access.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f1424] border border-slate-800 p-6 md:p-7 shadow-2xl text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
            {getResourceTypeIcon(resource.type)}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {resource.type} RESOURCE
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
              {resource.title}
            </h3>
          </div>
        </div>

        {/* 보안 및 공개 권한 배지 */}
        <div className={`p-3 rounded-xl border mb-4 ${access.color}`}>
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
            <AccessIcon className="w-3.5 h-3.5" />
            <span>{access.label}</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">{access.desc}</p>
        </div>

        {/* 상세 설명 */}
        <div className="space-y-3 text-xs md:text-sm text-slate-300">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
              자원 상세 설명
            </span>
            <p className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {resource.providerName && (
            <div className="flex items-center justify-between text-xs py-2 border-t border-slate-800/80 text-slate-400">
              <span>제공 기관 / 부서:</span>
              <strong className="text-slate-200">{resource.providerName}</strong>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          {resource.url && resource.accessLevel === "PUBLIC" ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
            >
              <span>공개 자료실 바로가기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-400">
              ※ 팀 참여 승인 완료 후 보안 포털을 통해 발급됩니다.
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition ml-auto"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
