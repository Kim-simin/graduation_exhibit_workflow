"use client";

import React, { useState } from "react";
import {
  Activity,
  Clock,
  Terminal,
  Server,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  Layers,
  ArrowUpRight,
  Shield,
  ExternalLink,
} from "lucide-react";

export interface RunItem {
  run_id: string;
  pipeline: string;
  status: string;
  current_node: string;
  started_at: string;
  completed_at: string;
  records: string;
  elapsed_time?: string;
  platform?: string;
  content_type?: string;
  error?: string | null;
}

export interface LogItem {
  id: string;
  timestamp: string;
  node: string;
  type: string;
  message: string;
  source?: string;
}

export interface AgentItem {
  id: string;
  name: string;
  node: string;
  status: string;
  last_active: string;
  throughput: string;
  health: string;
}

interface RunMonitorPanelProps {
  currentRun: RunItem | null;
  runs: RunItem[];
  logs: LogItem[];
  agents: AgentItem[];
  selectedRunId?: string | null;
  onSelectRun?: (runId: string) => void;
}

export default function RunMonitorPanel({
  currentRun,
  runs,
  logs,
  agents,
  selectedRunId,
  onSelectRun,
}: RunMonitorPanelProps) {
  const [activeTab, setActiveTab] = useState<"runs" | "logs" | "agents">("runs");
  const [runSubFilter, setRunSubFilter] = useState<"ALL" | "RUNNING" | "FAILED" | "WAITING">("ALL");

  const filteredRuns = runs.filter((r) => {
    if (runSubFilter === "RUNNING") return r.status === "RUNNING" || r.status === "Running";
    if (runSubFilter === "FAILED") return r.status === "FAILED" || r.status === "Failed";
    if (runSubFilter === "WAITING") return r.status === "WAITING_FOR_APPROVAL";
    return true;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Running":
      case "RUNNING":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/40";
      case "Completed":
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
      case "Failed":
      case "FAILED":
        return "bg-rose-500/15 text-rose-400 border-rose-500/40";
      case "Blocked":
      case "BLOCKED":
      case "Paused":
      case "PAUSED":
        return "bg-amber-500/15 text-amber-400 border-amber-500/40";
      case "Pending":
      case "PENDING":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="w-full bg-[#0d1322] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* 1. Run Status Hero Banner */}
      <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className={`w-5 h-5 ${currentRun?.status === "RUNNING" || currentRun?.status === "Running" ? "animate-spin" : "animate-pulse"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                Current Active Run
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(currentRun?.status)}`}>
                ● {currentRun?.status || "No active run"}
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white font-mono mt-0.5">
              {currentRun?.run_id || "No active run"}
            </h4>
          </div>
        </div>

        {/* Key Run Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Current Node</span>
            <span className="font-mono text-cyan-400 font-bold">
              {currentRun?.current_node || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Started / Elapsed</span>
            <span className="font-mono text-slate-300">
              {currentRun?.started_at ? (currentRun.started_at.split("T")[1]?.slice(0, 8) || currentRun.started_at.slice(11, 19)) : "-"}
              <span className="text-slate-500 ml-1">({currentRun?.elapsed_time || "-"})</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Records</span>
            <span className="font-mono text-slate-300">
              {currentRun?.records || "No records"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Platform / Type</span>
            <span className="font-mono text-indigo-300 font-bold">
              {currentRun?.platform || "N/A"} / {currentRun?.content_type || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Error Status</span>
            <span
              className={`font-mono font-bold ${
                currentRun?.error && currentRun.error !== "None" ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {currentRun?.error || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sub-tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab("runs")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === "runs"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            ⏱️ Recent Pipeline Runs ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === "logs"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            📋 Audit & Event Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === "agents"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            🤖 Fleet Agent Status ({agents.length})
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
          Live Agent Runtime v2.6 (Live Sync)
        </span>
      </div>

      {/* 3. Tab Contents */}
      <div className="min-h-[160px] max-h-[240px] overflow-y-auto">
        {/* Tab 1: Runs List */}
        {activeTab === "runs" && (
          <div className="space-y-3">
            {/* Quick Status Sub-filters */}
            <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800/80 text-[11px] font-mono">
              <button
                onClick={() => setRunSubFilter("ALL")}
                className={`px-2 py-0.5 rounded transition ${
                  runSubFilter === "ALL" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                전체 ({runs.length})
              </button>
              <button
                onClick={() => setRunSubFilter("RUNNING")}
                className={`px-2 py-0.5 rounded transition ${
                  runSubFilter === "RUNNING" ? "bg-cyan-600 text-white font-bold" : "text-slate-400 hover:text-cyan-400"
                }`}
              >
                실행 중 ({runs.filter((r) => r.status === "RUNNING" || r.status === "Running").length})
              </button>
              <button
                onClick={() => setRunSubFilter("WAITING")}
                className={`px-2 py-0.5 rounded transition ${
                  runSubFilter === "WAITING" ? "bg-amber-600 text-white font-bold" : "text-slate-400 hover:text-amber-400"
                }`}
              >
                승인 대기 ({runs.filter((r) => r.status === "WAITING_FOR_APPROVAL").length})
              </button>
              <button
                onClick={() => setRunSubFilter("FAILED")}
                className={`px-2 py-0.5 rounded transition ${
                  runSubFilter === "FAILED" ? "bg-rose-600 text-white font-bold" : "text-slate-400 hover:text-rose-400"
                }`}
              >
                실패 ({runs.filter((r) => r.status === "FAILED" || r.status === "Failed").length})
              </button>
            </div>

            {filteredRuns.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                선택한 필터 조건에 해당하는 Run이 없습니다.
              </div>
            ) : (
              filteredRuns.map((r, i) => {
                const isSelected = selectedRunId === r.run_id || (!selectedRunId && currentRun?.run_id === r.run_id);
                const isFailed = r.status === "FAILED" || r.status === "Failed";
                return (
                  <div
                    key={r.run_id + i}
                    onClick={() => onSelectRun?.(r.run_id)}
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition ${
                      isSelected
                        ? "bg-cyan-950/30 border-cyan-500/80 shadow-md shadow-cyan-900/20"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        r.status === "COMPLETED" || r.status === "Completed"
                          ? "bg-emerald-400"
                          : isFailed
                          ? "bg-rose-400"
                          : "bg-cyan-400 animate-ping"
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{r.run_id}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                              ACTIVE
                            </span>
                          )}
                          <span className="text-slate-400 font-mono text-[10px]">
                            [노드: {r.current_node || "Unknown"}]
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                          {r.pipeline}
                        </span>
                        {isFailed && r.error && (
                          <span className="text-rose-400 font-mono text-[10px] block mt-1">
                            ⚠️ 에러: {r.error}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 self-end sm:self-auto">
                      <span className="hidden md:inline text-indigo-400 font-semibold">
                        {r.platform || "N/A"} &gt; {r.content_type || "N/A"}
                      </span>
                      <span className="truncate max-w-[130px] hidden sm:inline">{r.records}</span>
                      <span>
                        {r.completed_at
                          ? r.completed_at.split("T")[1]?.slice(0, 8) || r.completed_at.slice(11, 19)
                          : "-"}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-semibold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Event Logs */}
        {activeTab === "logs" && (
          <div className="space-y-1.5 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                기록된 이벤트 로그가 없습니다. (No events recorded)
              </div>
            ) : (
              logs.map((l, i) => (
                <div
                  key={l.id + i}
                  className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/60 flex items-start gap-3 hover:bg-slate-900/50 transition"
                >
                  <span className="text-[10px] text-slate-500 whitespace-nowrap pt-0.5">
                    {l.timestamp
                      ? l.timestamp.split("T")[1]?.slice(0, 8) || l.timestamp.slice(11, 19)
                      : "-"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold shrink-0">
                    {l.node}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    l.type === "FAILED" ? "bg-rose-500/20 text-rose-400" : l.type === "COMPLETED" || l.type === "FINISHED" ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/20 text-cyan-300"
                  }`}>
                    {l.type}
                  </span>
                  <span className="text-slate-300 flex-1 break-all">
                    {l.message}
                  </span>
                  {l.source && (
                    <span className="text-[10px] text-slate-500 hidden sm:inline shrink-0">
                      {l.source}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Fleet Agent Status */}
        {activeTab === "agents" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-slate-500 text-xs">
                에이전트 정보를 불러올 수 없습니다. (Not available)
              </div>
            ) : (
              agents.map((ag) => (
                <div
                  key={ag.id}
                  className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white font-mono">{ag.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(ag.status)}`}>
                      ● {ag.status}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pipeline Stage:</span>
                      <strong className="text-cyan-400">{ag.node}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Throughput:</span>
                      <span className="text-slate-200">{ag.throughput || "Not available"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Active:</span>
                      <span className="text-slate-300">
                        {ag.last_active && ag.last_active !== "-"
                          ? ag.last_active.split("T")[1]?.slice(0, 8) || ag.last_active.slice(11, 19)
                          : "Not available"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Health:</span>
                      <span className={`font-bold ${ag.health === "Healthy" ? "text-emerald-400" : "text-amber-400"}`}>
                        {ag.health}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
