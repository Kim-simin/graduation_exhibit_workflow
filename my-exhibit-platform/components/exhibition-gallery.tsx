'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ClipboardPaste,
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
  Shield,
  ShieldAlert,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  Loader2,
  Check,
  Instagram,
  Building2,
  Briefcase,
  PlusCircle,
  Plus,
} from "lucide-react";
import { Exhibition, Artwork } from "@/lib/get-exhibitions";
import ScreenshotUploadModal from "./screenshot-upload-modal";
import { InstagramUploadModal } from "./instagram-upload-modal";
import { ExhibitionDetailModal } from "./exhibition-detail-modal";
import AddExhibitionModal from "./add-exhibition-modal";
import ThemeToggle from "./theme-toggle";

// 8대 표준 산업군 메타데이터
const INDUSTRIES = [
  { id: "all", name: "전체 분야", icon: "🌐" },
  { id: "design", name: "디자인·UX/UI", icon: "🎨" },
  { id: "fine_art", name: "미술·회화", icon: "🖼️" },
  { id: "craft", name: "공예·조형", icon: "🏺" },
  { id: "media", name: "영상·미디어", icon: "🎬" },
  { id: "photo", name: "사진·브랜드", icon: "📸" },
  { id: "arch", name: "건축·공간", icon: "🏛️" },
  { id: "fashion", name: "패션·의류", icon: "👔" },
  { id: "game", name: "게임·캐릭터", icon: "🎮" },
];

const EDIT_CATEGORIES = [
  "디자인·UX/UI",
  "미술·회화",
  "공예·조형",
  "영상·미디어",
  "사진·브랜드",
  "건축·공간",
  "패션·의류",
  "게임·캐릭터",
];

interface Props {
  initialExhibitions: Exhibition[];
}

export default function ExhibitionGallery({ initialExhibitions }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("전체 분야");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "uploaded" | "pending">("all");
  const [selectedExhibition, setSelectedExhibition] = useState<Exhibition | null>(null);
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(initialExhibitions);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalData, setUploadModalData] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 인스타그램 캐러셀 피드 발행 모달 및 쿨다운 상태
  const [isInstaModalOpen, setIsInstaModalOpen] = useState(false);
  const [selectedInstaCard, setSelectedInstaCard] = useState<Exhibition | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // 쿨다운 상태 초기 조회
  useEffect(() => {
    async function checkCooldown() {
      try {
        const res = await fetch("/api/publish/instagram");
        if (res.ok) {
          const data = await res.json();
          if (data.cooldownActive && data.remainingSeconds > 0) {
            setCooldownRemaining(data.remainingSeconds);
          }
        }
      } catch (err) {
        console.error("쿨다운 조회 오류:", err);
      }
    }
    checkCooldown();
  }, []);

  // 쿨다운 1초 카운트다운 타이머
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const isProduction = process.env.NODE_ENV === "production";

  // 1. 관리자 모드 On/Off 토글 상태 (프로덕션 배포 시 원천 차단)
  const [isAdmin, setIsAdmin] = useState(false);
  const isAdminEditMode = !isProduction && isAdmin;
  const setIsAdminEditMode = (val: boolean) => {
    if (isProduction) return;
    setIsAdmin(val);
  };
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

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
          setSelectedInstaCard((prev) => {
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

  // 카드 수정 모달 열기 (실시간 상세 편집 모달을 isEditing: true 상태로 오픈)
  const handleOpenEditModal = (item: Exhibition, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExhibition(item);
    setIsDetailEditMode(true);
  };

  // 출품작 드래그 순서 변경 시 부모 상태 및 SNS 연동 데이터 즉시 동기화
  const handleArtworksReorder = (updatedArtworks: Artwork[]) => {
    if (!selectedExhibition) return;
    const updatedCard: Exhibition = {
      ...selectedExhibition,
      artworks: updatedArtworks,
      works: updatedArtworks,
    };
    setSelectedExhibition(updatedCard);
    setExhibitions((prev) =>
      prev.map((item) => (item.id === selectedExhibition.id ? { ...item, artworks: updatedArtworks, works: updatedArtworks } : item))
    );
    setSelectedInstaCard((prev) =>
      prev && prev.id === selectedExhibition.id ? { ...prev, artworks: updatedArtworks, works: updatedArtworks } : prev
    );
  };

  // 카드 영구 삭제 (DELETE /api/cards)
  const handleDeleteCard = async (item: Exhibition, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `[경고] '${item.university} ${item.department}' 전시 카드를 영구 삭제하시겠습니까?\n관련 캡처 에셋 및 대기열 데이터가 모두 제거됩니다.`
    );
    if (!confirmed) return;

    setDeletingCardId(item.id);
    try {
      const res = await fetch("/api/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: item.id }),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        // UI 즉시 갱신
        setExhibitions((prev) => prev.filter((ex) => ex.id !== item.id));
      } else {
        alert(data.error || "카드 삭제에 실패했습니다.");
      }
    } catch (err: any) {
      alert(`삭제 요청 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setDeletingCardId(null);
    }
  };

  // 2. 관리자 권한을 고려한 복합 필터링
  const filteredExhibitions = exhibitions.filter((item) => {
    const isDraftOrPending =
      item.status === "draft" ||
      item.status === "pending" ||
      item.status === "대기" ||
      item.status === "수집 대기" ||
      item.status === "리서치 대기";

    const isPublished =
      !isDraftOrPending &&
      (item.status === "published" ||
        item.isUploaded === true ||
        (item as any).uploadStatus === "completed" ||
        item.status === "리서치 완료" ||
        item.status === "수집 완료" ||
        item.status === "완료" ||
        item.status === "승인 완료" ||
        (item.isResearched === true && Boolean(item.posterPath && item.posterPath.length > 5)));

    // [수정 핵심] 프로덕션 환경이거나 일반 방문자 모드일 때는 미발행/대기/미완성 카드 완전 차단
    if ((isProduction || !isAdminEditMode) && !isPublished) {
      return false;
    }

    // 관리자 모드 내부 상태 필터링 (전체 / 업로드 완료 / 미업로드)
    if (isAdminEditMode && statusFilter !== "all") {
      if (statusFilter === "uploaded" && !isPublished) return false;
      if (statusFilter === "pending" && isPublished) return false;
    }

    // 연도 조건 매칭 (선택된 경우만)
    const matchesYear =
      selectedYear === "all" ||
      String(item.year || "").includes(selectedYear) ||
      String(item.schedule || "").includes(selectedYear) ||
      String(item.title || "").includes(selectedYear);

    // 카테고리 조건 매칭
    const matchesCategory =
      selectedCategory === "전체" ||
      selectedCategory === "전체 분야" ||
      item.category === selectedCategory ||
      item.department?.includes(selectedCategory);

    return matchesYear && matchesCategory;
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
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            전국 대학교 학생 <span className="text-cyan-600 dark:text-cyan-400">졸업작품 전시회</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base mt-2">
            실제 리서치 및 Gemini Vision으로 검수된 전국 주요 대학의 디자인·예술·건축 졸업전시 작품을 탐색하세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isProduction && (
            <button
              onClick={() => {
                setUploadModalData(null);
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs md:text-sm shadow-md shadow-cyan-600/20 transition"
            >
              <ClipboardPaste className="w-4 h-4" /> 📸 스크린샷 직접 등록 (Ctrl+V)
            </button>
          )}

          {/* 1. 관리자 관제 시스템 버튼: 메인 갤러리 카드 관리(수정/삭제) 모드 On/Off 토글 버튼 (로컬 전용) */}
          {!isProduction && (
            <button
              onClick={() => setIsAdminEditMode(!isAdminEditMode)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-sm transition border ${
                isAdminEditMode
                  ? "bg-red-500/10 dark:bg-red-950/40 border-red-500 text-red-600 dark:text-red-400 ring-2 ring-red-500/20 shadow-md animate-pulse"
                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200"
              }`}
              title="클릭 시 전시 카드 수정 및 삭제 버튼이 활성화됩니다"
            >
              {isAdminEditMode ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>관리자 모드 활성 (수정/삭제 중)</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>관리자 관제 시스템</span>
                </>
              )}
            </button>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* 관리자 모드 활성화 알림 배너 */}
      {isAdminEditMode && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-between gap-3 text-red-900 dark:text-red-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold">🔧 카드 관리(수정/삭제) 모드가 켜져 있습니다.</span>
            <span className="text-red-700 dark:text-red-300 hidden sm:inline">
              각 카드의 [수정] 버튼으로 대학명·전공·URL 등을 변경하거나, [삭제] 버튼으로 영구 제거할 수 있습니다.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin?tab=cardnews&year=${encodeURIComponent(selectedYear !== "all" ? selectedYear : "2026")}`}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>대학교 카드 추가</span>
            </Link>
            <button
              onClick={() => setIsAdminEditMode(false)}
              className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/60 hover:bg-red-200 dark:hover:bg-red-900 font-bold transition shrink-0"
            >
              관리자 모드 종료
            </button>
          </div>
        </div>
      )}

      {/* 8대 산업군 인터랙티브 필터 바 */}
      <section className="py-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              산업군 / 전공 분야 필터
            </h2>
            {/* 연도별 드롭다운 필터 */}
            <div className="relative inline-flex items-center">
              <Calendar className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 dark:text-slate-400 pointer-events-none" />
              <select
                id="year-filter"
                aria-label="전시 연도 선택"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="pl-8 pr-7 py-1 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-sm cursor-pointer transition appearance-none"
              >
                <option value="all">전체 연도</option>
                <option value="2025">2025년</option>
                <option value="2026">2026년</option>
              </select>
              <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* 관리자 모드일 때 노출되는 상태 토글 UI (연도 드롭다운 옆 배치) */}
            {!isProduction && isAdminEditMode && (
              <div className="flex items-center gap-2">
                {/* 1. 상태 선택 드롭다운 (셀렉트 박스) */}
                <div className="relative inline-flex items-center">
                  <Filter className="w-3.5 h-3.5 absolute left-2.5 text-slate-500 dark:text-slate-400 pointer-events-none" />
                  <select
                    id="status-filter"
                    aria-label="상태별 필터 선택"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | "uploaded" | "pending")}
                    className="pl-8 pr-7 py-1 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-sm cursor-pointer transition appearance-none"
                  >
                    <option value="all">상태: 전체</option>
                    <option value="uploaded">업로드 완료</option>
                    <option value="pending">미업로드 / 대기</option>
                  </select>
                  <div className="absolute right-2.5 pointer-events-none text-slate-400 text-[10px]">
                    ▼
                  </div>
                </div>

                {/* 2. 상태별 세그먼트 토글 버튼 그룹 */}
                <div
                  id="status-toggle-group"
                  className="hidden sm:inline-flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                      statusFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("uploaded")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      statusFilter === "uploaded"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    업로드 완료
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("pending")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      statusFilter === "pending"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    미업로드
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">
            선택된 결과: {filteredExhibits.length}건
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full min-w-0">
          {INDUSTRIES.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition border ${
                  isSelected
                    ? "bg-cyan-600 text-white border-cyan-600 shadow-sm ring-2 ring-cyan-600/20 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400"
                    : "bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 shadow-sm"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 전시 카드 그리드 */}
      {filteredExhibits.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2 w-full min-w-0">
          {/* 관리자 모드일 때 첫 번째 슬롯에 카드 추가 카드 배치 */}
          {isAdminEditMode && (
            <Link
              href={`/admin?tab=cardnews&year=${encodeURIComponent(selectedYear !== "all" ? selectedYear : "2026")}`}
              className="group relative border-2 border-dashed border-red-300 dark:border-red-800/80 hover:border-red-500 dark:hover:border-red-500 rounded-2xl p-6 bg-red-50/30 dark:bg-red-950/20 hover:bg-red-50/60 dark:hover:bg-red-950/40 transition cursor-pointer flex flex-col items-center justify-center text-center min-h-[360px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-inner">
                <Plus className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-1">
                {selectedYear === "all" ? "새 대학교 카드 추가" : `${selectedYear}년 대학교 카드 추가`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[220px] mb-4">
                기존 카드뉴스 검수 시스템으로 이동하여 AI 링크 분석 및 졸업작품을 자동 등록합니다.
              </p>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition">
                <PlusCircle className="w-3.5 h-3.5" />
                신규 전시 등록하기
              </span>
            </Link>
          )}
          {filteredExhibits.map((item) => {
          const targetUrlParam = item.targetUrl ? `&target_url=${encodeURIComponent(item.targetUrl)}` : "";
          // AI 리서치 관제 화면 진입점 라우트: cardId, card_id, univ, dept 모두 바인딩
          const adminResearchUrl = `/admin?tab=cardnews&cardId=${encodeURIComponent(item.id)}&card_id=${encodeURIComponent(item.id)}&univ=${encodeURIComponent(item.university)}&dept=${encodeURIComponent(item.department)}&category=${encodeURIComponent(item.category)}&year=${encodeURIComponent(item.year || '2026')}${targetUrlParam}`;

          const isDeleting = deletingCardId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (item.isResearched && !isAdminEditMode) {
                  setSelectedExhibition(item);
                }
              }}
              className={`group relative bg-white dark:bg-[#111827] border rounded-2xl overflow-hidden shadow-sm transition flex flex-col ${
                isAdminEditMode
                  ? "border-red-400/70 dark:border-red-500/50 hover:shadow-lg"
                  : item.isResearched
                  ? "border-slate-200 dark:border-gray-800 hover:border-cyan-500 hover:shadow-md cursor-pointer"
                  : "border-slate-200 dark:border-gray-800/60 bg-slate-50/70 dark:bg-slate-950/70 opacity-95 cursor-default"
              }`}
            >
              {/* 관리자 편집 모드 활성화 시 수정/삭제 오버레이 버튼 바 */}
              {isAdminEditMode && (
                <div
                  className="z-30 p-2.5 bg-red-950/80 backdrop-blur-md border-b border-red-500/40 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] font-mono font-bold text-red-200 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {item.id}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(item, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-sm"
                      title="카드 정보 수정"
                    >
                      <Edit className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> 수정
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCard(item, e)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                      title="카드 영구 삭제"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      삭제
                    </button>
                  </div>
                </div>
              )}

              {/* Poster Aspect Ratio Frame */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                {item.isResearched && item.posterPath ? (
                  <>
                    <img
                      src={`/api/images/${item.posterPath}`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </>
                ) : (
                  /* 리서치 전 (수집 대기) 플레이스홀더 */
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-gray-800/50">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-gray-700/60 flex items-center justify-center mb-4 text-cyan-600 dark:text-cyan-400 shadow-sm">
                      <Clock className="w-8 h-8 opacity-80 animate-pulse" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold mb-2">
                      리서치 전 (수집 대기)
                    </span>
                    <h4 className="text-base font-bold text-slate-800 dark:text-gray-200">
                      {item.university} {item.department}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 max-w-[220px]">
                      {isProduction
                        ? "공식 아카이브 에셋 검수 및 준비 중입니다."
                        : "아직 아카이브 에셋이 수집되지 않았습니다. 관리자에서 리서치를 가동하세요."}
                    </p>
                    {!isProduction && isAdminEditMode && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadModalData({
                              id: item.id,
                              university: item.university,
                              department: item.department,
                              year: item.year || "2025",
                              category: item.category,
                              title: item.title,
                              posterPath: item.posterPath,
                              artworks: item.artworks,
                            });
                            setIsUploadModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm transition"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5" /> 스크린샷 붙여넣기
                        </button>
                        {/* 2. [리서치 가동 ↗] 클릭 시 기존 AI 리서치 관제 화면(검수 뷰어/큐 실행 뷰)으로 정확히 라우팅 */}
                        <Link
                          href={adminResearchUrl}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-gray-700 text-cyan-700 dark:text-cyan-300 hover:bg-slate-50 dark:hover:text-white text-xs font-bold transition shadow-sm"
                        >
                          리서치 가동 <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Overlays / Badges for Researched Cards */}
                {item.isResearched && (
                  <>
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-white/90 dark:bg-cyan-950/80 backdrop-blur-md border border-slate-200 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 text-xs font-semibold shadow-sm">
                        {item.category}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white text-xs font-mono">
                        {item.year}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/90 dark:bg-emerald-950/80 backdrop-blur-md dark:border dark:border-emerald-500/40 text-white dark:text-emerald-300 text-xs font-bold shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>검수 {item.criticScore}점</span>
                      </div>
                      {item.instagramPublished && (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white text-[11px] font-bold shadow-md">
                          <Instagram className="w-3 h-3" />
                          <span>인스타 발행 완료 ✅</span>
                        </div>
                      )}
                      {item.hasCorporateCooperation && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 dark:bg-blue-950/80 backdrop-blur-md border border-blue-400/40 text-white text-[11px] font-bold shadow-md">
                          <Building2 className="w-3 h-3 text-blue-300" />
                          <span>산학 {item.cooperationCompanies?.length || 1}개사</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-xs text-cyan-300 dark:text-cyan-400 font-semibold tracking-wide uppercase block mb-0.5">
                        {item.university} · {item.department}
                      </span>
                      <h3 className="text-lg font-bold line-clamp-1 drop-shadow-md">
                        {item.title}
                      </h3>
                    </div>
                  </>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-[#111827]">
                <div>
                  <p className="text-slate-600 dark:text-gray-400 text-xs line-clamp-2 mb-3">
                    {item.headline || `${item.university} ${item.department} 공식 전시 아카이브`}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(item.tags || []).slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-gray-700/60 text-slate-600 dark:text-gray-300 text-[11px]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {item.hasCorporateCooperation && (item.cooperationCompanies || []).length > 0 && (
                    <div className="mb-2 p-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 flex items-center justify-between gap-1 text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-medium truncate">
                          {item.cooperationCompanies?.slice(0, 2).join(", ")}
                          {(item.cooperationCompanies?.length || 0) > 2 ? ` 외 ${(item.cooperationCompanies?.length || 0) - 2}개사` : ""}
                        </span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shrink-0">
                        {item.crossValidationStatus || "CORROBORATED"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-gray-800/60 flex items-center justify-between text-xs">
                  {item.isResearched ? (
                    <>
                      <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        선별 작품 <strong className="text-slate-700 dark:text-gray-200">{item.artworks?.length || 0}점</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!isProduction && isAdminEditMode && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInstaCard(item);
                                setIsInstaModalOpen(true);
                              }}
                              disabled={cooldownRemaining > 0}
                              className={`text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition shadow-sm border ${
                                cooldownRemaining > 0
                                  ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                                  : item.instagramPublished
                                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                                  : "bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:opacity-90 text-white border-transparent"
                              }`}
                            >
                              <Instagram className="w-3 h-3" />
                              {cooldownRemaining > 0
                                ? `쿨다운 (${formatSeconds(cooldownRemaining)})`
                                : item.instagramPublished
                                ? "SNS 재발행"
                                : "📸 SNS 업로드"}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadModalData({
                                  id: item.id,
                                  university: item.university,
                                  department: item.department,
                                  year: item.year || "2025",
                                  category: item.category,
                                  title: item.title,
                                  posterPath: item.posterPath,
                                  artworks: item.artworks,
                                });
                                setIsUploadModalOpen(true);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 flex items-center gap-1 transition shadow-sm"
                            >
                              <ClipboardPaste className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> 스크린샷
                            </button>
                          </>
                        )}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExhibition(item);
                            setIsDetailEditMode(false);
                          }}
                          className="text-cyan-700 dark:text-cyan-400 font-semibold inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition cursor-pointer"
                        >
                          전시 관람하기 <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-slate-500 dark:text-gray-500">
                      <span>{isProduction ? "공식 아카이브 준비 중" : "대기 큐 등록됨"}</span>
                      {!isProduction && isAdminEditMode && (
                        <Link
                          href={adminResearchUrl}
                          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-bold inline-flex items-center gap-1"
                        >
                          리서치 가동 <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
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
            {selectedYear === "2026" && !isAdminEditMode
              ? "2026년 졸업전시 데이터는 현재 수집 및 검수 대기 중이며, 공식 아카이브 확정 및 발행 승인 후 순차적으로 공개됩니다."
              : "선택하신 연도, 상태 또는 전공 분야에 등록된 전시가 없습니다. 다른 필터를 선택해보세요."}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!isProduction && isAdminEditMode && (
              <Link
                href={`/admin?tab=cardnews&year=${encodeURIComponent(selectedYear !== "all" ? selectedYear : "2026")}`}
                className="px-4 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white transition shadow-md flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{selectedYear === "all" ? "2026년" : `${selectedYear}년`} 대학교 졸업전시회 카드 추가하기</span>
              </Link>
            )}
            <button
              onClick={() => {
                setSelectedYear("all");
                setSelectedCategory("전체 분야");
                setStatusFilter("all");
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-sm"
            >
              전체 필터 초기화
            </button>
          </div>
        </div>
      )}

      {/* 전시 상세 뷰어 및 실시간 편집 모달 (포스터 & 출품작 사진 업로드/삭제 지원) */}
      <ExhibitionDetailModal
        isOpen={Boolean(selectedExhibition)}
        onClose={() => {
          setSelectedExhibition(null);
          setIsDetailEditMode(false);
        }}
        exhibition={selectedExhibition}
        initialEditMode={isDetailEditMode}
        onArtworksReorder={handleArtworksReorder}
        onUpdateExhibition={(updated) => {
          setSelectedExhibition(updated);
          const updatedWorks = updated.artworks || updated.works || [];
          setExhibitions((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? { ...item, ...updated, artworks: updatedWorks, works: updatedWorks }
                : item
            )
          );
          setSelectedInstaCard((prev) =>
            prev && prev.id === updated.id
              ? { ...prev, ...updated, artworks: updatedWorks, works: updatedWorks }
              : prev
          );
        }}
        onOpenInstagramModal={(card) => {
          setSelectedInstaCard(card);
          setIsInstaModalOpen(true);
        }}
        onSaveSuccess={async () => {
          await refreshExhibitions();
        }}
      />

      {/* 스크린샷 직접 붙여넣기 모달 (로컬 전용) */}
      {!isProduction && (
        <ScreenshotUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          initialData={uploadModalData}
          queueList={exhibitions}
          onSuccess={async () => {
            await refreshExhibitions();
          }}
        />
      )}

      {/* SNS 캐러셀 발행 모달 (로컬 전용) */}
      {!isProduction && (
        <InstagramUploadModal
          isOpen={isInstaModalOpen}
          onClose={() => setIsInstaModalOpen(false)}
          exhibition={selectedInstaCard}
          isCooldownActive={cooldownRemaining > 0}
          cooldownRemaining={cooldownRemaining}
          onSuccess={(cardId, publishedAt) => {
            setExhibitions((prev) =>
              prev.map((ex) =>
                ex.id === cardId
                  ? { ...ex, instagramPublished: true, publishedAt }
                  : ex
              )
            );
            setCooldownRemaining(180);
          }}
        />
      )}

      {/* 관리자 전용 대학교 졸업전시회 카드 신규 추가 모달 (로컬 전용) */}
      {!isProduction && (
        <AddExhibitionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultYear={selectedYear === "all" ? "2026" : selectedYear}
          onSuccess={(newExhibition) => {
            setExhibitions((prev) => [newExhibition, ...prev]);
            if (selectedYear !== "all" && selectedYear !== newExhibition.year) {
              setSelectedYear(newExhibition.year);
            }
            refreshExhibitions();
          }}
        />
      )}
    </main>
  );
}
