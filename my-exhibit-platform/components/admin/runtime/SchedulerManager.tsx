"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Shield,
  Plus,
  Terminal,
  FileCheck2,
  Lock,
} from "lucide-react";

interface ScheduleItem {
  scheduleId: string;
  name: string;
  workflowId: string;
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  scope: any;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastRunStatus: string;
  maxAttempts: number;
  retryCount: number;
  nextRetryAt: string | null;
}

interface SchedulerAuditLog {
  event_id: string;
  event_type: string;
  schedule_id: string;
  actor_id: string;
  actor_role: string;
  run_id: string | null;
  timestamp: string;
  details: any;
}

export default function SchedulerManager() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<SchedulerAuditLog[]>([]);
  const [kstNow, setKstNow] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Schedule Modal state
  const [showModal, setShowModal] = useState(false);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [newScheduleCron, setNewScheduleCron] = useState("0 9 * * *");
  const [newScheduleCategory, setNewScheduleCategory] = useState("디자인·UX/UI");

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/schedules");
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
        setAuditLogs(data.audit_logs || []);
        setKstNow(data.kst_now || "");
        setIsLocked(data.is_locked || false);
      }
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleToggle = async (scheduleId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        setActionNotice(`스케줄 상태가 ${!currentEnabled ? "활성화(Enabled)" : "비활성화(Disabled)"}되었습니다.`);
        await fetchSchedules();
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "상태 변경 실패");
      }
    } catch (err: any) {
      alert("토글 오류: " + err.message);
    }
  };

  const handleRunNow = async (scheduleId: string) => {
    setRunningId(scheduleId);
    setActionNotice(isDryRun ? "🧪 Dry Run 시뮬레이션 실행 중..." : "🚀 Workflow Scheduler 가동 중 (Research -> Content Gen -> WAITING_FOR_APPROVAL)...");
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({ dry_run: isDryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setActionNotice("⚠️ [중복 실행 차단] 다른 파이프라인 또는 스케줄이 이미 실행 중입니다.");
        } else {
          setActionNotice("❌ 실행 실패: " + (data.error || "알 수 없는 오류"));
        }
      } else {
        if (isDryRun) {
          setActionNotice(`✅ [Dry Run 완료] 계획된 Run ID: ${data.result?.plan?.planned_run_id || "simulated"}`);
        } else {
          setActionNotice(`✅ [실행 완료] 파이프라인 가동 완료 -> 승인 대기(WAITING_FOR_APPROVAL) 도달`);
        }
        await fetchSchedules();
      }
    } catch (err: any) {
      setActionNotice("❌ 실행 오류: " + err.message);
    } finally {
      setRunningId(null);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName.trim() || !newScheduleCron.trim()) {
      alert("이름과 Cron 표현식을 입력해 주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-role": "admin",
        },
        body: JSON.stringify({
          name: newScheduleName.trim(),
          cronExpression: newScheduleCron.trim(),
          scope: {
            target: "verified_universities",
            platform: "INSTAGRAM",
            content_type: "REELS",
            category: newScheduleCategory,
          },
          enabled: true,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNewScheduleName("");
        setActionNotice("✅ 신규 스케줄이 등록되었습니다.");
        await fetchSchedules();
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        const data = await res.json();
        alert(data.error || "스케줄 등록 실패");
      }
    } catch (err: any) {
      alert("등록 오류: " + err.message);
    }
  };

  const formatKstDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Workflow Automation Scheduler
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                STEP 10 · KST Asia/Seoul
              </span>
              {isLocked && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Pipeline Running (Locked)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              정해진 시각(Cron)에 6단계 파이프라인을 자동 가동하며, 콘텐츠 생성 후 반드시 <span className="text-amber-400 font-semibold">WAITING_FOR_APPROVAL</span>에서 대기합니다.
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Dry Run Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-mono text-slate-300 transition select-none">
            <input
              type="checkbox"
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900"
            />
            <span className={isDryRun ? "text-cyan-400 font-bold" : "text-slate-400"}>
              🧪 Dry Run Mode
            </span>
          </label>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Schedule</span>
          </button>

          <button
            onClick={() => fetchSchedules()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-300 shadow-md flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Schedules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((item) => {
          const isItemRunning = runningId === item.scheduleId;
          return (
            <div
              key={item.scheduleId}
              className={`p-5 rounded-2xl border transition-all ${
                item.enabled
                  ? "bg-slate-900/80 border-slate-800 shadow-lg hover:border-slate-700"
                  : "bg-slate-950/60 border-slate-800/40 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.enabled
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {item.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
                    ID: {item.scheduleId} · Workflow: {item.workflowId}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Enable / Disable toggle button */}
                  <button
                    onClick={() => handleToggle(item.scheduleId, item.enabled)}
                    className={`p-1.5 rounded-lg border transition ${
                      item.enabled
                        ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/60"
                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700"
                    }`}
                    title={item.enabled ? "Disable Schedule" : "Enable Schedule"}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spec Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono my-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-slate-500 block text-[10px]">CRON EXPRESSION</span>
                  <span className="text-cyan-300 font-bold">{item.cronExpression}</span>
                  <span className="text-slate-500 text-[10px] block">({item.timezone})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LAST STATUS</span>
                  <span
                    className={`font-bold ${
                      item.lastRunStatus === "WAITING_FOR_APPROVAL"
                        ? "text-amber-400"
                        : item.lastRunStatus === "SUCCESS"
                        ? "text-emerald-400"
                        : item.lastRunStatus === "FAILED"
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {item.lastRunStatus || "NONE"}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-800/40 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> Next Run (KST):
                  </span>
                  <span className="text-slate-300 font-semibold">{formatKstDate(item.nextRunAt)}</span>
                </div>
              </div>

              {/* Scope & Action Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/60 mt-3">
                <div className="text-[11px] font-mono text-slate-400">
                  Target: <span className="text-slate-300">{item.scope?.category || "디자인·UX/UI"}</span> ({item.scope?.platform || "INSTAGRAM"})
                </div>

                <button
                  onClick={() => handleRunNow(item.scheduleId)}
                  disabled={isItemRunning || (isLocked && !isDryRun)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
                    isDryRun
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Play className={`w-3 h-3 ${isItemRunning ? "animate-spin" : ""}`} />
                  <span>{isItemRunning ? "Executing..." : isDryRun ? "Simulate Dry Run" : "Run Now"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scheduler Audit Log Section */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Scheduler Execution & Audit Logs ({auditLogs.length})
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Current KST: {formatKstDate(kstNow)}
          </span>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 font-mono text-xs">
          {auditLogs.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              기록된 스케줄러 실행 로그가 없습니다.
            </div>
          ) : (
            auditLogs.map((log) => {
              const isTrigger = log.event_type === "SCHEDULE_TRIGGERED";
              const isSkipped = log.event_type === "SCHEDULE_SKIPPED";
              const isDry = log.event_type === "DRY_RUN_EXECUTED";
              return (
                <div
                  key={log.event_id}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px]"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isTrigger
                          ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                          : isSkipped
                          ? "bg-amber-950 text-amber-400 border border-amber-800"
                          : isDry
                          ? "bg-purple-950 text-purple-400 border border-purple-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {log.event_type}
                    </span>
                    <div>
                      <span className="text-white font-semibold">[{log.schedule_id}]</span>{" "}
                      <span className="text-slate-400">
                        {log.details?.reason || log.run_id || log.details?.schedule_name || "Completed"}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">
                    {formatKstDate(log.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              신규 워크플로우 스케줄 등록
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              정해진 Cron 주기에 따라 6단계 파이프라인을 자동 트리거합니다.
            </p>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">스케줄 명칭</label>
                <input
                  type="text"
                  required
                  placeholder="예: 일일 디자인/UX 리서치 파이프라인 (09:00)"
                  value={newScheduleName}
                  onChange={(e) => setNewScheduleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Cron 표현식 (5단위)</label>
                <input
                  type="text"
                  required
                  placeholder="0 9 * * * (매일 09:00)"
                  value={newScheduleCron}
                  onChange={(e) => setNewScheduleCron(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  분 시 일 월 요일 · Timezone: Asia/Seoul (KST)
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">리서치 산업군</label>
                <select
                  value={newScheduleCategory}
                  onChange={(e) => setNewScheduleCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="디자인·UX/UI">디자인 · UX/UI · 서비스디자인</option>
                  <option value="미술·회화">미술 · 회화 · 조소 · 현대미술</option>
                  <option value="영상·미디어">영상 · 애니메이션 · 미디어아트</option>
                  <option value="건축·공간">건축 · 실내 · 공간디자인</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition shadow-lg shadow-cyan-600/20"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
