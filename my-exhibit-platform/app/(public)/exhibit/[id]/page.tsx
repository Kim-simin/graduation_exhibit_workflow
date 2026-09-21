'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, School, Calendar, MapPin, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";
import { Exhibition } from "@/lib/get-exhibitions";

export default function ExhibitDetailPage({ params }: { params: { id: string } }) {
  const exhibitId = params.id;
  const [exhibit, setExhibit] = useState<Exhibition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExhibit() {
      try {
        const res = await fetch("/api/exhibitions");
        if (res.ok) {
          const data = await res.json();
          const found = (data.exhibitions || []).find((e: Exhibition) => e.id === exhibitId);
          if (found) {
            setExhibit(found);
          }
        }
      } catch (e) {
        console.error("전시 정보 로드 실패:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchExhibit();
  }, [exhibitId]);

  if (isLoading) {
    return (
      <main className="min-h-screen px-4 md:px-12 py-10 max-w-5xl mx-auto flex items-center justify-center text-gray-500 font-mono text-sm">
        전시 데이터를 로드하는 중입니다...
      </main>
    );
  }

  if (!exhibit) {
    return (
      <main className="min-h-screen px-4 md:px-12 py-10 max-w-5xl mx-auto space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> 목록으로 돌아가기
        </Link>
        <div className="p-8 rounded-2xl bg-[#111827] border border-gray-800 text-center">
          <h2 className="text-xl font-bold text-white mb-2">전시 정보를 찾을 수 없습니다</h2>
          <p className="text-sm text-gray-400">요청하신 ID ({exhibitId})에 해당하는 전시 정보가 존재하지 않습니다.</p>
        </div>
      </main>
    );
  }

  if (!exhibit.isResearched) {
    return (
      <main className="min-h-screen px-4 md:px-12 py-10 max-w-5xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> 전체 아카이브 목록으로 돌아가기
        </Link>
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/70 border border-gray-700 mx-auto flex items-center justify-center text-cyan-400">
            <Clock className="w-8 h-8 opacity-70 animate-pulse" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            리서치 전 (수집 대기)
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {exhibit.university} {exhibit.department} {exhibit.year}년도 졸업전시회
          </h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            {process.env.NODE_ENV === "production"
              ? "현재 공식 아카이브 에셋 검수 및 공개 준비 중입니다."
              : "아직 공식 아카이브 에셋이 수집되지 않은 상태입니다. 관리자 관제 시스템에서 리서치 트리거를 가동해 주세요."}
          </p>
          {process.env.NODE_ENV !== "production" && (
            <div className="pt-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition"
              >
                관리자 관제 시스템으로 이동 <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 md:px-12 py-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> 전체 아카이브 목록으로 돌아가기
        </Link>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative aspect-[16/8] w-full bg-slate-900 overflow-hidden">
          {exhibit.posterPath && (
            <img
              src={`/api/images/${exhibit.posterPath}`}
              alt={exhibit.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/40 to-transparent" />

          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-md bg-cyan-500 text-slate-950 font-extrabold text-xs">
              {exhibit.year}년도 공식 아카이브
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 text-sm text-cyan-400 font-semibold mb-1">
              <School className="w-4 h-4" /> {exhibit.university} {exhibit.department}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white">
              {exhibit.headline}
            </h1>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" /> 전시 일정
              </span>
              <p className="font-bold text-sm text-white">{exhibit.period}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> 전시 장소
              </span>
              <p className="font-bold text-sm text-white">{exhibit.venue}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-gray-800">
              <span className="text-xs text-gray-400 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> AI 큐레이션 검수
              </span>
              <p className="font-bold text-sm text-emerald-400">{exhibit.criticScore}점 (Verified)</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> 전시 큐레이션 기획 의도
            </h2>
            <div className="p-5 rounded-xl bg-slate-900/50 border border-gray-800/80 leading-relaxed text-gray-300 text-sm md:text-base">
              {exhibit.curationIntro}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white mb-4">
              🎨 출품작 갤러리 (총 {exhibit.artworks.length}점)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exhibit.artworks.map((art, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group">
                  <div className="relative w-full h-48 bg-slate-950 overflow-hidden">
                    <img 
                      src={`/api/images/${art.imagePath}`} 
                      alt={art.title} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <span className="text-xs text-cyan-400 font-mono font-bold">#{idx + 1}</span>
                    <h4 className="text-sm font-bold text-white mt-1">{art.title}</h4>
                    <p className="text-xs text-slate-400">{art.author} · {art.role}</p>
                    {art.description && (
                      <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">{art.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
