'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  ClipboardPaste,
  Layers,
  ArrowUpRight,
  X,
  Calendar,
  Clock,
  ExternalLink,
  Check,
  Share2,
  Globe,
} from "lucide-react";
import { Exhibition, Artwork } from "@/lib/get-exhibitions";
import { ExhibitionDetailModal } from "./exhibition-detail-modal";
import ThemeToggle from "./theme-toggle";
import { STANDARD_CATEGORIES, getStandardCategory } from "@/src/utils/categoryMapper";

// 10대 통합 표준 카테고리 메타데이터
const INDUSTRIES = STANDARD_CATEGORIES;

interface Props {
  initialExhibitions: Exhibition[];
}

export default function ExhibitionGallery({ initialExhibitions }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("전체 분야");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(initialExhibitions);

  // 온라인 전시 링크공유 상단 오버레이 패널 상태
  const [shareOverlayItem, setShareOverlayItem] = useState<Exhibition | null>(null);
  const [isCopiedInOverlay, setIsCopiedInOverlay] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 공유 URL 헬퍼
  const getShareUrl = (item: Exhibition) => {
    return item.targetUrl && item.targetUrl.startsWith("http")
      ? item.targetUrl
      : typeof window !== "undefined"
      ? `${window.location.origin}/exhibit/${encodeURIComponent(item.id)}`
      : "";
  };

  // 상단 링크공유 오버레이 패널 열기
  const handleOpenShareOverlay = (item: Exhibition, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareOverlayItem(item);
    setIsCopiedInOverlay(false);
  };

  // 오버레이 패널 내 링크 복사
  const handleCopyOverlayUrl = async (url: string) => {
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setIsCopiedInOverlay(true);
      setTimeout(() => setIsCopiedInOverlay(false), 2500);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  // 기기 네이티브 Web Share API 지원 시 호출
  const handleNativeShare = async (item: Exhibition) => {
    const shareUrl = getShareUrl(item);
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${item.university} ${item.department} 온라인 졸업전시회`,
          text: `[${item.university}] ${item.title} 공식 온라인 전시를 확인해보세요!`,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    }
  };

  // ESC 키로 공유 오버레이 패널 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShareOverlayItem(null);
      }
    };
    if (shareOverlayItem) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [shareOverlayItem]);

  // 백그라운드에서 최신 큐 데이터 동기화
  const refreshExhibitions = async () => {
    try {
      const res = await fetch("/api/exhibitions");
      if (res.ok) {
        const data = await res.json();
        if (data.exhibitions && Array.isArray(data.exhibitions) && data.exhibitions.length > 0) {
          setExhibitions(data.exhibitions);
          setSelectedExhibition((prev) => {
            if (!prev) return null;
            return data.exhibitions.find((e: Exhibition) => e.id === prev.id) || prev;
          });
        }
      }
    } catch (err) {
      console.error("전시 데이터 동기화 실패:", err);
    }
  };

  useEffect(() => {
    refreshExhibitions();
  }, []);

  // 공개 전시 필터링 (미완성/대기/placeholder 완전 배제 및 published 전용 필터)
  const filteredExhibitions = exhibitions.filter((item) => {
    const isDraftOrPending =
      item.status === "draft" ||
      item.status === "pending" ||
      item.status === "대기" ||
      item.status === "수집 대기" ||
      item.status === "리서치 대기" ||
      item.status === "리서치 대기 (Pending)";

    const isPublished =
      !isDraftOrPending &&
      (item.status === "published" ||
        item.status === "리서치 완료" ||
        item.status === "완료" ||
        item.status === "승인 완료") &&
      item.isResearched === true &&
      Boolean(item.posterPath && item.posterPath.length > 5) &&
      Array.isArray(item.artworks) &&
      item.artworks.length > 0;

    // 공개 웹에서는 승인/발행된 완료 전시만 노출
    if (!isPublished) {
      return false;
    }

    // 연도 조건 매칭 (선택된 경우만)
    const matchesYear =
      selectedYear === "all" ||
      String(item.year || "").includes(selectedYear) ||
      String(item.schedule || "").includes(selectedYear) ||
      String(item.title || "").includes(selectedYear);

    // 카테고리 조건 매칭 (10대 표준 카테고리 및 학과 자동 매핑 일치)
    const matchesCategory =
      selectedCategory === "전체" ||
      selectedCategory === "전체 분야" ||
      item.category === selectedCategory ||
      getStandardCategory(item.category || item.department || "") === selectedCategory ||
      item.department?.includes(selectedCategory);

    // 통합 검색어 매칭 (대학명, 학과, 작품명, 슬로건, 태그, 학생명 등)
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.university?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      item.headline?.toLowerCase().includes(q) ||
      item.slogan?.toLowerCase().includes(q) ||
      item.tags?.some((t) => t.toLowerCase().includes(q)) ||
      item.artworks?.some(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.author?.toLowerCase().includes(q) ||
          a.role?.toLowerCase().includes(q)
      );

    return matchesYear && matchesCategory && matchesSearch;
  });

  const filteredExhibits = filteredExhibitions;

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 w-full max-w-7xl mx-auto relative text-slate-800 dark:text-slate-100 min-w-0">
      {/* Top Hero Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-700/50 text-cyan-800 dark:text-cyan-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 전국 대학교 졸업전시 통합 공식 아카이브
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            대학생의 프로젝트를 <span className="text-cyan-600 dark:text-cyan-400">기업과 현직자에게 연결합니다</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-2 max-w-3xl leading-relaxed">
            전국 대학의 졸업작품과 학생 프로젝트를 발견하고, 기업·기관의 Challenge와 연결해 현직자 검토와 실증까지 이어갑니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition"
          >
            <span>대학생 보기</span>
          </Link>
          <Link
            href="/mentoring"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>프로젝트 공고 보기</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* 연도별 / 카테고리별 필터 네비게이션 */}
      <section className="flex flex-col gap-4 py-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 1. 연도 세그먼트 탭 */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-xs">
            {["all", "2026", "2025", "2024"].map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 rounded-xl transition ${
                  selectedYear === year
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {year === "all" ? "전체 연도" : `${year}년`}
              </button>
            ))}
          </div>

          <span className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">
            선택된 결과: {filteredExhibits.length}건
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full">
          {INDUSTRIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold transition border shadow-xs ${
                  isSelected
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-600/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400"
                    : "bg-white dark:bg-[#111422] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}

          {/* 직무/학과/작품 통합 검색 바 */}
          <div className="relative flex-grow min-w-[200px] max-w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="대학명, 학과, 작품 검색..."
              className="w-full text-xs font-medium bg-slate-50 dark:bg-[#0f121e] border border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-7 py-1.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="검색어 지우기"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 전시 카드 그리드 (기존 5088615 3열 레이아웃 완벽 복원) */}
      {filteredExhibits.length > 0 ? (
        <section className="grid grid-cols-3 gap-2 sm:gap-4 w-full min-w-0 pt-2">
          {filteredExhibits.map((item) => {
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.isResearched) {
                    setSelectedExhibition(item);
                  }
                }}
                className={`group relative min-w-0 bg-white dark:bg-[#111827] border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out flex flex-col ${
                  item.isResearched
                    ? "border-slate-200 dark:border-gray-800/80 hover:border-cyan-500/80 dark:hover:border-cyan-400/80 hover:shadow-2xl hover:shadow-cyan-500/15 dark:hover:shadow-cyan-950/40 hover:-translate-y-2 hover:scale-[1.015] active:scale-[0.985] active:translate-y-0 cursor-pointer select-none"
                    : "border-slate-200 dark:border-gray-800/60 bg-slate-50/70 dark:bg-slate-950/70 opacity-95 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 hover:shadow-md cursor-default"
                }`}
              >
                {/* Poster Aspect Ratio Frame (관제시스템 웹UI와 동일한 aspect-[4/5] 비율) */}
                <div className="relative aspect-[4/5] w-full min-w-0 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  {item.isResearched && item.posterPath ? (
                    <>
                      <img
                        src={`/api/images/${item.posterPath}`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {/* 모션그래픽 비디오 (마우스 호버 시 실제 공식 포스터 모션그래픽 재생) */}
                      {item.posterVideoPath && (
                        <video
                          src={item.posterVideoPath.startsWith("http") || item.posterVideoPath.startsWith("/api/images/") ? item.posterVideoPath : `/api/images/${item.posterVideoPath}`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      )}
                    </>
                  ) : null}

                  {/* Overlays / Badges for Researched Cards: 카테고리와 연도 */}
                  {item.isResearched && (
                    <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-wrap gap-1 sm:gap-1.5 pointer-events-none">
                      <span className="truncate px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-cyan-800 dark:text-cyan-300 text-[9px] sm:text-xs font-semibold shadow-sm">
                        {item.category}
                      </span>
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white text-[9px] sm:text-xs font-mono">
                        {item.year}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Mid Info: 대학·전공 / 전시 타이틀 */}
                {item.isResearched && (
                  <div className="px-2 sm:px-3 pt-2 sm:pt-3 pb-1 bg-white dark:bg-[#111827] min-w-0">
                    <span className="text-[9px] sm:text-xs font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5 truncate">
                      {item.university} · {item.department}
                    </span>
                    <h3 className="text-[11px] sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                )}

                {/* Card Bottom Action Bar: 선별 작품 수 / 전시 관람하기 버튼 */}
                <div className="px-2 sm:px-3 pb-2 sm:pb-3 pt-1 sm:pt-2 bg-white dark:bg-[#111827] flex min-w-0 items-center justify-between gap-1 text-[8px] sm:text-xs select-none">
                  {item.isResearched ? (
                    <>
                      <span className="text-slate-600 dark:text-gray-300 font-semibold flex items-center gap-1 sm:gap-1.5 truncate">
                        <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">선별 작품 <strong className="text-slate-900 dark:text-white font-bold">{item.artworks?.length || 0}점</strong></span>
                      </span>
                      <div className="flex min-w-0 items-center gap-1 sm:gap-1.5 shrink-0">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExhibition(item);
                          }}
                          className="min-w-0 text-[9px] sm:text-xs text-cyan-700 dark:text-cyan-400 font-bold inline-flex items-center gap-0.5 group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <span className="sm:hidden">관람</span>
                          <span className="hidden sm:inline">전시 관람하기</span>
                          <ArrowUpRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-out" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-slate-500 dark:text-gray-500">
                      <span>공식 아카이브 준비 중</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <div className="my-12 py-16 px-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            {selectedYear === "2026"
              ? "현재 공식 업로드 및 발행 완료된 2026년 졸업전시가 없습니다."
              : "해당 조건에 부합하는 전시가 없습니다."}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            {selectedYear === "2026"
              ? "2026년 졸업전시 데이터는 현재 수집 및 검수 대기 중이며, 공식 아카이브 확정 및 발행 승인 후 순차적으로 공개됩니다."
              : "선택하신 연도, 상태 또는 전공 분야에 등록된 전시가 없습니다. 다른 필터를 선택해보세요."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedCategory("전체 분야");
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
            >
              전체 필터 초기화
            </button>
          </div>
        </div>
      )}

      {/* 전시 상세 뷰어 모달 */}
      <ExhibitionDetailModal
        isOpen={Boolean(selectedExhibition)}
        onClose={() => {
          setSelectedExhibition(null);
        }}
        exhibition={selectedExhibition}
      />

      {/* 화면 상단 '링크공유' 오버레이 패널 */}
      {shareOverlayItem && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShareOverlayItem(null)}
          />
          <div
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-lg bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-cyan-500/40 dark:border-cyan-500/50 rounded-2xl shadow-2xl shadow-cyan-950/30 p-5 md:p-6 animate-in fade-in slide-in-from-top-6 duration-300 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Share2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                  온라인 전시 링크 공유
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {shareOverlayItem.university}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShareOverlayItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4">
              <h4 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white mb-1 line-clamp-2">
                {shareOverlayItem.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {shareOverlayItem.university} · {shareOverlayItem.department} ({shareOverlayItem.year || "2025"})
              </p>

              {/* URL 복사 인풋 바 */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl(shareOverlayItem)}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={() => handleCopyOverlayUrl(getShareUrl(shareOverlayItem))}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm shrink-0 ${
                    isCopiedInOverlay
                      ? "bg-emerald-600 text-white"
                      : "bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95"
                  }`}
                >
                  {isCopiedInOverlay ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>복사완료!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>링크 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* 추가 옵션: 공식 웹사이트 열기 & 모바일 공유 */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {shareOverlayItem.targetUrl && (
                  <a
                    href={shareOverlayItem.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>공식 웹사이트 바로가기</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                )}
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    type="button"
                    onClick={() => handleNativeShare(shareOverlayItem)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition"
                    title="기기 네이티브 공유창 열기"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>기기 공유</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              복사된 링크를 메신저나 SNS에 붙여넣어 학생들의 졸업전시를 응원해주세요.
            </p>
          </div>
        </>
      )}

      {/* 링크 복사 완료 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-[#0f172a]/95 text-white text-xs sm:text-sm font-bold shadow-2xl border border-cyan-500/50 backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
