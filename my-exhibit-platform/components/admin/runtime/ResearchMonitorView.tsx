"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Search,
  Database,
  FileCheck2,
  AlertTriangle,
  Layers,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Play,
  CheckCircle2,
  XCircle,
  Eye,
  Camera,
  Code2,
  FileText,
  Clock,
  Sparkles,
  School,
  GraduationCap,
  Building2,
  Briefcase,
} from "lucide-react";

interface ResearchRun {
  research_run_id: string;
  target_university: string;
  target_department: string;
  target_year: string;
  target_url: string;
  status: string;
  sources_count: number;
  evidence_count: number;
  facts_count: number;
  conflicts_count: number;
  artworks_count: number;
  started_at: string;
  completed_at: string;
  crawl_result?: {
    status: string;
    final_url: string;
    content_hash: string;
    status_code: number;
  };
}

interface CorporateRun {
  run_id: string;
  target_university: string;
  target_department: string;
  graduation_exhibit_url?: string;
  status: string;
  cooperation_signals_count: number;
  expanded_companies_count: number;
  department_mappings_count: number;
  recruitment_postings_count: number;
  talent_profiles_count: number;
  cross_validation_results_count: number;
  evidences_count: number;
  sources_count: number;
  started_at: string;
  completed_at: string;
}

interface RawSnapshot {
  content_hash: string;
  url: string;
  final_url: string;
  canonical_url: string;
  status_code: number;
  content_type: string;
  title: string;
  accessed_at: string;
  crawler_version: string;
  html_path: string;
  text_path: string;
  screenshot_path?: string | null;
}

export default function ResearchMonitorView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [researchMode, setResearchMode] = useState<"academic" | "corporate">("corporate");
  const [selectedSnapshot, setSelectedSnapshot] = useState<RawSnapshot | null>(null);
  const [triggerUniv, setTriggerUniv] = useState("홍익대학교");
  const [triggerDept, setTriggerDept] = useState("시각디자인과");
  const [triggerUrl, setTriggerUrl] = useState("https://sidi.hongik.ac.kr");
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/research");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.raw_snapshots && json.raw_snapshots.length > 0 && !selectedSnapshot) {
          setSelectedSnapshot(json.raw_snapshots[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedSnapshot]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTriggerRun = async () => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/admin/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university: triggerUniv,
          department: triggerDept,
          target_url: triggerUrl,
          pipeline_type: researchMode,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggering(false);
    }
  };

  const stats = data?.statistics || {};
  const runs: ResearchRun[] = data?.recent_runs || [];
  const corpRuns: CorporateRun[] = data?.corporate_runs || [];
  const latestCorpIntel = data?.latest_corporate_intelligence || null;
  const snapshots: RawSnapshot[] = data?.raw_snapshots || [];

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Run Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Globe className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Local Research & Crawl Intelligence Control Center
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30">
                STEP 13
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Playwright 기반 실시간 웹 증거 수집 · 원본 보존(Raw HTML/Text/Screenshot) · 로컬 Qwen2.5-VL 추출 · 사실 근거 1:1 검증
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResearchMode("corporate")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
              researchMode === "corporate"
                ? "bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>🏢 산학협력-채용 교차검증 리서치 (STEP 1~7)</span>
          </button>
          <button
            type="button"
            onClick={() => setResearchMode("academic")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
              researchMode === "academic"
                ? "bg-cyan-600 text-white border-cyan-500 shadow-sm shadow-cyan-500/20"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>🎓 졸업전시 아카이브 리서치 (STEP 13)</span>
          </button>
        </div>

        {/* 7-Stage Pipeline Visualizer (when corporate mode) */}
        {researchMode === "corporate" && (
          <div className="mt-4 p-3 bg-slate-950/80 border border-blue-900/40 rounded-xl overflow-x-auto">
            <div className="flex items-center gap-2 text-[11px] font-bold min-w-[680px]">
              <span className="px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">1. 산학협력 탐색</span>
              <span className="text-slate-600">➔</span>
              <span className="px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">2. 연계기업 확장</span>
              <span className="text-slate-600">➔</span>
              <span className="px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800">3. 학과 매핑</span>
              <span className="text-slate-600">➔</span>
              <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">4. 실제 채용공고</span>
              <span className="text-slate-600">➔</span>
              <span className="px-2 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">5. 인재상/문화</span>
              <span className="text-slate-600">➔</span>
              <span className="px-2 py-1 rounded bg-purple-950 text-purple-300 border border-purple-800">6. 교차검증</span>
              <span className="text-slate-600">➔</span>
              <span className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">7. 최종 리포트</span>
            </div>
          </div>
        )}

        {/* Manual Trigger Input Row */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          <input
            type="text"
            placeholder="대학교명 (예: 홍익대학교)"
            value={triggerUniv}
            onChange={(e) => setTriggerUniv(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="학과명 (예: 시각디자인과)"
            value={triggerDept}
            onChange={(e) => setTriggerDept(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder={researchMode === "corporate" ? "산학협력단/전시 URL (선택)" : "공식 아카이브 URL"}
            value={triggerUrl}
            onChange={(e) => setTriggerUrl(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleTriggerRun}
            disabled={isTriggering}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 ${
              researchMode === "corporate"
                ? "bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20"
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isTriggering ? "animate-spin" : ""}`} />
            {isTriggering
              ? "리서치 파이프라인 가동 중..."
              : researchMode === "corporate"
              ? "산학협력-채용 리서치 가동 (7단계)"
              : "Playwright 크롤 실행"}
          </button>
        </div>
      </div>

      {/* 2. Top Stats Overview */}
      {researchMode === "corporate" ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">산학협력 리서치 실행</span>
            <p className="text-2xl font-bold text-white mt-1">{corpRuns.length}건</p>
            <span className="text-[11px] text-blue-400 font-medium">교차검증 파이프라인</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">발견된 산학협력 신호</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">{latestCorpIntel?.cooperation_signals?.length || 0}건</p>
            <span className="text-[11px] text-slate-500">대학 산단/LINC 공시</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">실제 검증 채용공고</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{latestCorpIntel?.recruitment_postings?.length || 0}건</p>
            <span className="text-[11px] text-emerald-300">공식 채용사이트 Fact</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">교차검증 완료 쌍</span>
            <p className="text-2xl font-bold text-purple-400 mt-1">{latestCorpIntel?.cross_validation_results?.length || 0}개</p>
            <span className="text-[11px] text-purple-300">신호 상호 대조</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">공식 연계 기업</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{latestCorpIntel?.expanded_companies?.length || 0}개사</p>
            <span className="text-[11px] text-indigo-300">자회사/계열사 공시</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">총 리서치 실행 수</span>
            <p className="text-2xl font-bold text-white mt-1">{stats.total_runs || 0}건</p>
            <span className="text-[11px] text-emerald-400 font-medium">완료: {stats.completed_runs || 0}건</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">영구 보존 원본 스냅샷</span>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.total_snapshots_preserved || 0}개</p>
            <span className="text-[11px] text-slate-500">HTML / Text / Screenshot</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">수집된 근거 (Evidence)</span>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{stats.total_evidence_collected || 0}건</p>
            <span className="text-[11px] text-indigo-300">DOM 로케이터 매핑</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">엔티티 도출 (Artworks)</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.total_artworks_resolved || 0}개</p>
            <span className="text-[11px] text-emerald-300">정규화 연결 완료</span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">출처 충돌 (Conflicts)</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">{stats.total_conflicts_detected || 0}건</p>
            <span className="text-[11px] text-amber-300">상충 데이터 격리</span>
          </div>
        </div>
      )}

      {/* 3. Main Split View: Runs Table vs Snapshot / Report Inspector */}
      {researchMode === "corporate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent Corporate Research Runs (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                산학협력-채용 교차검증 실행 이력 ({corpRuns.length}건)
              </h3>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
              {corpRuns.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  실행된 산학협력 리서치 이력이 없습니다. 상단에서 가동해보세요.
                </div>
              ) : (
                corpRuns.map((r) => (
                  <div
                    key={r.run_id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/40 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            r.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {r.target_university} · {r.target_department}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {r.started_at?.slice(11, 19)}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>협력신호: <strong className="text-blue-400">{r.cooperation_signals_count}</strong>건</span>
                        <span>채용공고: <strong className="text-emerald-400">{r.recruitment_postings_count}</strong>건</span>
                        <span>교차검증: <strong className="text-purple-400">{r.cross_validation_results_count}</strong>개</span>
                        <span>증거: <strong className="text-indigo-400">{r.evidences_count}</strong>건</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: {r.run_id.slice(0, 18)}...
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Latest 7-Section Report Inspector (6 Cols) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                7단계 최종 리포트 인스펙터 (Factual Evidence)
              </h3>
              <span className="text-[11px] text-slate-400">
                {latestCorpIntel ? `${latestCorpIntel.target_university} ${latestCorpIntel.target_department}` : "리포트 대기"}
              </span>
            </div>

            {latestCorpIntel?.markdown_report ? (
              <div className="space-y-3 flex-1 flex flex-col min-h-0">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    교차검증 결과: <strong className="text-emerald-400 font-bold">{latestCorpIntel.cross_validation_results?.length || 0}개 매칭 쌍</strong>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(latestCorpIntel.markdown_report);
                      alert("마크다운 리포트가 클립보드에 복사되었습니다.");
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-cyan-300 border border-slate-700 transition"
                  >
                    리포트 복사
                  </button>
                </div>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[480px] text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {latestCorpIntel.markdown_report}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs flex-1 flex items-center justify-center">
                생성된 산학협력 리포트가 없습니다. 상단에서 리서치를 가동하세요.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Recent Research Runs (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                최근 리서치 파이프라인 실행 이력 ({runs.length}건)
              </h3>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
              {runs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  실행된 리서치 이력이 없습니다. 상단에서 크롤을 실행해보세요.
                </div>
              ) : (
                runs.map((r) => (
                  <div
                    key={r.research_run_id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            r.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {r.target_university} · {r.target_department} ({r.target_year})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {r.started_at?.slice(11, 19)}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                      <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{r.target_url}</span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-3 text-slate-400">
                        <span>근거: <strong className="text-cyan-400">{r.evidence_count}</strong>건</span>
                        <span>작품: <strong className="text-emerald-400">{r.artworks_count}</strong>개</span>
                        <span>충돌: <strong className="text-amber-400">{r.conflicts_count}</strong>건</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: {r.research_run_id.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Preserved Snapshot Inspector (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                증거 스냅샷 인스펙터 (Raw Evidence)
              </h3>
              <span className="text-[11px] text-slate-400">
                보존: {snapshots.length}개
              </span>
            </div>

            {selectedSnapshot ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      HTTP {selectedSnapshot.status_code} OK
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      SHA-256: {selectedSnapshot.content_hash?.slice(0, 12)}...
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white truncate">
                    {selectedSnapshot.title || "제목 미상"}
                  </h4>

                  <p className="text-[11px] text-slate-400 break-all">
                    <strong>URL:</strong> {selectedSnapshot.url}
                  </p>

                  {selectedSnapshot.final_url !== selectedSnapshot.url && (
                    <p className="text-[11px] text-cyan-400 break-all">
                      <strong>Final Redirect:</strong> {selectedSnapshot.final_url}
                    </p>
                  )}
                </div>

                {/* Snapshot Files Indicator */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <Code2 className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <span>HTML 원본</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <FileText className="w-4 h-4 mx-auto mb-1 text-indigo-400" />
                    <span>텍스트 본문</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                    <Camera className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span>스크린샷</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-300">보존 경로:</span>
                  <p className="font-mono text-[10px] text-slate-500 mt-1 truncate">
                    {selectedSnapshot.html_path}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500 truncate">
                    {selectedSnapshot.text_path}
                  </p>
                </div>

                {/* Snapshots Selector List */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-400 mb-2 block">
                    스냅샷 목록 선택
                  </span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {snapshots.map((s) => (
                      <button
                        key={s.content_hash}
                        onClick={() => setSelectedSnapshot(s)}
                        className={`w-full text-left p-2 rounded-lg text-xs truncate transition flex items-center justify-between ${
                          selectedSnapshot.content_hash === s.content_hash
                            ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40"
                            : "bg-slate-950/60 text-slate-400 hover:bg-slate-800 border border-slate-800/60"
                        }`}
                      >
                        <span className="truncate">{s.title || s.url}</span>
                        <span className="text-[10px] font-mono text-slate-500 ml-2">
                          {s.content_hash?.slice(0, 8)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                보존된 스냅샷이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
