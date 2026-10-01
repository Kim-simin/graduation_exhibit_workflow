'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  School,
  Layers,
  Eye,
  ArrowUpRight,
  X,
  Calendar,
  Filter,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  Instagram,
  Building2,
  Briefcase,
  Share2,
  Globe,
  Play,
  Film,
  Compass,
  ArrowRight,
  Check,
} from "lucide-react";
import { Exhibition, Artwork } from "@/lib/get-exhibitions";
import { ExhibitionDetailModal } from "./exhibition-detail-modal";
import ThemeToggle from "./theme-toggle";
import { STANDARD_CATEGORIES, getStandardCategory } from "@/src/utils/categoryMapper";

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
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  // 공유 URL 헬퍼
  const getShareUrl = (item: Exhibition) => {
    return item.targetUrl && item.targetUrl.startsWith("http")
      ? item.targetUrl
      : typeof window !== "undefined"
      ? `${window.location.origin}/exhibit/${encodeURIComponent(item.id)}`
      : "";
  };

  const handleOpenShareOverlay = (item: Exhibition, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareOverlayItem(item);
    setIsCopiedInOverlay(false);
  };

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

  // 필터링 계산
  const filteredExhibits = exhibitions.filter((item) => {
    const matchesCategory =
      selectedCategory === "전체 분야" ||
      getStandardCategory(item.category || item.department) === selectedCategory;

    const matchesSearch =
      searchQuery === "" ||
      item.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.headline && item.headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.artworks &&
        item.artworks.some((a) =>
          (a.author && a.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase()))
        ));

    const matchesYear =
      selectedYear === "all" || String(item.year) === selectedYear;

    return matchesCategory && matchesSearch && matchesYear;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* 1. 상단 링크공유 오버레이 패널 */}
      {shareOverlayItem && (
        <div className="sticky top-0 z-50 bg-[#111422] border-b border-indigo-500/30 text-white px-4 md:px-6 py-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    전시 링크 공유
                  </span>
                  <span className="text-xs text-slate-300 font-semibold truncate">
                    {shareOverlayItem.university} {shareOverlayItem.department}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {getShareUrl(shareOverlayItem)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => handleCopyOverlayUrl(getShareUrl(shareOverlayItem))}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isCopiedInOverlay
                    ? "bg-emerald-600 text-white"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30"
                }`}
              >
                {isCopiedInOverlay ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <span>링크 복사하기</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNativeShare(shareOverlayItem)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                모바일 공유
              </button>

              <button
                type="button"
                onClick={() => setShareOverlayItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 메인 헤더 & 검색/필터 바 */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>대한민국 전국 대학교 졸업전시 공식 아카이브</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              전국 대학교 졸업전시 아카이브
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              디자인, 미디어, 건축, 미술, 소프트웨어 등 전국의 모든 졸업전시를 한눈에 탐색하세요.
            </p>
          </div>

          {/* 검색창 */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="대학교, 학과, 작품명, 작가명 검색..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. 표준 카테고리 필터 칩 */}
        <div className="py-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              분야별 아카이브 ({filteredExhibits.length}건)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">전시 연도:</span>
              <select
                aria-label="전시 연도 선택"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs font-semibold px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="all">전체 연도</option>
                <option value="2025">2025년</option>
                <option value="2024">2024년</option>
                <option value="2023">2023년</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {INDUSTRIES.map((cat) => {
              const active = selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold transition border shadow-xs ${
                    active
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-md ring-2 ring-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400"
                      : "bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 카드 그리드 뷰 */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-16 w-full flex-1">
        {filteredExhibits.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8">
            <School className="w-12 h-12 mx-auto text-slate-400 mb-3 opacity-60" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              조건에 맞는 졸업전시가 없습니다
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              선택한 카테고리나 검색어를 변경해 보세요.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("전체 분야");
                setSearchQuery("");
                setSelectedYear("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition"
            >
              전체 목록 보기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredExhibits.map((item) => {
              const isResearched = item.isResearched;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedExhibition(item)}
                  className="group rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 hover:shadow-xl dark:hover:shadow-cyan-950/20 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                >
                  {/* 포스터 미디어 영역 */}
                  <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                    {item.posterPath ? (
                      <img
                        src={`/api/images/${item.posterPath}`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-600">
                        <School className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs font-bold">{item.university}</span>
                        <span className="text-[11px] truncate max-w-[180px]">{item.department}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                    {/* 상단 뱃지 그룹 */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold">
                        {item.year}년
                      </span>
                      {isResearched && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>아카이브 완료</span>
                        </span>
                      )}
                    </div>

                    {/* 하단 오버레이 정보 */}
                    <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                      <div className="text-[11px] font-medium text-cyan-300 flex items-center gap-1">
                        <School className="w-3 h-3" />
                        <span className="truncate">{item.university} {item.department}</span>
                      </div>
                      <h3 className="text-sm font-extrabold truncate mt-0.5 drop-shadow">
                        {item.headline || item.title}
                      </h3>
                    </div>
                  </div>

                  {/* 카드 바디 */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                        {item.artworks && item.artworks.length > 0 && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            작품 {item.artworks.length}점
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {item.curationIntro || item.description || "전시 일정 공지 대기"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.period || "일정 공지 대기"}</span>
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleOpenShareOverlay(item, e)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-cyan-500 transition"
                          title="전시 링크 공유"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/exhibit/${encodeURIComponent(item.id)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-cyan-500 transition"
                          title="새 창으로 상세 보기"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. 전시 상세 모달 (Read-Only) */}
      {selectedExhibition && (
        <ExhibitionDetailModal
          isOpen={true}
          onClose={() => setSelectedExhibition(null)}
          exhibition={selectedExhibition}
        />
      )}
    </div>
  );
}
