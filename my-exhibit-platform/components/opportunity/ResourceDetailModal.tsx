"use client";

import React from "react";
import { Opportunity, Equipment } from "@/types/opportunity";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  FileText,
  Wrench,
  Award,
  Hash,
  Phone,
  Layers,
} from "lucide-react";

interface ResourceDetailModalProps {
  item: Opportunity | Equipment | null;
  kind: "OPPORTUNITY" | "EQUIPMENT" | null;
  onClose: () => void;
}

export default function ResourceDetailModal({ item, kind, onClose }: ResourceDetailModalProps) {
  if (!item || !kind) return null;

  const isOpportunity = kind === "OPPORTUNITY";
  const opp = isOpportunity ? (item as Opportunity) : null;
  const eq = !isOpportunity ? (item as Equipment) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-indigo-950/40">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4 bg-slate-900/50">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                {isOpportunity ? opp?.type : eq?.equipment_category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {item.accessScope}
              </span>
              {isOpportunity && opp?.dDayText && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
                  {opp.dDayText}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white leading-tight">
              {isOpportunity ? opp?.title : eq?.equipment_name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isOpportunity ? opp?.providerName : `${eq?.university} (${eq?.facility_name || eq?.center_name})`}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* 주요 설명 */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>기본 정보 및 상세 설명</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 text-slate-200 leading-relaxed whitespace-pre-line">
              {isOpportunity
                ? opp?.description
                : eq?.specification || eq?.supported_work || eq?.supported_research}
            </div>
          </div>

          {/* 대상 학생 및 전공 조건 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>대상 학생 / 자격 요건</span>
              </div>
              <div className="text-slate-200 font-medium">
                {isOpportunity ? opp?.targetStudents : eq?.eligible_users}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>관련 전공</span>
              </div>
              <div className="text-slate-200 font-medium">
                {isOpportunity
                  ? opp?.majorRestriction
                    ? opp.eligibleMajors.join(", ")
                    : "전공 무관 (모든 전공 가능)"
                  : eq?.related_majors.join(", ")}
              </div>
            </div>
          </div>

          {opp?.type === "RND" && opp.recruitmentEvidence && (
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-2">
              <h4 className="text-xs font-semibold text-cyan-300">학생 참여 확인 근거</h4>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{opp.recruitmentEvidence.eligibilityText}</p>
              <p className="text-xs text-slate-400 whitespace-pre-wrap">{opp.recruitmentEvidence.recruitmentText}</p>
              {opp.officialSourceVerified && (
                <a href={opp.recruitmentEvidence.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:underline">
                  모집요강 원문 확인 <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* 일정 정보 (Opportunity) 또는 장비 사양 (Equipment) */}
          {isOpportunity ? (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>기간 및 일정</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">모집 기간: </span>
                  <span className="text-white font-medium">
                    {opp?.recruitmentEndAt
                      ? `${opp.recruitmentStartAt?.split("T")[0] || "시작일 미확인"} ~ ${opp.recruitmentEndAt.split("T")[0]}`
                      : opp?.recruitmentEvidence?.rollingAdmission && opp?.recruitmentStatus === "OPEN"
                        ? "상시 모집 (공식 원문 확인)"
                        : "모집기간 확인 필요"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">프로그램 기간: </span>
                  <span className="text-white font-medium">
                    {opp?.programStartAt
                      ? `${opp.programStartAt.split("T")[0]} ~ ${
                          opp.programEndAt ? opp.programEndAt.split("T")[0] : "상시"
                        }`
                      : "상시 진행"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>장비 스펙 및 세부 정보</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">모델명: </span>
                  <span className="text-white">{eq?.model || "공식 페이지 참조"}</span>
                </div>
                <div>
                  <span className="text-slate-400">제조사: </span>
                  <span className="text-white">{eq?.manufacturer || "공식 페이지 참조"}</span>
                </div>
                <div>
                  <span className="text-slate-400">보유 수량: </span>
                  <span className="text-white">{eq?.quantity || "확인 필요"}</span>
                </div>
                <div>
                  <span className="text-slate-400">설치 위치: </span>
                  <span className="text-white">{eq?.location || "캠퍼스 내"}</span>
                </div>
              </div>
              {eq?.reservation_method && (
                <div className="pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400">예약/신청 방법: </span>
                  <span className="text-slate-200">{eq.reservation_method}</span>
                </div>
              )}
            </div>
          )}

          {/* 혜택 및 지원 내용 */}
          {isOpportunity && opp?.benefits && opp.benefits.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>참여 혜택 및 지원 내용</span>
              </h4>
              <ul className="space-y-1.5">
                {opp.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 관련 기술 및 키워드 */}
          {isOpportunity && opp?.technologies && opp.technologies.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>활용 기술 및 주요 키워드</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {opp.technologies.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 text-cyan-300 border border-cyan-500/20"
                  >
                    {t}
                  </span>
                ))}
                {opp.tags.map((t, i) => (
                  <span
                    key={`tag-${i}`}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/60 text-indigo-300 border border-indigo-500/20"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 원천 정보 검증 박스 (Section 3 Provenance Mandatory) */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">원천 정보 검증 (Source Provenance)</span>
              </div>
              <span className="text-[11px] text-emerald-400/80">
                최종 확인: {isOpportunity ? opp?.sourceVerifiedAt : eq?.verified_at}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>
                <span className="text-slate-400">발행/출처 기관: </span>
                <span className="font-semibold text-white">
                  {isOpportunity ? opp?.sourceOrganization : eq?.source_organization}
                </span>
              </div>
              {item.contentHash && (
                <div className="text-[10px] text-slate-400 truncate">
                  <span className="font-mono">무결성 해시: {item.contentHash}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">공식 대학/기관 공식 사이트에서 직접 확인한 원문</span>
              <a
                href={isOpportunity ? opp?.sourceUrl : eq?.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-colors"
              >
                <span>공식 원문 보기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            닫기
          </button>

          {(isOpportunity ? opp?.applicationUrl : eq?.reservation_url) && (
            <a
              href={(isOpportunity ? opp?.applicationUrl : eq?.reservation_url) as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>{isOpportunity ? "공식 신청 페이지 이동" : "장비 예약 및 이용안내 이동"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
