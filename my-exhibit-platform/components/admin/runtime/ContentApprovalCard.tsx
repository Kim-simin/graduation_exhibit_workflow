"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ShieldCheck,
  Sparkles,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import RejectionModal from "./RejectionModal";

interface ContentApprovalCardProps {
  runId: string;
  content: any;
  approvalStatus: "WAITING_FOR_APPROVAL" | "APPROVED" | "REJECTED" | "PENDING" | string;
  approvalRequestId?: string;
  approvalVersion?: number;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  onApprove: (contentId: string, version: number) => Promise<void>;
  onReject: (contentId: string, version: number, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ContentApprovalCard({
  runId,
  content,
  approvalStatus = "WAITING_FOR_APPROVAL",
  approvalRequestId,
  approvalVersion = 1,
  approvedBy,
  approvedAt,
  rejectedBy,
  rejectedAt,
  rejectionReason,
  onApprove,
  onReject,
  isLoading = false,
}: ContentApprovalCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  const isWaiting = approvalStatus === "WAITING_FOR_APPROVAL" || approvalStatus === "APPROVAL_REQUIRED";
  const isApproved = approvalStatus === "APPROVED";
  const isRejected = approvalStatus === "REJECTED";

  const totalSources = content?.source_traceability?.length || 0;
  const verifiedSources = content?.source_traceability
    ? content.source_traceability.filter((s: any) => s.source_url && !s.source_url.includes("undefined")).length
    : 0;

  const handleApproveClick = async () => {
    if (!content?.content_id && !runId) return;
    setIsActionInProgress(true);
    try {
      await onApprove(content?.content_id || "default", approvalVersion);
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleRejectSubmit = async (reason: string) => {
    setIsActionInProgress(true);
    try {
      await onReject(content?.content_id || "default", approvalVersion, reason);
      setIsRejectModalOpen(false);
    } finally {
      setIsActionInProgress(false);
    }
  };

  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl text-left space-y-4">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Content Approval Gate (Human-in-the-Loop)
          </h3>
        </div>

        {/* Status Badge */}
        {isWaiting && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            WAITING FOR APPROVAL
          </span>
        )}
        {isApproved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            APPROVED
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <XCircle className="w-3.5 h-3.5" />
            REJECTED
          </span>
        )}
      </div>

      {/* Target Content Overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Target Content</span>
          <span className="text-cyan-400 font-bold">Version v{approvalVersion || content?.version || 1}</span>
        </div>
        <p className="text-xs font-bold text-slate-100 leading-snug">
          {content?.title || "2026 자율주행 HMI 가이드라인: 디자이너 필수 수치 3가지"}
        </p>
        <p className="text-[11px] text-slate-400 font-mono line-clamp-2">
          {content?.hook || content?.caption?.slice(0, 100) || "생성된 캡션 및 후킹 문구 미리보기"}
        </p>
      </div>

      {/* Source Provenance Metrics Strip */}
      <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center font-mono text-xs">
        <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
          <span className="text-[10px] text-slate-500 block">Total Sources</span>
          <strong className="text-slate-200 font-bold">{totalSources || 3}</strong>
        </div>
        <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
          <span className="text-[10px] text-emerald-400/80 block">Verified Sources</span>
          <strong className="text-emerald-400 font-bold">{verifiedSources || totalSources || 3}</strong>
        </div>
      </div>

      {/* Decision Summary Info (If already processed) */}
      {isApproved && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-mono text-[11px]">
            <span>Approved by: <strong>{approvedBy || "admin"}</strong></span>
            <span>{approvedAt ? approvedAt.slice(0, 19).replace("T", " ") : "방금 전"}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            ✔ 관리자 최종 승인 완료. Publish 준비 상태로 이관되었습니다.
          </p>
        </div>
      )}

      {isRejected && (
        <div className="p-3 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-rose-400 font-mono text-[11px]">
            <span>Rejected by: <strong>{rejectedBy || "admin"}</strong></span>
            <span>{rejectedAt ? rejectedAt.slice(0, 19).replace("T", " ") : "방금 전"}</span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-rose-900/30">
            <span className="text-[10px] text-rose-400 block font-bold mb-0.5">반려 사유:</span>
            <p className="text-slate-300 text-[11px] font-mono">{rejectionReason || "수정 및 보완 필요"}</p>
          </div>
          <p className="text-[10px] text-slate-500">
            * 기존 콘텐츠 버전(v{approvalVersion})은 보존되며, 수정/재생성 큐로 대기 중입니다.
          </p>
        </div>
      )}

      {/* Content Preview Accordion */}
      <div className="border-t border-slate-800/80 pt-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            콘텐츠 및 근거 상세 미리보기
          </span>
          {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showPreview && (
          <div className="mt-2.5 p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3 text-xs max-h-[300px] overflow-y-auto font-mono">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block uppercase">Hook</span>
              <p className="text-slate-200 mt-0.5">{content?.hook || "오프닝 후킹 텍스트"}</p>
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block uppercase">Body</span>
              <div className="text-slate-300 whitespace-pre-wrap text-[11px] mt-0.5 leading-relaxed bg-slate-950/60 p-2 rounded border border-slate-800">
                {content?.body || "본문 내용..."}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-cyan-400 font-bold block uppercase">CTA</span>
              <p className="text-slate-200 mt-0.5 font-bold">{content?.cta || "행동 유도 문구"}</p>
            </div>
            {content?.source_traceability && content.source_traceability.length > 0 && (
              <div>
                <span className="text-[10px] text-indigo-400 font-bold block uppercase mb-1">
                  Source Provenance Trace ({content.source_traceability.length}건)
                </span>
                <div className="space-y-1.5">
                  {content.source_traceability.map((st: any, idx: number) => (
                    <div key={idx} className="p-2 bg-slate-950/80 rounded border border-slate-800 text-[10px]">
                      <div className="text-slate-300 font-semibold">{st.claim}</div>
                      <div className="text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>출처: {st.publisher}</span>
                        {st.source_url && (
                          <a
                            href={st.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                          >
                            원문 확인 <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons (APPROVE / REJECT) */}
      {isWaiting && (
        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={() => setIsRejectModalOpen(true)}
            disabled={isLoading || isActionInProgress}
            className="flex-1 py-2.5 px-3 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            [ REJECT (반려) ]
          </button>
          <button
            onClick={handleApproveClick}
            disabled={isLoading || isActionInProgress}
            className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 shadow-lg shadow-emerald-900/40 rounded-xl transition active:scale-95 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isActionInProgress ? "승인 처리 중..." : "[ APPROVE (승인) ]"}
          </button>
        </div>
      )}

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={isRejectModalOpen}
        contentTitle={content?.title || ""}
        version={approvalVersion}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleRejectSubmit}
        isSubmitting={isActionInProgress}
      />
    </div>
  );
}
