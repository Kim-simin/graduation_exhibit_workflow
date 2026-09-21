"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Send,
  MessageSquare,
  Sparkles,
  Instagram,
  FileText,
} from "lucide-react";

export interface QueueItem {
  queue_id: string;
  content_id: string;
  case_no: string;
  title: string;
  content_type: string;
  channel: string;
  version: number;
  version_history?: Array<{
    version: number;
    status: string;
    content_id: string;
    rejection_reason?: string | null;
  }>;
  status: string;
  approval_status: string;
  qa_score: number;
  source_summary: {
    total: number;
    verified: number;
    status: string;
  };
  sources: Array<{
    claim: string;
    source_url: string;
    publisher: string;
  }>;
  run_id?: string | null;
  schedule_id?: string | null;
  created_at: string;
  updated_at: string;
  hook?: string;
  body_preview?: string;
  caption?: string;
  hashtags?: string[];
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
}

interface ApprovalQueueViewProps {
  onSelectRun?: (runId: string) => void;
  onRefreshStats?: () => void;
}

export default function ApprovalQueueView({ onSelectRun, onRefreshStats }: ApprovalQueueViewProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("WAITING_FOR_APPROVAL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [versionFilter, setVersionFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Detail & Rejection Modal
  const [inspectItem, setInspectItem] = useState<QueueItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<QueueItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        content_type: typeFilter,
        channel: channelFilter,
        date: dateFilter,
        version: versionFilter,
        sort_by: sortBy,
      });

      const res = await fetch(`/api/admin/approval-queue?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        setItems(data.items || []);
      } else {
        setError(data.error || "대기열 데이터를 불러오지 못했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "네트워크 오류 발생");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, channelFilter, dateFilter, versionFilter, sortBy]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Client-side text search
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content_id.toLowerCase().includes(q) ||
      item.case_no.toLowerCase().includes(q)
    );
  });

  // Toggle selection
  const handleToggleSelect = (contentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const waitingItems = filteredItems.filter(
      (it) => it.status === "WAITING_FOR_APPROVAL" || it.approval_status === "WAITING_FOR_APPROVAL"
    );
    if (selectedIds.size === waitingItems.length && waitingItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(waitingItems.map((it) => it.content_id)));
    }
  };

  // Bulk Approve Handler
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`선택한 ${count}개 대기 콘텐츠를 일괄 승인하시겠습니까?`)) {
      return;
    }

    setIsBulkProcessing(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin/approval/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({
          action: "APPROVE",
          content_ids: Array.from(selectedIds),
          reviewer: "admin_lead",
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        setActionFeedback(`✅ 총 ${data.approved_count}개 콘텐츠가 성공적으로 일괄 승인되었습니다.`);
        setSelectedIds(new Set());
        fetchQueue();
        onRefreshStats?.();
      } else {
        setActionFeedback(`❌ 일괄 승인 실패: ${data.error || "권한 오류"}`);
      }
    } catch (err: any) {
      setActionFeedback(`❌ 네트워크 오류: ${err.message}`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Individual Approve Handler
  const handleIndividualApprove = async (item: QueueItem) => {
    if (!confirm(`'${item.title}' 콘텐츠를 승인하시겠습니까?`)) return;

    setIsSubmittingDecision(true);
    try {
      const res = await fetch("/api/admin/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({
          action: "APPROVE",
          content_id: item.content_id,
          run_id: item.run_id,
          version: item.version,
          reviewer: "admin_director",
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        setActionFeedback(`✅ '${item.title}' (v${item.version}) 승인 완료`);
        fetchQueue();
        onRefreshStats?.();
        if (inspectItem?.content_id === item.content_id) {
          setInspectItem(null);
        }
      } else {
        alert(`승인 실패: ${data.error || "오류"}`);
      }
    } catch (err: any) {
      alert(`승인 오류: ${err.message}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Individual Reject Handler
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      alert("반려 사유(rejection_reason)를 반드시 입력해야 합니다.");
      return;
    }

    setIsSubmittingDecision(true);
    try {
      const res = await fetch("/api/admin/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({
          action: "REJECT",
          content_id: rejectingItem.content_id,
          run_id: rejectingItem.run_id,
          version: rejectingItem.version,
          rejection_reason: rejectionReason.trim(),
          reviewer: "admin_qa_lead",
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        setActionFeedback(`🛑 '${rejectingItem.title}' (v${rejectingItem.version}) 반려 처리 완료`);
        setRejectingItem(null);
        setRejectionReason("");
        fetchQueue();
        onRefreshStats?.();
        if (inspectItem?.content_id === rejectingItem.content_id) {
          setInspectItem(null);
        }
      } else {
        alert(`반려 실패: ${data.error || "오류"}`);
      }
    } catch (err: any) {
      alert(`반려 오류: ${err.message}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Controls */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-white tracking-tight">
                Approval Queue (승인 대기열)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                {items.filter((it) => it.status === "WAITING_FOR_APPROVAL").length}건 대기
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              생성된 콘텐츠의 팩트 출처 및 규격 무결성을 검토하고 승인 또는 반려를 결정합니다.
            </p>
          </div>

          {/* Quick Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, ID 검색..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="대기열 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filters & Sorting Bar */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">상태 (Status)</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
            >
              <option value="WAITING_FOR_APPROVAL">대기 중 (Waiting)</option>
              <option value="ALL">전체 상태 (All)</option>
              <option value="APPROVED">승인됨 (Approved)</option>
              <option value="REJECTED">반려됨 (Rejected)</option>
            </select>
          </div>

          {/* Content Type Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">콘텐츠 유형</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
            >
              <option value="ALL">전체 유형</option>
              <option value="reels">릴스 (Reels)</option>
              <option value="cardnews">카드뉴스</option>
              <option value="longform">롱폼 아티클</option>
            </select>
          </div>

          {/* Channel Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">플랫폼 채널</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
            >
              <option value="ALL">전체 플랫폼</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="THREADS">Threads</option>
              <option value="BLOG">Blog</option>
            </select>
          </div>

          {/* Version Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">버전 (Version)</label>
            <select
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
            >
              <option value="ALL">전체 버전</option>
              <option value="1">v1</option>
              <option value="2">v2</option>
              <option value="3">v3</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">생성 기간</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
            >
              <option value="ALL">전체 기간</option>
              <option value="today">오늘 (Today)</option>
              <option value="week">최근 7일</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">정렬 기준</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 font-medium"
            >
              <option value="newest">최신 생성순</option>
              <option value="oldest">오래된 대기순</option>
              <option value="type">유형순</option>
              <option value="channel">채널순</option>
            </select>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs font-mono text-cyan-300 flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-white">
              닫기
            </button>
          </div>
        )}

        {/* Bulk Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-medium text-[11px] transition"
            >
              대기 항목 전체 선택
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              {selectedIds.size}개 항목 선택됨
            </span>
          </div>

          <button
            onClick={handleBulkApprove}
            disabled={selectedIds.size === 0 || isBulkProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs transition shadow-lg shadow-emerald-950/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>선택 항목 일괄 승인 ({selectedIds.size})</span>
          </button>
        </div>
      </div>

      {/* 2. Queue Items List / Table */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span>대기열 목록을 조회하는 중...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-400 font-mono text-xs">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600" />
            <span className="text-white font-bold">대기 중인 콘텐츠가 없습니다</span>
            <span className="text-slate-500">모든 승인 대기 항목이 처리되었거나 필터 조건에 맞는 항목이 없습니다.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.content_id);
              const isWaiting = item.status === "WAITING_FOR_APPROVAL" || item.approval_status === "WAITING_FOR_APPROVAL";
              const isApproved = item.status === "APPROVED" || item.approval_status === "APPROVED";
              const isRejected = item.status === "REJECTED" || item.approval_status === "REJECTED";

              return (
                <div
                  key={item.content_id}
                  className={`p-4 transition hover:bg-slate-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected ? "bg-cyan-950/20" : ""
                  }`}
                >
                  {/* Left: Checkbox + Main Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isWaiting}
                        onChange={() => handleToggleSelect(item.content_id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-600 focus:ring-cyan-500 disabled:opacity-30 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {item.case_no}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.content_id}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                            isWaiting
                              ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                              : isApproved
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                              : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                          }`}
                        >
                          {item.status}
                        </span>

                        {/* Version Badge with History */}
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                            v{item.version}
                          </span>
                          {item.version_history && item.version_history.length > 1 && (
                            <span className="text-[10px] font-mono text-rose-400" title="이전 버전 반려 이력 존재">
                              (이전 {item.version_history.length - 1}회 반려)
                            </span>
                          )}
                        </div>

                        {/* Channel & Type */}
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                          {item.channel} &gt; {item.content_type.toUpperCase()}
                        </span>

                        {/* QA & Source Verified */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{item.source_summary.verified}/{item.source_summary.total} 출처</span>
                        </span>
                      </div>

                      {/* Content Title */}
                      <h3 className="text-sm font-bold text-white truncate">
                        {item.title}
                      </h3>

                      {/* Content Hook Snippet */}
                      {item.hook && (
                        <p className="text-xs text-slate-400 italic line-clamp-1">
                          &quot;{item.hook}&quot;
                        </p>
                      )}

                      {/* Rejection Reason Notice if Rejected */}
                      {isRejected && item.rejection_reason && (
                        <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 font-mono">
                          <strong>반려 사유:</strong> {item.rejection_reason}
                        </div>
                      )}

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
                        {item.run_id && (
                          <button
                            onClick={() => onSelectRun?.(item.run_id!)}
                            className="hover:text-cyan-400 underline decoration-dotted"
                          >
                            Run: {item.run_id}
                          </button>
                        )}
                        <span>생성: {new Date(item.created_at).toLocaleString("ko-KR")}</span>
                        {item.approved_by && <span>승인자: {item.approved_by}</span>}
                        {item.rejected_by && <span>반려자: {item.rejected_by}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setInspectItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>검수 / 출처 확인</span>
                    </button>

                    {isWaiting && (
                      <>
                        <button
                          onClick={() => handleIndividualApprove(item)}
                          disabled={isSubmittingDecision}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-md shadow-emerald-950/30"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>승인</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectingItem(item);
                            setRejectionReason("");
                          }}
                          disabled={isSubmittingDecision}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1 shadow-md shadow-rose-950/30"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>반려</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Detail & Source Inspection Drawer / Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-white">
                  콘텐츠 상세 검수 및 출처 증빙
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs font-sans">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">제목 (Title)</span>
                <p className="text-base font-bold text-white">{inspectItem.title}</p>
              </div>

              {inspectItem.hook && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">Hook</span>
                  <p className="text-slate-200 font-medium">{inspectItem.hook}</p>
                </div>
              )}

              {inspectItem.body_preview && (
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">본문 내용 요약</span>
                  <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300 whitespace-pre-line leading-relaxed font-mono">
                    {inspectItem.body_preview}
                  </div>
                </div>
              )}

              {/* Source Provenance Section (Section 12) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">원천정보 근거 추적 (Source Provenance)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {inspectItem.source_summary.verified}개 공인 출처 확인됨
                  </span>
                </div>

                <div className="space-y-2">
                  {inspectItem.sources.map((src, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 space-y-1">
                      <p className="text-white font-medium">{src.claim}</p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-850">
                        <span>발행처: {src.publisher || "공식 기관"}</span>
                        {src.source_url ? (
                          <a
                            href={src.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 font-bold"
                          >
                            <span>원천정보 열람 (Open Source)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600">URL 정보 없음</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Content ID: {inspectItem.content_id} · v{inspectItem.version}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  닫기
                </button>
                {inspectItem.status === "WAITING_FOR_APPROVAL" && (
                  <>
                    <button
                      onClick={() => handleIndividualApprove(inspectItem)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      승인 결정
                    </button>
                    <button
                      onClick={() => {
                        setRejectingItem(inspectItem);
                        setRejectionReason("");
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                    >
                      반려
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Mandatory Rejection Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-rose-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-extrabold text-white">
                콘텐츠 반려 사유 입력 (필수)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              반려 사유는 다음 버전(v{rejectingItem.version + 1}) 생성 프롬프트에 직접 반영되며 영구 감사 로그에 보존됩니다.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="예: 120cd/m2 조도 기준 도표 시인성 개선 및 인포그래픽 수치 가독성 보완 필요"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim() || isSubmittingDecision}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs"
              >
                반려 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
