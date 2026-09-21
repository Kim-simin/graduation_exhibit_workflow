"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import {
  ArrowLeft,
  GraduationCap,
  Play,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  BookOpen,
  Sparkles,
  Users,
  Search,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface Statistics {
  total_universities: number;
  completed: number;
  in_progress: number;
  failed: number;
  new_professors: number;
  updated_professors: number;
  new_tasks: number;
  new_collaborations: number;
  progress_percentage: number;
  last_collected_at: string | null;
  next_scheduled_at: string | null;
}

interface UniversityItem {
  id: string;
  name: string;
  raw_name: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  departments_count: number;
  professors_count: number;
  retry_count: number;
  max_retries: number;
  last_attempt_at: string | null;
  error_message: string | null;
}

interface FailedUniversity {
  university_name: string;
  error: string;
  attempt_count: number;
  failed_at: string;
}

interface FailedProfessor {
  university_name: string;
  department_name: string;
  candidate_name: string;
  profile_url: string | null;
  error: string;
  failed_at: string;
}

export default function ProfessorAdminDashboard() {
  const [stats, setStats] = useState<Statistics>({
    total_universities: 0,
    completed: 0,
    in_progress: 0,
    failed: 0,
    new_professors: 0,
    updated_professors: 0,
    new_tasks: 0,
    new_collaborations: 0,
    progress_percentage: 0.0,
    last_collected_at: null,
    next_scheduled_at: null,
  });

  const [queueItems, setQueueItems] = useState<UniversityItem[]>([]);
  const [failedUnivs, setFailedUnivs] = useState<FailedUniversity[]>([]);
  const [failedProfs, setFailedProfs] = useState<FailedProfessor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isLoading, setIsLoading] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(2);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchQueueData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/professors/queue?page=${page}&pageSize=${pageSize}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SUCCESS") {
          setStats(data.statistics);
          setQueueItems(data.university_queue || []);
          setFailedUnivs(data.failed_universities || []);
          setFailedProfs(data.failed_professors || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch queue data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  const handleRunBatch = async () => {
    setIsBatchRunning(true);
    setActionMessage("배치 수집 가동 중 (기존 12개 노드 순차 실행)...");
    try {
      const res = await fetch("/api/professors/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch",
          batchSize,
          mode: "mock",
        }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setActionMessage(`배치 수집 완료: ${batchSize}개 대학 처리 성공`);
        fetchQueueData();
      } else {
        setActionMessage(`배치 수집 실패: ${data.error || "오류 발생"}`);
      }
    } catch (err: any) {
      setActionMessage(`네트워크 오류: ${err.message}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsBatchRunning(true);
    setActionMessage("실패 항목 재시도 실행 중...");
    try {
      const res = await fetch("/api/professors/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "retry",
          mode: "mock",
        }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setActionMessage("실패 항목 재시도 배치 완료");
        fetchQueueData();
      } else {
        setActionMessage(data.message || "재시도할 항목이 없거나 실패했습니다.");
      }
    } catch (err: any) {
      setActionMessage(`재시도 오류: ${err.message}`);
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleResetQueue = async () => {
    if (!confirm("전국 대학 큐 상태를 초기화하시겠습니까?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/professors/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setActionMessage("큐 상태가 초기화되었습니다.");
        fetchQueueData();
      }
    } catch (err: any) {
      setActionMessage(`초기화 오류: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQueue = queueItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.raw_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 헤더 및 관제 탭 전환 바 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  전국 대학 교수 자동화 관제 시스템
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  Queue Orchestrator
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                전국 대학 단위 교수/학과/과제/산학협력 자동 탐색 및 멱등성 갱신
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 관제 탭 스위처 */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition font-medium"
              >
                🎨 졸전 카드뉴스
              </Link>
              <Link
                href="/admin/professors"
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-bold shadow-sm"
              >
                🎓 교수 관제
              </Link>
              <Link
                href="/admin/content"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition font-medium"
              >
                🎬 콘텐츠 리서치
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* 8대 핵심 KPI 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* 1. 전체 대학 수 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>전체 대학</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-xl font-black text-white">
              {stats.total_universities}
              <span className="text-xs font-normal text-slate-400 ml-1">개</span>
            </div>
          </div>

          {/* 2. 수집 완료 */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 text-xs">
              <span>수집 완료</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-emerald-400">
              {stats.completed}
              <span className="text-xs font-normal text-emerald-300 ml-1">개</span>
            </div>
          </div>

          {/* 3. 수집 중 */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-cyan-400 text-xs">
              <span>수집 중</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-cyan-400">
              {stats.in_progress}
              <span className="text-xs font-normal text-cyan-300 ml-1">개</span>
            </div>
          </div>

          {/* 4. 실패 */}
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 text-xs">
              <span>실패/격리</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-rose-400">
              {stats.failed}
              <span className="text-xs font-normal text-rose-300 ml-1">개</span>
            </div>
          </div>

          {/* 5. 신규 교수 */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-400 text-xs">
              <span>신규 교수</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-indigo-400">
              {stats.new_professors}
              <span className="text-xs font-normal text-indigo-300 ml-1">명</span>
            </div>
          </div>

          {/* 6. 변경된 교수 */}
          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-purple-400 text-xs">
              <span>정보 갱신</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-purple-400">
              {stats.updated_professors}
              <span className="text-xs font-normal text-purple-300 ml-1">명</span>
            </div>
          </div>

          {/* 7. 신규 과제 */}
          <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-sky-400 text-xs">
              <span>학기 과제</span>
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-sky-400">
              {stats.new_tasks}
              <span className="text-xs font-normal text-sky-300 ml-1">건</span>
            </div>
          </div>

          {/* 8. 신규 산학협력 과제 */}
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 text-xs">
              <span>산학협력</span>
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-xl font-black text-amber-400">
              {stats.new_collaborations}
              <span className="text-xs font-normal text-amber-300 ml-1">건</span>
            </div>
          </div>
        </div>

        {/* 진행률 & 컨트롤 액션 패널 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">
                  전국 대학 처리 진행률
                </span>
                <span className="text-cyan-400 font-bold">
                  {stats.progress_percentage}% ({stats.completed} / {stats.total_universities} 대학 완료)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, stats.progress_percentage))}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span>
                  마지막 수집:{" "}
                  {stats.last_collected_at
                    ? new Date(stats.last_collected_at).toLocaleString("ko-KR")
                    : "아직 실행 이력 없음"}
                </span>
                <span>•</span>
                <span>
                  차기 자동 수집 예정:{" "}
                  {stats.next_scheduled_at
                    ? new Date(stats.next_scheduled_at).toLocaleString("ko-KR")
                    : "미지정"}
                </span>
              </div>
            </div>

            {/* 수동 액션 버튼 그룹 */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">배치 크기:</span>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                >
                  <option value={1} className="bg-slate-900 text-white">1개</option>
                  <option value={2} className="bg-slate-900 text-white">2개</option>
                  <option value={3} className="bg-slate-900 text-white">3개</option>
                  <option value={5} className="bg-slate-900 text-white">5개</option>
                </select>
              </div>

              <button
                onClick={handleRunBatch}
                disabled={isBatchRunning}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isBatchRunning ? "실행 중..." : "배치 수집 1회 실행"}</span>
              </button>

              <button
                onClick={handleRetryFailed}
                disabled={isBatchRunning || stats.failed === 0}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs flex items-center gap-1.5 transition border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>실패 재시도 ({stats.failed})</span>
              </button>

              <button
                onClick={handleResetQueue}
                disabled={isBatchRunning}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition border border-slate-700"
                title="전체 큐 초기화"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-cyan-300 flex items-center justify-between">
              <span>{actionMessage}</span>
              <button
                onClick={() => setActionMessage(null)}
                className="text-slate-500 hover:text-white text-xs ml-2"
              >
                닫기
              </button>
            </div>
          )}
        </div>

        {/* 전국 대학 큐 테이블 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                전국 대학교 수집 큐 현황
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                총 {stats.total_universities}개 대학
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 상태 필터 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
              >
                <option value="ALL">전체 상태</option>
                <option value="COMPLETED">완료 (COMPLETED)</option>
                <option value="PENDING">대기중 (PENDING)</option>
                <option value="PROCESSING">수집중 (PROCESSING)</option>
                <option value="FAILED">실패 (FAILED)</option>
              </select>

              {/* 검색창 */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="대학명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 w-44"
                />
              </div>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">식별 ID</th>
                  <th className="py-2.5 px-3">대학교명 (정규화)</th>
                  <th className="py-2.5 px-3">원천명</th>
                  <th className="py-2.5 px-3">탐색 학과 수</th>
                  <th className="py-2.5 px-3">수집 교수 수</th>
                  <th className="py-2.5 px-3">상태</th>
                  <th className="py-2.5 px-3">재시도</th>
                  <th className="py-2.5 px-3">최종 시도 일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      {isLoading ? "큐 데이터 로딩 중..." : "조건에 일치하는 대학교가 없습니다."}
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {item.id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {item.raw_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.departments_count}개 학과
                      </td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">
                        {item.professors_count}명
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                              : item.status === "PROCESSING"
                              ? "bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 animate-pulse"
                              : item.status === "FAILED"
                              ? "bg-rose-950/80 text-rose-300 border border-rose-700/50"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {item.retry_count} / {item.max_retries}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {item.last_attempt_at
                          ? new Date(item.last_attempt_at).toLocaleString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <span>
              페이지 {page} / {totalPages} (총 {stats.total_universities}개 항목)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 실패 및 격리 로그 패널 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 실패 대학 로그 */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white">실패 대학 격리 로그</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800/50">
                {failedUnivs.length}건
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {failedUnivs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  격리되거나 실패한 대학교가 없습니다. (100% 정상 수집)
                </div>
              ) : (
                failedUnivs.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-rose-900/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-rose-300">
                      <span>{f.university_name}</span>
                      <span className="text-[10px] text-slate-500">
                        시도 {f.attempt_count}회
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{f.error}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(f.failed_at).toLocaleString("ko-KR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 실패 교수 로그 */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white">
                  출처 불량/비인가 도메인 격리 교수
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50">
                {failedProfs.length}명
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {failedProfs.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  사설 도메인이나 출처 부실로 차단된 후보가 없습니다.
                </div>
              ) : (
                failedProfs.map((p, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-950 border border-amber-900/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-amber-300">
                      <span>
                        {p.university_name} {p.candidate_name} ({p.department_name})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{p.error}</p>
                    {p.profile_url && (
                      <span className="text-[10px] text-slate-500 font-mono truncate block">
                        URL: {p.profile_url}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
