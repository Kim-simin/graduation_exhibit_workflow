"use client";

import React, { useState } from "react";
import { X, AlertTriangle, AlertCircle, Send } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  contentTitle: string;
  version: number;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting?: boolean;
}

export default function RejectionModal({
  isOpen,
  contentTitle,
  version,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("반려 사유는 필수 항목입니다. 상세한 피드백을 입력해주세요.");
      return;
    }
    setError(null);
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">콘텐츠 반려 (Human Reject)</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Info */}
        <div className="my-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono">
            <span>대상 콘텐츠 (Version v{version})</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 line-clamp-2">{contentTitle || "생성된 콘텐츠"}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              반려 사유 (필수 입력)
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              rows={4}
              placeholder="반려 사유 및 수정/재생성 요청 사항을 입력해주세요. (예: 팩트 수치 강조 부족, 첫 3초 후킹 문구 변경 요망 등)"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-xs text-slate-200 placeholder-slate-500 transition outline-none resize-none font-mono"
            />
            {error && (
              <p className="flex items-center gap-1.5 text-rose-400 text-xs mt-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            * 반려 확정 시 상태가 <span className="text-rose-400 font-semibold font-mono">REJECTED</span>로 전환되며, 현재 버전의 콘텐츠와 원천정보는 보존됩니다.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-xl shadow-lg shadow-rose-900/30 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "반려 처리 중..." : "반려 확정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
