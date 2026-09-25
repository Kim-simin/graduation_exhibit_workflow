'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, School, Calendar, MapPin, CheckCircle2, Clock, ArrowUpRight, Maximize2, GraduationCap, Share2, Check } from "lucide-react";
import { Exhibition } from "@/lib/get-exhibitions";
import { ArtworkLightboxModal } from "@/components/artwork-lightbox-modal";
import { isArtworkZoomDisabled } from "@/src/utils/categoryMapper";

export default function ExhibitDetailPage({ params }: { params: { id: string } }) {
  const exhibitId = params.id;
  const [exhibit, setExhibit] = useState<Exhibition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number | null>(null);
  const [isPosterLightboxOpen, setIsPosterLightboxOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

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

  const isZoomDisabled = isArtworkZoomDisabled(exhibit);

  const handleShare = async () => {
    if (!exhibit) return;
    const shareUrl =
      exhibit.targetUrl && exhibit.targetUrl.startsWith("http")
        ? exhibit.targetUrl
        : typeof window !== "undefined"
        ? window.location.href
        : "";

    if (!shareUrl) return;

    const shareTitle = `${exhibit.university} ${exhibit.department} 온라인 졸업전시회`;
    const shareText = `[${exhibit.university}] ${exhibit.title} 공식 온라인 전시를 확인해보세요!`;

    if (
      typeof navigator !== "undefined" &&
      navigator.share &&
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch (e) {
      console.error("링크 복사 실패:", e);
    }
  };

  return (
    <main className="min-h-screen px-4 md:px-12 py-10 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> 전체 아카이브 목록으로 돌아가기
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {/* 해당 대학교 온라인 전시 링크공유 버튼 */}
          <button
            type="button"
            onClick={handleShare}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isLinkCopied
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 hover:bg-cyan-950/60 border border-slate-700 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/50"
            }`}
            title="해당 대학교 온라인 전시 링크공유"
          >
            {isLinkCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>복사완료</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>온라인 전시 링크공유</span>
              </>
            )}
          </button>
          <Link
            href={`/professors?univ=${encodeURIComponent(exhibit.university)}&dept=${encodeURIComponent(exhibit.department)}`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition shadow-sm"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>{exhibit.university} {exhibit.department} 교수진 & 커리큘럼 보기</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
        </div>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div
          onClick={() => {
            if (exhibit.posterPath) {
              setIsPosterLightboxOpen(true);
            }
          }}
          className={`relative aspect-[16/8] w-full bg-slate-900 overflow-hidden ${
            exhibit.posterPath ? "cursor-pointer group" : ""
          }`}
          title={exhibit.posterPath ? "클릭하여 메인 공식 포스터 고화질 확인" : undefined}
        >
          {exhibit.posterPath && (
            <img
              src={`/api/images/${exhibit.posterPath}`}
              alt={exhibit.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-black/40 to-transparent" />

          {/* 포스터 고화질 확대 힌트 오버레이 */}
          {exhibit.posterPath && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-cyan-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <Maximize2 className="w-3.5 h-3.5" /> 포스터 고화질 확인
              </span>
            </div>
          )}

          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1 rounded-md bg-cyan-500 text-slate-950 font-extrabold text-xs">
              {exhibit.year}년도 공식 아카이브
            </span>
          </div>

          <div className="absolute bottom-6 left-6 right-6 z-10">
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
            <div className="p-5 rounded-xl bg-slate-900/50 border border-gray-800/80 leading-relaxed text-gray-300 text-sm md:text-base whitespace-pre-line">
              {exhibit.curationIntro}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
              <h2 className="text-lg font-bold text-white">
                🎨 출품작 갤러리 (총 {exhibit.artworks.length}점)
              </h2>
              {!isZoomDisabled && (
                <span className="text-xs text-slate-400">
                  * 카드를 클릭하면 고화질 이미지를 확인할 수 있습니다.
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exhibit.artworks.map((art, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (!isZoomDisabled) {
                      setSelectedArtworkIndex(idx);
                    }
                  }}
                  className={`rounded-xl overflow-hidden bg-slate-900 border border-slate-800 transition duration-200 flex flex-col group ${
                    isZoomDisabled
                      ? "cursor-default"
                      : "cursor-pointer hover:border-cyan-500 hover:shadow-lg"
                  }`}
                >
                  <div className="relative w-full h-48 bg-slate-950 overflow-hidden flex items-center justify-center select-none">
                    <img 
                      src={`/api/images/${art.imagePath}`} 
                      alt={art.title} 
                      className={`w-full h-48 object-cover transition duration-300 pointer-events-none ${
                        isZoomDisabled ? "" : "group-hover:scale-105"
                      }`}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    {/* 카드 호버 시 고화질 확대 힌트 */}
                    {!isZoomDisabled && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-10">
                        <span className="px-3 py-1.5 rounded-full bg-cyan-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                          <Maximize2 className="w-3.5 h-3.5" /> 고화질 확대
                        </span>
                      </div>
                    )}
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

      {/* 개별 출품작 고화질 라이트박스 뷰어 */}
      <ArtworkLightboxModal
        isOpen={selectedArtworkIndex !== null && !isZoomDisabled}
        onClose={() => setSelectedArtworkIndex(null)}
        artworks={exhibit.artworks}
        initialIndex={selectedArtworkIndex ?? 0}
        university={exhibit.university}
        department={exhibit.department}
      />

      {/* 메인 포스터 고화질 라이트박스 뷰어 */}
      {exhibit.posterPath && (
        <ArtworkLightboxModal
          isOpen={isPosterLightboxOpen}
          onClose={() => setIsPosterLightboxOpen(false)}
          artworks={[
            {
              title: `${exhibit.university} ${exhibit.department} 메인 공식 포스터`,
              author: `${exhibit.university} ${exhibit.department}`,
              role: "공식 전시 포스터",
              imagePath: exhibit.posterPath,
              description: exhibit.curationIntro || exhibit.headline || "",
            },
          ]}
          initialIndex={0}
          university={exhibit.university}
          department={exhibit.department}
        />
      )}
    </main>
  );
}
