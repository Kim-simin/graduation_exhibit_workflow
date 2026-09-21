"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/theme-toggle";
import {
  ArrowLeft,
  Sparkles,
  Search,
  BookOpen,
  Image as ImageIcon,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Download,
  Play,
  Layers,
  FileText,
  Clock,
  User,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";

interface ContentTopic {
  topic_id: string;
  title: string;
  category: string;
  keywords: string[];
  trend_score: number;
  industry_demand_score: number;
  rationale: string;
  rank: number;
}

interface ContentSource {
  source_id: string;
  topic_id: string;
  title: string;
  url: string;
  source_type: "ACADEMIC" | "INDUSTRY_REPORT" | "NEWS" | "OFFICIAL_PRESS" | "PORTFOLIO";
  author: string;
  published_at: string;
  summary: string;
  relevance_score: number;
  credibility_score: number;
  collected_at: string;
}

interface ContentAsset {
  asset_id: string;
  topic_id: string;
  source_url: string;
  download_url: string;
  asset_type: "IMAGE" | "VIDEO" | "VECTOR" | "DOCUMENT";
  creator: string;
  license: string;
  license_url?: string;
  license_status: "VERIFIED" | "REVIEW_NEEDED" | "REJECTED";
  dimensions?: [number, number];
  duration?: number;
  file_size?: number;
  downloaded_at?: string;
  storage_path?: string;
  web_path?: string;
  checksum_sha256?: string;
}

export default function ContentResearchAdminPage() {
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [stats, setStats] = useState({
    total_topics: 0,
    total_sources: 0,
    total_assets: 0,
    verified_assets: 0,
    review_needed_assets: 0,
    downloaded_assets: 0,
    last_updated: null as string | null,
  });

  const [activeTab, setActiveTab] = useState<"ASSETS" | "SOURCES" | "TOPICS">("ASSETS");
  const [licenseFilter, setLicenseFilter] = useState<string>("ALL");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchContentData = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/content-research?license_status=${licenseFilter}`;
      if (selectedTopicId !== "ALL") {
        url += `&topic_id=${selectedTopicId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "SUCCESS") {
          setTopics(data.topics || []);
          setSources(data.sources || []);
          setAssets(data.assets || []);
          setStats(data.statistics || {});
        }
      }
    } catch (e) {
      console.error("Failed to fetch content data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [licenseFilter, selectedTopicId]);

  useEffect(() => {
    fetchContentData();
  }, [fetchContentData]);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setActionMessage("콘텐츠 리서치 10단계 파이프라인 가동 중...");
    try {
      const res = await fetch("/api/content-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock" }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        setActionMessage("콘텐츠 리서치 완료: 신규 주제 및 검증 에셋 수집 완료");
        fetchContentData();
      } else {
        setActionMessage(`리서치 실패: ${data.error || "오류"}`);
      }
    } catch (err: any) {
      setActionMessage(`오류 발생: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 상단 헤더 & 3대 관제 탭 스위처 */}
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
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  콘텐츠 리서치 자동화 관제 시스템
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  Content Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                주제 탐색 ➔ 소스 리서치 ➔ 에셋 수집 ➔ 엄격한 라이선스 검증 ➔ 안전 저장
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 3대 관제 시스템 탭 스위처 */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition font-medium"
              >
                🎨 졸전 카드뉴스
              </Link>
              <Link
                href="/admin/professors"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition font-medium"
              >
                🎓 교수 관제
              </Link>
              <Link
                href="/admin/content"
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-bold shadow-sm"
              >
                🎬 콘텐츠 리서치
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* 6대 핵심 현황 KPI 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-400">발굴 주제</span>
            <div className="mt-2 text-xl font-black text-white">
              {stats.total_topics}
              <span className="text-xs font-normal text-slate-400 ml-1">개</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-400">원천 소스</span>
            <div className="mt-2 text-xl font-black text-cyan-400">
              {stats.total_sources}
              <span className="text-xs font-normal text-cyan-300 ml-1">건</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs text-slate-400">발굴 에셋</span>
            <div className="mt-2 text-xl font-black text-indigo-400">
              {stats.total_assets}
              <span className="text-xs font-normal text-indigo-300 ml-1">건</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex flex-col justify-between">
            <span className="text-xs text-emerald-400 font-semibold">라이선스 승인</span>
            <div className="mt-2 text-xl font-black text-emerald-400">
              {stats.verified_assets}
              <span className="text-xs font-normal text-emerald-300 ml-1">건</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/50 flex flex-col justify-between">
            <span className="text-xs text-amber-400 font-semibold">검토 필요 (격리)</span>
            <div className="mt-2 text-xl font-black text-amber-400">
              {stats.review_needed_assets}
              <span className="text-xs font-normal text-amber-300 ml-1">건</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/50 flex flex-col justify-between">
            <span className="text-xs text-purple-400 font-semibold">다운로드 완료</span>
            <div className="mt-2 text-xl font-black text-purple-400">
              {stats.downloaded_assets}
              <span className="text-xs font-normal text-purple-300 ml-1">건</span>
            </div>
          </div>
        </div>

        {/* 액션 및 필터 바 */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* 서브 뷰 탭 */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("ASSETS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === "ASSETS"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🖼️ 미디어 에셋 ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab("SOURCES")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === "SOURCES"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📄 원천 소스 ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab("TOPICS")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === "TOPICS"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💡 추천 주제 ({topics.length})
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* 라이선스 필터 */}
            {activeTab === "ASSETS" && (
              <select
                value={licenseFilter}
                onChange={(e) => setLicenseFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 outline-none"
              >
                <option value="ALL">모든 라이선스</option>
                <option value="VERIFIED">✅ 검증 완료 (VERIFIED)</option>
                <option value="REVIEW_NEEDED">⚠️ 검토 필요 (REVIEW_NEEDED)</option>
              </select>
            )}

            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? "리서치 진행 중..." : "콘텐츠 리서치 파이프라인 가동"}</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 text-xs text-purple-300 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-500 hover:text-white text-xs"
            >
              닫기
            </button>
          </div>
        )}

        {/* 1. 에셋 갤러리 뷰 */}
        {activeTab === "ASSETS" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                  {isLoading ? "에셋 로딩 중..." : "수집된 에셋이 없습니다. 상단에서 리서치를 가동하세요."}
                </div>
              ) : (
                assets.map((asset) => {
                  const isVerified = asset.license_status === "VERIFIED";
                  const isReviewNeeded = asset.license_status === "REVIEW_NEEDED";

                  return (
                    <div
                      key={asset.asset_id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition"
                    >
                      <div className="space-y-2">
                        {/* 이미지 썸네일 */}
                        <div className="relative w-full h-44 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                          {asset.web_path ? (
                            <img
                              src={asset.web_path}
                              alt={asset.creator}
                              className="w-full h-full object-cover"
                            />
                          ) : asset.download_url ? (
                            <img
                              src={asset.download_url}
                              alt={asset.creator}
                              className="w-full h-full object-cover opacity-80"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-600" />
                          )}

                          {/* 라이선스 뱃지 */}
                          <div className="absolute top-2.5 right-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                                isVerified
                                  ? "bg-emerald-900/90 text-emerald-200 border border-emerald-600/60"
                                  : isReviewNeeded
                                  ? "bg-amber-900/90 text-amber-200 border border-amber-600/60"
                                  : "bg-rose-900/90 text-rose-200 border border-rose-600/60"
                              }`}
                            >
                              {isVerified
                                ? "✅ 검증 완료"
                                : isReviewNeeded
                                ? "⚠️ 검토 필요 (격리)"
                                : "❌ 저작권 제한"}
                            </span>
                          </div>
                        </div>

                        {/* 메타데이터 정보 */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white truncate">
                              {asset.creator}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {asset.dimensions ? `${asset.dimensions[0]}x${asset.dimensions[1]}` : "-"}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            라이선스: <span className="text-slate-300 font-medium">{asset.license}</span>
                          </div>

                          {asset.storage_path ? (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono truncate">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">저장됨: {asset.storage_path}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>라이선스 미검증으로 자동 다운로드 차단됨</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 하단 링크 및 액션 */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <a
                          href={asset.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                        >
                          <span>원문 출처</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {asset.file_size ? `${Math.round(asset.file_size / 1024)} KB` : "-"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. 소스 목록 뷰 */}
        {activeTab === "SOURCES" && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              권위 있는 원천 소스 목록 ({sources.length}건)
            </h2>

            <div className="divide-y divide-slate-800">
              {sources.map((src) => (
                <div key={src.source_id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300">
                        {src.source_type}
                      </span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-white hover:text-cyan-400 flex items-center gap-1"
                      >
                        <span>{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <span className="text-emerald-400 font-bold">
                        신뢰도: {(src.credibility_score * 100).toFixed(0)}%
                      </span>
                      <span className="text-indigo-400 font-bold">
                        연관도: {(src.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {src.summary}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>저자/기관: {src.author}</span>
                    <span>•</span>
                    <span>발행일: {src.published_at}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">ID: {src.source_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 추천 주제 뷰 */}
        {activeTab === "TOPICS" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topics.map((t) => (
              <div
                key={t.topic_id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/50 text-[10px] font-bold">
                      {t.category}
                    </span>
                    <span className="text-xs font-bold text-purple-400">
                      우선순위 #{t.rank}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {t.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t.rationale}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {t.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-slate-950 text-[10px] text-slate-300 border border-slate-800"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    트렌드 점수: <b className="text-cyan-400">{(t.trend_score * 100).toFixed(0)}%</b>
                  </span>
                  <span className="text-slate-400">
                    산업 수요: <b className="text-indigo-400">{(t.industry_demand_score * 100).toFixed(0)}%</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
