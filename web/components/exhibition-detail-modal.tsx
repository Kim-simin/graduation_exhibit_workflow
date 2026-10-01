'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Share2,
  Check,
  GraduationCap,
  School,
  Building2,
} from "lucide-react";
import { Exhibition, Artwork } from "@/lib/get-exhibitions";
import { getStandardCategory, isArtworkZoomDisabled } from "@/src/utils/categoryMapper";
import { ArtworkLightboxModal } from "./artwork-lightbox-modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition;
}

export function ExhibitionDetailModal({ isOpen, onClose, exhibition }: Props) {
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number | null>(null);
  const [isPosterLightboxOpen, setIsPosterLightboxOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedArtworkIndex !== null) {
          setSelectedArtworkIndex(null);
        } else if (isPosterLightboxOpen) {
          setIsPosterLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, selectedArtworkIndex, isPosterLightboxOpen, onClose]);

  if (!isOpen) return null;

  const isZoomDisabled = isArtworkZoomDisabled(exhibition);
  const artworks = exhibition.artworks || [];

  const handleShare = async () => {
    const shareUrl =
      exhibition.targetUrl && exhibition.targetUrl.startsWith("http")
        ? exhibition.targetUrl
        : typeof window !== "undefined"
        ? `${window.location.origin}/exhibit/${encodeURIComponent(exhibition.id)}`
        : "";

    if (!shareUrl) return;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("클립보드 복사 실패:", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-[#111625] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* 상단 헤더 바 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20 shrink-0">
              {exhibition.year}년 공식 아카이브
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold truncate">
              <School className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span className="truncate">{exhibition.university} {exhibition.department}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                isCopied
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-cyan-500"
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>복사완료</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>링크 공유</span>
                </>
              )}
            </button>

            <Link
              href={`/professors?univ=${encodeURIComponent(exhibition.university)}&dept=${encodeURIComponent(exhibition.department)}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>교수진 & 커리큘럼</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 바디 스크롤 영역 */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8 flex-1">
          {/* 1. 메인 포스터 & 타이틀 배너 */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
            <div
              onClick={() => {
                if (exhibition.posterPath) setIsPosterLightboxOpen(true);
              }}
              className={`relative aspect-[16/7] w-full bg-slate-950 overflow-hidden ${
                exhibition.posterPath ? "cursor-pointer group" : ""
              }`}
            >
              {exhibition.posterPath ? (
                <img
                  src={`/api/images/${exhibition.posterPath}`}
                  alt={exhibition.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <School className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-sm font-bold text-slate-300">{exhibition.university} {exhibition.department}</span>
                  <span className="text-xs text-slate-400 mt-1">공식 포스터 준비 중</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              {exhibition.posterPath && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 rounded-full bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                    <Maximize2 className="w-4 h-4" /> 포스터 고화질 확인
                  </span>
                </div>
              )}

              <div className="absolute bottom-5 left-5 right-5 text-white pointer-events-none">
                <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 mb-1">
                  <School className="w-4 h-4" /> {exhibition.university} {exhibition.department}
                </div>
                <h2 className="text-xl md:text-3xl font-extrabold tracking-tight drop-shadow">
                  {exhibition.headline || exhibition.title}
                </h2>
              </div>
            </div>
          </div>

          {/* 2. 메타 정보 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" /> 전시 일정
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {exhibition.period || "일정 공지 대기"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" /> 전시 장소
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {exhibition.venue || "교내 전시홀"}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI 큐레이션 검수
              </span>
              <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {exhibition.criticScore > 0 ? `${exhibition.criticScore}점 (Verified)` : "검수 준비 중"}
              </p>
            </div>
          </div>

          {/* 3. 큐레이션 기획 의도 */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" /> 전시 큐레이션 기획 의도
            </h3>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 leading-relaxed text-slate-700 dark:text-slate-300 text-sm whitespace-pre-line">
              {exhibition.curationIntro || "아직 공식 전시 큐레이션 상세 정보가 등록되지 않았습니다."}
            </div>
          </div>

          {/* 4. 산학협력 기업 및 검증 역량 */}
          {exhibition.hasCorporateCooperation && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                <Building2 className="w-4 h-4" />
                <span>산학협력 연계 기업 ({exhibition.cooperationCompanies?.length || 0}개사)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {exhibition.cooperationCompanies?.map((comp, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-semibold shadow-xs"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. 출품작 갤러리 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                🎨 출품작 갤러리 (총 {artworks.length}점)
              </h3>
              {!isZoomDisabled && artworks.length > 0 && (
                <span className="text-xs text-slate-400">
                  * 카드를 클릭하면 고화질로 확대할 수 있습니다.
                </span>
              )}
            </div>

            {artworks.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                등록된 개별 출품작이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {artworks.map((art, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!isZoomDisabled) {
                        setSelectedArtworkIndex(idx);
                      }
                    }}
                    className={`rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col group transition ${
                      isZoomDisabled
                        ? "cursor-default"
                        : "cursor-pointer hover:border-cyan-500 hover:shadow-lg"
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full bg-slate-200 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
                      <img
                        src={`/api/images/${art.imagePath}`}
                        alt={art.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          isZoomDisabled ? "" : "group-hover:scale-105"
                        }`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {!isZoomDisabled && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                          <span className="px-3 py-1.5 rounded-full bg-cyan-600/90 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                            <Maximize2 className="w-3.5 h-3.5" /> 고화질 확대
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                            #{idx + 1}
                          </span>
                          {art.department && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {art.department}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                          {art.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {art.author} · {art.role}
                        </p>
                      </div>

                      {art.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {art.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 개별 출품작 고화질 라이트박스 */}
      <ArtworkLightboxModal
        isOpen={selectedArtworkIndex !== null && !isZoomDisabled}
        onClose={() => setSelectedArtworkIndex(null)}
        artworks={artworks}
        initialIndex={selectedArtworkIndex ?? 0}
        university={exhibition.university}
        department={exhibition.department}
      />

      {/* 메인 포스터 고화질 라이트박스 */}
      {exhibition.posterPath && (
        <ArtworkLightboxModal
          isOpen={isPosterLightboxOpen}
          onClose={() => setIsPosterLightboxOpen(false)}
          artworks={[
            {
              title: `${exhibition.university} ${exhibition.department} 공식 전시 메인 포스터`,
              author: `${exhibition.university} ${exhibition.department}`,
              role: "공식 메인 포스터",
              imagePath: exhibition.posterPath,
              description: exhibition.curationIntro || exhibition.headline || "",
            },
          ]}
          initialIndex={0}
          university={exhibition.university}
          department={exhibition.department}
        />
      )}
    </div>
  );
}
