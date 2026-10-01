"use client";

import React, { useState } from "react";
import { WorkflowNodeData } from "./AgentWorkflowGraph";
import {
  Sparkles,
  ShieldCheck,
  Layers,
  Database,
  Zap,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Server,
  Code2,
  Globe,
  Building2,
  GraduationCap,
  Briefcase,
  Tag,
  Filter,
  Link2,
  UserCheck,
  XCircle,
} from "lucide-react";
import ContentApprovalCard from "./ContentApprovalCard";
import AntigravityIntakeBox from "./AntigravityIntakeBox";
import {
  InformationSource,
  SourceSummary,
  getSourcePriorityLabel,
  getSourceCategory,
  getVerificationStatusBadge,
  getUrlStatusBadge,
  isValidHttpUrl,
  parseDomainFromUrl,
  resolveSourceUrl,
} from "@/lib/source-traceability";

interface NodeDetailPanelProps {
  node: WorkflowNodeData | null;
  onClose?: () => void;
  onApprove?: (contentId: string, version: number) => Promise<void>;
  onReject?: (contentId: string, version: number, reason: string) => Promise<void>;
}

export default function NodeDetailPanel({
  node,
  onClose,
  onApprove,
  onReject,
}: NodeDetailPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!node) {
    return (
      <div className="w-full h-full bg-slate-900/70 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-slate-500">
        <Server className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-sm font-semibold text-slate-400">Node를 선택해주세요</p>
        <p className="text-xs text-slate-600 mt-1">
          좌측 Workflow Graph에서 단계를 클릭하면 상세 Agent 스펙과 입출력 데이터가 표시됩니다.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Running":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/40";
      case "Completed":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
      case "Failed":
        return "bg-rose-500/15 text-rose-400 border-rose-500/40";
      case "Blocked":
        return "bg-amber-500/15 text-amber-400 border-amber-500/40";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  // Information Sources extraction
  const rawSources: InformationSource[] = node.information_sources || [];
  const sourceSummary: SourceSummary = node.source_summary || {
    total_sources: rawSources.length,
    verified_count: rawSources.filter((s) => s.verification_status === "VERIFIED").length,
    unverified_count: rawSources.filter((s) => s.verification_status === "UNVERIFIED").length,
    failed_count: rawSources.filter((s) => s.verification_status === "FAILED").length,
    last_research_time: node.last_run_time || "-",
    by_domain: {
      university: rawSources.filter((s) => s.source_type === "UNIVERSITY_OFFICIAL").length,
      corporate_rfp: rawSources.filter((s) => s.source_type === "CORPORATE_RFP").length,
      professor: rawSources.filter((s) => s.source_type === "PROFESSOR_OFFICIAL").length,
      mentor: rawSources.filter((s) => s.source_type === "MENTOR_PROFILE").length,
      brand_ip: rawSources.filter((s) => s.source_type === "BRAND_IP_OFFICIAL").length,
    },
  };

  // 5-domain filter list
  const categoryTabs = [
    { id: "all", label: "전체", count: rawSources.length, icon: Globe },
    { id: "university", label: "University", desc: "전국 대학 공식", count: sourceSummary.by_domain.university, icon: GraduationCap },
    { id: "corporate_rfp", label: "Corporate RFP", desc: "기업 산학/RFP", count: sourceSummary.by_domain.corporate_rfp, icon: Building2 },
    { id: "professor", label: "Professor", desc: "교수 공식정보", count: sourceSummary.by_domain.professor, icon: Sparkles },
    { id: "mentor", label: "Mentor", desc: "현직자 멘토링", count: sourceSummary.by_domain.mentor, icon: Briefcase },
    { id: "brand_ip", label: "Brand IP", desc: "기업 브랜드 IP", count: sourceSummary.by_domain.brand_ip, icon: Tag },
  ];

  const filteredSources = rawSources.filter((src) => {
    if (selectedCategory === "all") return true;
    const cat = getSourceCategory(src.source_type);
    return cat.id === selectedCategory;
  });

  return (
    <div className="w-full bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold">
              {node.id.toUpperCase()}
            </span>
            <h2 className="text-lg font-extrabold text-white">{node.name}</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
              node.status
            )}`}
          >
            ● {node.status}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono">{node.agent_name}</p>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
          {node.role}
        </p>
      </div>

      {/* Antigravity Zero-Touch Intake Trigger (Only on Research Node) */}
      {node.id === "node-research" && (
        <div className="mb-4">
          <AntigravityIntakeBox compact={true} />
        </div>
      )}

      {/* Property Matrix Grid */}
      <div className="space-y-4 text-xs">
        {/* Input */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Input (수집 및 입력 파라미터)
          </label>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 text-slate-300 font-mono text-[11px] leading-relaxed">
            {node.input || "-"}
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Source (출처 및 신뢰도 검증 체계)
          </label>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 text-slate-300 font-mono text-[11px] leading-relaxed">
            {node.source || "-"}
          </div>
        </div>

        {/* Output */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Output (산출 결과물 및 규격)
          </label>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 text-slate-300 font-mono text-[11px] leading-relaxed">
            {node.output || "-"}
          </div>
        </div>

        {/* Run Metrics Table */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
            <span className="text-[10px] text-slate-500 font-medium block mb-1">Last Run</span>
            <span className="font-mono font-bold text-slate-200 text-[11px] break-all">
              {node.last_run_time || "-"}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90">
            <span className="text-[10px] text-slate-500 font-medium block mb-1">Records</span>
            <span className="font-mono font-bold text-cyan-400 text-[11px]">
              {node.records_count || "No Run Data"}
            </span>
          </div>

          <div className="col-span-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Error Status</span>
              <span
                className={`font-mono text-xs font-bold ${
                  node.error !== "None" ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {node.error}
              </span>
            </div>
            {node.error === "None" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* STEP 9-2: INFORMATION SOURCES SECTION (Research Node Focused) */}
        {/* ============================================================ */}
        {node.id === "node-research" && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase">
                  Information Sources (원천정보 추적)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredSources.length} of {rawSources.length} sources
              </span>
            </div>

            {/* 5-Domain Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {categoryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? "bg-cyan-500/30 text-cyan-200" : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Source Summary Card */}
            <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Source Summary</span>
                <span className="text-slate-500 font-mono text-[9px]">
                  Last Research: {sourceSummary.last_research_time?.slice(0, 16).replace("T", " ")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 block">Total Sources</span>
                  <strong className="text-white text-xs font-bold">{sourceSummary.total_sources}</strong>
                </div>
                <div className="bg-emerald-950/20 p-2 rounded-lg border border-emerald-800/30">
                  <span className="text-[9px] text-emerald-400/80 block">Verified</span>
                  <strong className="text-emerald-400 text-xs font-bold">{sourceSummary.verified_count}</strong>
                </div>
                <div className="bg-amber-950/20 p-2 rounded-lg border border-amber-800/30">
                  <span className="text-[9px] text-amber-400/80 block">Unverified</span>
                  <strong className="text-amber-400 text-xs font-bold">{sourceSummary.unverified_count}</strong>
                </div>
              </div>
            </div>

            {/* Information Sources List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredSources.length === 0 ? (
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center text-slate-500 text-xs">
                  선택한 카테고리에 해당하는 원천 정보가 없습니다.
                </div>
              ) : (
                filteredSources.map((src, idx) => {
                  const priorityMeta = getSourcePriorityLabel(src.source_priority);
                  const statusMeta = getVerificationStatusBadge(src.verification_status);
                  const urlMeta = getUrlStatusBadge(src.url_status);
                  const domainDisplay = src.source_domain || parseDomainFromUrl(src.source_url);
                  const categoryMeta = getSourceCategory(src.source_type);
                  const resolvedUrl = resolveSourceUrl(src);

                  return (
                    <div
                      key={src.source_id || idx}
                      className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-700/90 rounded-xl p-3.5 transition-all text-xs space-y-2.5"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Priority Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityMeta.badgeClass}`}
                          >
                            {priorityMeta.label}
                          </span>
                          {/* Category Tag */}
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                            {categoryMeta.emoji} {categoryMeta.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* URL Status Badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${urlMeta.badgeClass}`}>
                            {urlMeta.label}
                          </span>
                          {/* Verification Status */}
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                            <span>{statusMeta.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Source Title & Name */}
                      <div>
                        {src.source_name && (
                          <span className="text-[10px] font-bold text-cyan-400 block mb-0.5">
                            {src.source_name}
                          </span>
                        )}
                        <h4 className="font-bold text-slate-200 text-xs line-clamp-2 leading-snug">
                          {src.source_title || "출처 제목 미지정"}
                        </h4>
                      </div>

                      {/* Evidence text snippet */}
                      {src.evidence && (
                        <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/50 leading-relaxed">
                          <strong className="text-cyan-500/90 font-semibold mr-1">Evidence:</strong>
                          {src.evidence}
                        </p>
                      )}

                      {/* Section 8: Metadata Details Grid */}
                      <div className="bg-slate-900/40 rounded-lg p-2.5 border border-slate-800/60 space-y-1.5 font-mono text-[10px]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-500 shrink-0">Original URL:</span>
                          <span className="text-slate-300 truncate max-w-[220px]" title={src.source_url || "None"}>
                            {src.source_url || "(None)"}
                          </span>
                        </div>
                        {src.canonical_url && src.canonical_url !== src.source_url && (
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-500 shrink-0">Canonical URL:</span>
                            <span className="text-cyan-400 truncate max-w-[220px]" title={src.canonical_url}>
                              {src.canonical_url}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 shrink-0">Domain:</span>
                          <span className="text-slate-300 font-semibold">
                            {domainDisplay || "unknown domain"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500 shrink-0">Retrieved:</span>
                          <span className="text-slate-400">
                            {src.collected_at ? src.collected_at.replace("T", " ").slice(0, 16) : src.last_verified_at ? src.last_verified_at.replace("T", " ").slice(0, 16) : "-"}
                          </span>
                        </div>
                      </div>

                      {/* Section 7: Action Footer (Open Original Source vs Source URL unavailable) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                        <span className="text-[10px] font-mono text-slate-500">
                          {src.entity_id ? `Entity: ${src.entity_id}` : "Entity unmapped"}
                        </span>

                        {resolvedUrl ? (
                          <a
                            href={resolvedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 font-semibold transition-all shrink-0 text-xs shadow-sm shadow-cyan-950/50"
                          >
                            <span>Open Original Source</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[10px] italic">
                            Source URL unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Dynamic Extra Breakdown if available */}
        {node.validation_breakdown && (
          <div className="mt-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              4대 핵심 영역 검증 완료율
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="text-slate-300">
                🎓 교수진: <strong className="text-cyan-400">{node.validation_breakdown.professors}</strong>
              </div>
              <div className="text-slate-300">
                🚗 산학 RFP: <strong className="text-cyan-400">{node.validation_breakdown.rfp}</strong>
              </div>
              <div className="text-slate-300">
                🏷️ 브랜드 IP: <strong className="text-cyan-400">{node.validation_breakdown.brand_ip}</strong>
              </div>
              <div className="text-slate-300">
                💼 현직 멘토: <strong className="text-cyan-400">{node.validation_breakdown.mentors}</strong>
              </div>
            </div>
          </div>
        )}

        {node.db_metrics && (
          <div className="mt-2 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              Change Detection (DIFF) 통계
            </span>
            <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-center">
              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Created</span>
                <strong className="text-emerald-400">{node.db_metrics.created}</strong>
              </div>
              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Updated</span>
                <strong className="text-cyan-400">{node.db_metrics.updated}</strong>
              </div>
              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Skipped</span>
                <strong className="text-slate-400">{node.db_metrics.skipped}</strong>
              </div>
              <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Failed</span>
                <strong className="text-rose-400">{node.db_metrics.failed}</strong>
              </div>
            </div>
          </div>
        )}

        {node.approval_gate && (
          <div className="mt-2 bg-purple-950/30 p-3 rounded-xl border border-purple-800/40">
            <span className="text-[11px] font-bold text-purple-300 block mb-1">
              🛑 Approval Gate (인간 승인 차단선)
            </span>
            <p className="text-[10px] text-purple-200/80 leading-relaxed font-mono">
              {node.approval_gate}
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 9-4: CONTENT GENERATION DETAILS                         */}
        {/* ============================================================ */}
        {node.id === "node-content-gen" && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase">
                  Content Generation Specification
                </h3>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded-full">
                Version v{node.content_item?.version || 1}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Run ID</span>
                <span className="text-slate-300 truncate block font-bold">{node.run_id}</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Content ID</span>
                <span className="text-cyan-400 truncate block font-bold">{node.content_item?.content_id || "cnt-default"}</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Channel / Format</span>
                <span className="text-slate-200 block font-bold uppercase">
                  {node.content_item?.platform || "instagram"} &gt; {node.content_item?.content_type || "reels"}
                </span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Sources Verified</span>
                <span className="text-emerald-400 block font-bold">
                  {node.content_item?.source_traceability?.length || 3} of {node.content_item?.source_traceability?.length || 3} Verified
                </span>
              </div>
            </div>

            {/* Content Preview Box */}
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Generated Content Preview
              </span>
              <p className="text-xs font-bold text-white leading-snug">
                {node.content_item?.title || "2026 자율주행 HMI 가이드라인: 디자이너 필수 수치 3가지"}
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono line-clamp-4 whitespace-pre-wrap">
                {node.content_item?.hook || node.content_item?.body || "콘텐츠 미리보기"}
              </div>
              <p className="text-[11px] text-cyan-400 font-mono">
                👉 CTA: {node.content_item?.cta || "지금 저장하고 공유하세요!"}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 9-4: HUMAN APPROVAL GATE DETAILS                        */}
        {/* ============================================================ */}
        {node.id === "node-approval-gate" && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-extrabold text-white tracking-wider uppercase">
                  Human Approval Inspection
                </h3>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                Req: {node.approval_request_id || "apr-gate"}
              </span>
            </div>

            {/* Approval Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Approval Status</span>
                <span className="text-amber-300 font-bold block">{node.approval_status || node.status}</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Target Version</span>
                <span className="text-cyan-400 font-bold block">Version v{node.approval_version || 1}</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Reviewer</span>
                <span className="text-slate-300 block">{node.approved_by || node.rejected_by || "Admin Pending"}</span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Reviewed At</span>
                <span className="text-slate-400 block truncate">
                  {node.approved_at || node.rejected_at ? (node.approved_at || node.rejected_at)?.slice(0, 19).replace("T", " ") : "-"}
                </span>
              </div>
            </div>

            {node.rejection_reason && (
              <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-800/50 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Rejection Reason (반려 사유)
                </span>
                <p className="text-slate-200 font-mono text-[11px]">{node.rejection_reason}</p>
              </div>
            )}

            {/* Embedded Interactive Approval Card */}
            {onApprove && onReject && (
              <ContentApprovalCard
                runId={node.run_id}
                content={node.target_content}
                approvalStatus={node.approval_status || node.status}
                approvalRequestId={node.approval_request_id}
                approvalVersion={node.approval_version || 1}
                approvedBy={node.approved_by}
                approvedAt={node.approved_at}
                rejectedBy={node.rejected_by}
                rejectedAt={node.rejected_at}
                rejectionReason={node.rejection_reason}
                onApprove={onApprove}
                onReject={onReject}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
