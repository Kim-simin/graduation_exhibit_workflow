"use client";

import React from "react";
import { Activity, Clock, AlertTriangle, Calendar, CheckCircle2, ChevronRight } from "lucide-react";

interface OperationsTopBarProps {
  activeRunsCount: number;
  waitingApprovalCount: number;
  failedRunsCount: number;
  scheduledCount: number;
  schedulerMode?: string;
  onNavigateTab: (tab: "dashboard" | "queue" | "agents" | "runs" | "schedules" | "datasync" | "content") => void;
}

export default function OperationsTopBar({
  activeRunsCount,
  waitingApprovalCount,
  failedRunsCount,
  scheduledCount,
  schedulerMode = "Manual / External Tick",
  onNavigateTab,
}: OperationsTopBarProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full">
      {/* 1. Active Runs Card */}
      <div
        onClick={() => onNavigateTab("runs")}
        className="group relative bg-[#0a0f1d] hover:bg-[#0d152a] border border-slate-800/80 hover:border-cyan-500/60 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-950/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeRunsCount > 0 ? "bg-cyan-400 animate-ping" : "bg-slate-600"}`} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-cyan-400 transition">
              ACTIVE RUNS
            </span>
          </div>
          <Activity className="w-4 h-4 text-cyan-400/70" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            {activeRunsCount}
          </div>
          <div className="flex items-center text-[10px] font-mono text-slate-500 group-hover:text-cyan-400 transition">
            <span>실행 중</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </div>

      {/* 2. Waiting for Approval Card (Crucial Gateway) */}
      <div
        onClick={() => onNavigateTab("queue")}
        className={`group relative border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg ${
          waitingApprovalCount > 0
            ? "bg-amber-950/20 hover:bg-amber-950/30 border-amber-500/50 hover:border-amber-400 shadow-amber-950/30 ring-1 ring-amber-500/20"
            : "bg-[#0a0f1d] hover:bg-[#0d152a] border-slate-800/80 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${waitingApprovalCount > 0 ? "bg-amber-400 animate-pulse" : "bg-slate-600"}`} />
            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider transition ${
              waitingApprovalCount > 0 ? "text-amber-300" : "text-slate-400 group-hover:text-amber-400"
            }`}>
              WAITING APPROVAL
            </span>
          </div>
          <Clock className={`w-4 h-4 ${waitingApprovalCount > 0 ? "text-amber-400" : "text-slate-500"}`} />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className={`text-2xl font-black font-mono tracking-tight ${
            waitingApprovalCount > 0 ? "text-amber-400" : "text-white"
          }`}>
            {waitingApprovalCount}
          </div>
          <div className={`flex items-center text-[10px] font-mono transition ${
            waitingApprovalCount > 0 ? "text-amber-400 font-bold" : "text-slate-500 group-hover:text-amber-400"
          }`}>
            <span>대기열 바로가기</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </div>

      {/* 3. Failed Runs Card */}
      <div
        onClick={() => onNavigateTab("runs")}
        className={`group relative border rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg ${
          failedRunsCount > 0
            ? "bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/50 hover:border-rose-400 shadow-rose-950/20 ring-1 ring-rose-500/20"
            : "bg-[#0a0f1d] hover:bg-[#0d152a] border-slate-800/80 hover:border-slate-700"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${failedRunsCount > 0 ? "bg-rose-400" : "bg-slate-600"}`} />
            <span className={`text-[11px] font-mono font-bold uppercase tracking-wider transition ${
              failedRunsCount > 0 ? "text-rose-300" : "text-slate-400 group-hover:text-rose-400"
            }`}>
              FAILED RUNS
            </span>
          </div>
          <AlertTriangle className={`w-4 h-4 ${failedRunsCount > 0 ? "text-rose-400" : "text-slate-500"}`} />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className={`text-2xl font-black font-mono tracking-tight ${
            failedRunsCount > 0 ? "text-rose-400" : "text-white"
          }`}>
            {failedRunsCount}
          </div>
          <div className={`flex items-center text-[10px] font-mono transition ${
            failedRunsCount > 0 ? "text-rose-400 font-bold" : "text-slate-500 group-hover:text-rose-400"
          }`}>
            <span>{failedRunsCount > 0 ? "장애 확인" : "정상 상태"}</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </div>

      {/* 4. Scheduled Automations Card */}
      <div
        onClick={() => onNavigateTab("schedules")}
        className="group relative bg-[#0a0f1d] hover:bg-[#0d152a] border border-slate-800/80 hover:border-indigo-500/60 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-indigo-950/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${scheduledCount > 0 ? "bg-indigo-400" : "bg-slate-600"}`} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-400 transition">
              SCHEDULED
            </span>
          </div>
          <Calendar className="w-4 h-4 text-indigo-400/70" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="text-2xl font-black font-mono tracking-tight text-white">
            {scheduledCount}
          </div>
          <div className="text-[10px] font-mono text-slate-500 text-right leading-tight">
            <span className="block text-slate-400 font-semibold">{schedulerMode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
