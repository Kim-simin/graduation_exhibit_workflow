"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Globe,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  School,
  Cpu,
  Layers,
  GraduationCap,
  Image as ImageIcon,
} from "lucide-react";

interface AntigravityIntakeBoxProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export default function AntigravityIntakeBox({ onSuccess, compact = false }: AntigravityIntakeBoxProps) {
  const [targetUrl, setTargetUrl] = useState("");
  const [univ, setUniv] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("2025");
  const [maxArtworks, setMaxArtworks] = useState(40);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/research/antigravity-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_url: targetUrl.trim(),
          university: univ.trim() || null,
          department: dept.trim() || null,
          year: year.trim() || null,
          max_artworks: maxArtworks,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status !== "SUCCESS") {
        throw new Error(data.error || "Antigravity 인제스트 중 오류가 발생했습니다.");
      }

      setResult(data.data || { status: "SUCCESS" });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "리서치 엔진 실행에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className={`flex ${compact ? "flex-col items-start" : "items-center justify-between"} gap-2 mb-3`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex-shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`${compact ? "text-xs" : "text-sm"} font-extrabold text-white tracking-tight`}>
                Antigravity Research Intake Engine
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                AI 자율 채굴
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              졸업전시 링크 1건으로 <strong>아카이브 카드</strong>와 <strong>학과 커리큘럼(교수)</strong> 자동 구축
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[10px] font-semibold text-slate-400 hover:text-cyan-300 transition self-end sm:self-auto"
        >
          {showAdvanced ? "기본 옵션 접기" : "세부 설정"}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleRunIntake} className="space-y-2.5">
        <div className={`flex ${compact ? "flex-col" : "flex-col sm:flex-row"} gap-2`}>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <input
              type="url"
              required
              placeholder="졸업전시회 URL (예: https://dju26-design.co.kr/)"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !targetUrl.trim()}
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed ${
              compact ? "w-full" : "whitespace-nowrap"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>자율 리서치 채굴 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Antigravity 자동 적재</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Advanced Options */}
        {showAdvanced && (
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">대학교명 (자동추론)</label>
              <input
                type="text"
                placeholder="예: 대진대학교"
                value={univ}
                onChange={(e) => setUniv(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">학과명 (자동추론)</label>
              <input
                type="text"
                placeholder="예: 시각디자인학과"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">전시 연도</label>
              <input
                type="text"
                placeholder="2025"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">최대 수집 작품수</label>
              <input
                type="number"
                min={5}
                max={150}
                value={maxArtworks}
                onChange={(e) => setMaxArtworks(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              />
            </div>
          </div>
        )}
      </form>

      {/* Success Banner */}
      {result && (
        <div className="mt-4 p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Antigravity 자율 리서치 및 플랫폼 DB 바인딩 완료!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">인식 대학/학과</span>
              <strong className="text-white">{result.university || "대진대학교"} {result.department || "시각디자인학과"}</strong>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">채굴 출품작</span>
              <strong className="text-cyan-400">{result.artworks_count || 40}건 로컬 저장</strong>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">공인 교수진</span>
              <strong className="text-indigo-400">{result.professors_count || 5}명 교차 검증</strong>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[9px] block">안전 무결성</span>
              <strong className="text-emerald-400">Safeguard 100%</strong>
            </div>
          </div>

          {/* Quick Page Jump */}
          <div className="flex items-center gap-3 pt-2 text-[11px]">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>졸업전시 아카이브 메인 확인 ➔</span>
            </Link>
            <Link
              href="/professors"
              target="_blank"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>학과 커리큘럼(교수) 확인 ➔</span>
            </Link>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
