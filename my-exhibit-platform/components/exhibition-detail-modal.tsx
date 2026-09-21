"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Edit,
  Save,
  Trash2,
  Plus,
  Camera,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  MapPin,
  Layers,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Sparkles,
  Instagram,
  Film,
  Download,
  Building2,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { Exhibition, Artwork } from "@/lib/get-exhibitions";

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

// ==========================================
// 개별 출품작 순서 뱃지 (더블클릭 인라인 숫자 편집 및 순서 이동 지원)
// ==========================================
interface OrderBadgeProps {
  index: number;
  totalCount: number;
  onMove: (newOrder: number) => void;
  disabled?: boolean;
}

function OrderBadge({ index, totalCount, onMove, disabled = false }: OrderBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(index + 1));

  useEffect(() => {
    setInputValue(String(index + 1));
  }, [index]);

  const handleConfirm = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val >= 1 && val <= totalCount && val !== index + 1) {
      onMove(val);
    } else {
      setInputValue(String(index + 1));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setInputValue(String(index + 1));
      setIsEditing(false);
    }
  };

  if (disabled) {
    return (
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-white text-[11px] font-mono font-bold select-none">
        #{index + 1}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div
        className="absolute top-2 left-2 z-30 flex items-center bg-black/90 text-white text-xs px-1.5 py-0.5 rounded shadow border border-blue-500"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <span className="text-gray-400 mr-0.5 font-mono">#</span>
        <input
          type="number"
          min={1}
          max={totalCount}
          value={inputValue}
          autoFocus
          onFocus={(e) => e.target.select()}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={handleKeyDown}
          className="w-10 bg-transparent text-white font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    );
  }

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      onClick={(e) => e.stopPropagation()}
      title="더블클릭하여 순서 번호 직접 변경"
      className="absolute top-2 left-2 z-20 bg-black/75 hover:bg-black/90 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm cursor-pointer border border-transparent hover:border-white/40 transition-all select-none"
    >
      <span className="text-gray-400">⠿</span>
      <span className="font-semibold font-mono">#{index + 1}</span>
    </div>
  );
}

interface ExhibitionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition | null;
  initialEditMode?: boolean;
  onSaveSuccess?: () => void;
  onArtworksReorder?: (artworks: Artwork[]) => void;
  onUpdateExhibition?: (updated: Exhibition) => void;
  onOpenInstagramModal?: (exhibit: Exhibition) => void;
}

export function ExhibitionDetailModal({
  isOpen,
  onClose,
  exhibition,
  initialEditMode = false,
  onSaveSuccess,
  onArtworksReorder,
  onUpdateExhibition,
  onOpenInstagramModal,
}: ExhibitionDetailModalProps) {
  const isProduction = process.env.NODE_ENV === "production";
  const [isEditing, setIsEditingState] = useState(isProduction ? false : initialEditMode);
  const setIsEditing = (val: boolean) => {
    if (isProduction) return;
    setIsEditingState(val);
  };
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [uploadingArtworkIndex, setUploadingArtworkIndex] = useState<number | null>(null);
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);

  // 편집 폼 상태
  const [title, setTitle] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("2025");
  const [category, setCategory] = useState("디자인·UX/UI");
  const [headline, setHeadline] = useState("");
  const [curationIntro, setCurationIntro] = useState("");
  const [period, setPeriod] = useState("");
  const [venue, setVenue] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  // 릴스 모션그래픽 비디오 생성 상태
  const [isGeneratingReels, setIsGeneratingReels] = useState(false);
  const [reelsVideoUrl, setReelsVideoUrl] = useState<string | null>(null);
  const [reelsError, setReelsError] = useState<string | null>(null);
  const [showCorporateReport, setShowCorporateReport] = useState(false);

  // 출품작 드래그 앤 드롭 상태 관리
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const draggedIndexRef = useRef<number | null>(null);

  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const newArtworkFileInputRef = useRef<HTMLInputElement>(null);

  // 전시 데이터 변경 시 초기화
  useEffect(() => {
    if (!exhibition) return;
    setIsEditing(initialEditMode);
    setTitle(exhibition.title || "");
    setUniversity(exhibition.university || "");
    setDepartment(exhibition.department || "");
    setYear(exhibition.year || "2025");
    setCategory(exhibition.category || "디자인·UX/UI");
    setHeadline(exhibition.headline || exhibition.slogan || "");
    setCurationIntro(exhibition.curationIntro || exhibition.description || "");
    setPeriod(exhibition.period || exhibition.schedule || "");
    setVenue(exhibition.venue || "");
    setTargetUrl(exhibition.targetUrl || "");
    setPosterPath(exhibition.posterPath || null);
    setArtworks(exhibition.artworks ? [...exhibition.artworks] : []);
    setReelsVideoUrl(null);
    setReelsError(null);
  }, [exhibition, isOpen, initialEditMode]);

  if (!isOpen || !exhibition) return null;

  // 1. 공통 파일 업로드 헬퍼
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("exhibitionId", exhibition.id);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return data.relativePath;
      } else {
        alert(data.error || "파일 업로드에 실패했습니다.");
        return null;
      }
    } catch (err: any) {
      alert(`업로드 중 통신 오류 발생: ${err.message}`);
      return null;
    }
  };

  // 2. 메인 포스터 업로드/교체 핸들러
  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPoster(true);
    const newRelPath = await uploadImageFile(file);
    if (newRelPath) {
      setPosterPath(newRelPath);
    }
    setIsUploadingPoster(false);
    if (e.target) e.target.value = "";
  };

  // 3. 메인 포스터 삭제 핸들러
  const handlePosterDelete = () => {
    if (window.confirm("메인 포스터를 삭제하시겠습니까?")) {
      setPosterPath(null);
    }
  };

  // 3-1. 9:16 인스타그램 릴스 모션 비디오 자동 생성 핸들러
  const handleGenerateReels = async () => {
    if (!posterPath) {
      alert("릴스 모션을 생성하려면 메인 포스터 이미지가 등록되어 있어야 합니다.");
      return;
    }
    setIsGeneratingReels(true);
    setReelsError(null);
    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: exhibition.id,
          posterPath,
          university,
          department,
          title,
          duration: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "릴스 비디오 생성에 실패했습니다.");
      }
      setReelsVideoUrl(data.videoUrl);
    } catch (err: any) {
      console.error("[Reels Generate Error]", err);
      setReelsError(err.message || "릴스 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingReels(false);
    }
  };

  // 4. 출품작 이미지 개별 교체 핸들러
  const handleArtworkImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingArtworkIndex(index);
    const newRelPath = await uploadImageFile(file);
    if (newRelPath) {
      setArtworks((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, imagePath: newRelPath } : item))
      );
    }
    setUploadingArtworkIndex(null);
    if (e.target) e.target.value = "";
  };

  // 5. 출품작 삭제 핸들러
  const handleRemoveArtwork = (index: number) => {
    const art = artworks[index];
    if (window.confirm(`'${art.title || "해당 출품작"}'을 삭제하시겠습니까?`)) {
      setArtworks((prev) => {
        const updated = prev.filter((_, idx) => idx !== index);
        if (onArtworksReorder) onArtworksReorder(updated);
        return updated;
      });
    }
  };

  // 6. 개별 출품작 텍스트 인라인 수정
  const handleUpdateArtworkField = (index: number, field: keyof Artwork, val: string) => {
    setArtworks((prev) => {
      const updated = prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item));
      if (onArtworksReorder) onArtworksReorder(updated);
      return updated;
    });
  };

  // 7. 새 출품작 추가 핸들러 (파일 업로드 후 기본 메타데이터 세팅)
  const handleAddNewArtworkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAddingArtwork(true);
    const newRelPath = await uploadImageFile(file);
    if (newRelPath) {
      const newWork: Artwork = {
        title: `신규 출품작 #${artworks.length + 1}`,
        author: `${university || "출품"} 작가`,
        role: `${department || "디자인"} 크리에이터`,
        imagePath: newRelPath,
        description: "",
      };
      setArtworks((prev) => {
        const updated = [...prev, newWork];
        if (onArtworksReorder) onArtworksReorder(updated);
        return updated;
      });
    }
    setIsAddingArtwork(false);
    if (e.target) e.target.value = "";
  };

  // 8. 출품작 HTML5 네이티브 드래그 앤 드롭 순서 변경 핸들러
  const handleDragStart = (index: number, e: React.DragEvent) => {
    if (!isEditing) return;
    draggedIndexRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", index.toString());
    } catch {}
  };

  const handleDragEnter = (index: number) => {
    const fromIdx = draggedIndexRef.current ?? draggedIndex;
    if (!isEditing || fromIdx === null || fromIdx === index) return;
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isEditing) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const fromIdx = draggedIndexRef.current ?? draggedIndex;
    if (dragOverIndex !== index && fromIdx !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    let sourceIndex = draggedIndexRef.current;
    if (sourceIndex === null) {
      try {
        const raw = e.dataTransfer.getData("text/plain");
        if (raw) sourceIndex = parseInt(raw, 10);
      } catch {}
    }
    if (sourceIndex === null && draggedIndex !== null) {
      sourceIndex = draggedIndex;
    }

    if (!isEditing || sourceIndex === null || isNaN(sourceIndex) || sourceIndex === targetIndex) {
      draggedIndexRef.current = null;
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedWorks = [...artworks];
    const [movedItem] = updatedWorks.splice(sourceIndex!, 1);
    updatedWorks.splice(targetIndex, 0, movedItem);

    draggedIndexRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);

    // 1. 컴포넌트 로컬 상태 업데이트
    setArtworks(updatedWorks);

    // 2. 부모 카드 상태 동기화 (SNS 모달이 즉시 새 순서를 읽도록 처리)
    if (onUpdateExhibition && exhibition) {
      onUpdateExhibition({
        ...exhibition,
        artworks: updatedWorks,
        works: updatedWorks,
      });
    }

    if (onArtworksReorder) {
      onArtworksReorder(updatedWorks);
    }
  };

  // 8-1. 출품작 번호 직접 입력 순서 이동 헬퍼 함수
  const handleMoveWorkToIndex = (fromIndex: number, targetOrder: number) => {
    const toIndex = targetOrder - 1; // 1-based to 0-based
    if (isNaN(toIndex) || toIndex < 0 || toIndex >= artworks.length || fromIndex === toIndex) {
      return;
    }

    const updatedWorks = [...artworks];
    const [movedItem] = updatedWorks.splice(fromIndex, 1);
    updatedWorks.splice(toIndex, 0, movedItem);

    // 1. 컴포넌트 로컬 상태 업데이트
    setArtworks(updatedWorks);

    // 2. 부모 카드 상태 동기화 (SNS 모달이 즉시 새 순서를 읽도록 처리)
    if (onUpdateExhibition && exhibition) {
      onUpdateExhibition({
        ...exhibition,
        artworks: updatedWorks,
        works: updatedWorks,
      });
    }

    if (onArtworksReorder) {
      onArtworksReorder(updatedWorks);
    }
  };

  // 9. 전체 변경사항 저장 (PATCH /api/exhibitions/[id])
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title,
        university,
        department,
        year,
        category,
        headline,
        curationIntro,
        period,
        venue,
        targetUrl,
        posterPath,
        artworks,
      };

      const res = await fetch(`/api/exhibitions/${exhibition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditing(false);
        if (onUpdateExhibition && exhibition) {
          onUpdateExhibition({
            ...exhibition,
            artworks,
            works: artworks,
          });
        }
        if (onArtworksReorder) onArtworksReorder(artworks);
        if (onSaveSuccess) onSaveSuccess();
      } else {
        alert(data.error || "변경사항 저장에 실패했습니다.");
      }
    } catch (err: any) {
      alert(`저장 중 오류 발생: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 9. 편집 취소 및 초기화
  const handleCancelEdit = () => {
    if (window.confirm("수정 중인 내용을 취소하고 원래대로 되돌리시겠습니까?")) {
      setTitle(exhibition.title || "");
      setUniversity(exhibition.university || "");
      setDepartment(exhibition.department || "");
      setYear(exhibition.year || "2025");
      setCategory(exhibition.category || "디자인·UX/UI");
      setHeadline(exhibition.headline || exhibition.slogan || "");
      setCurationIntro(exhibition.curationIntro || exhibition.description || "");
      setPeriod(exhibition.period || exhibition.schedule || "");
      setVenue(exhibition.venue || "");
      setTargetUrl(exhibition.targetUrl || "");
      setPosterPath(exhibition.posterPath || null);
      setArtworks(exhibition.artworks ? [...exhibition.artworks] : []);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 dark:bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (!isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 바 */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {EDIT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="연도"
                    className="w-16 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              ) : (
                <>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 text-xs font-semibold">
                    {category}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                    {year}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    AI 검수 점수: {exhibition.criticScore}점
                  </span>
                </>
              )}
              {isEditing && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] font-bold flex items-center gap-1">
                  <Edit className="w-3 h-3" /> 편집 모드 활성화됨
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-1.5 mt-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="전시회 전체 타이틀을 입력하세요"
                  className="w-full text-lg md:text-xl font-black px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-cyan-400/80 dark:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="대학교 명칭"
                    className="w-32 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="학과/전공 명칭"
                    className="w-40 text-xs font-semibold px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">
                  {title}
                </h2>
                <p className="text-cyan-700 dark:text-cyan-400 text-xs font-semibold mt-0.5">
                  {university} {department}
                </p>
              </>
            )}
          </div>

          {/* 우측 상단 액션 버튼 그룹 */}
          <div className="flex items-center gap-2">
            {!isProduction && onOpenInstagramModal && (
              <button
                type="button"
                onClick={() => {
                  onOpenInstagramModal({
                    ...exhibition,
                    artworks,
                    posterPath,
                    title,
                    university,
                    department,
                    year,
                    category,
                    headline,
                    curationIntro,
                    period,
                    venue,
                    targetUrl,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-bold transition shadow-sm"
                title="인스타그램 피드 발행 모달 열기"
              >
                <Instagram className="w-3.5 h-3.5" /> SNS 발행
              </button>
            )}

            {!isProduction && !isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 text-xs font-bold transition shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" /> 수정 모드
              </button>
            ) : !isProduction && isEditing ? (
              <>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleCancelEdit}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" /> 취소
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-extrabold shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  변경사항 저장
                </button>
              </>
            ) : null}

            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 모달 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {/* 상단 오버뷰 배너 (포스터 + 전시 기본 정보) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* 좌측: 메인 포스터 영역 (마우스 오버레이 및 업로드/삭제 버튼) */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative group w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center">
                {posterPath ? (
                  <img
                    src={posterPath.startsWith("http") ? posterPath : `/api/images/${posterPath}`}
                    alt="메인 공식 포스터"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-500">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-xs font-semibold">등록된 공식 포스터가 없습니다</span>
                  </div>
                )}

                {/* 업로드 로딩 스피너 */}
                {isUploadingPoster && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs font-bold">포스터 업로드 중...</span>
                  </div>
                )}

                {/* 편집 모드 시 오버레이 액션 바 */}
                {!isProduction && isEditing && !isUploadingPoster && (
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-4 z-10">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-lg transition">
                      <Camera className="w-3.5 h-3.5" />
                      {posterPath ? "📷 포스터 변경/업로드" : "📷 포스터 업로드"}
                      <input
                        ref={posterFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePosterUpload}
                      />
                    </label>

                    {posterPath && (
                      <button
                        type="button"
                        onClick={handlePosterDelete}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 🗑️ 포스터 삭제
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* 편집 모드이고 포스터가 없을 때 즉각 노출되는 업로드 버튼 */}
              {isEditing && !posterPath && !isUploadingPoster && (
                <button
                  type="button"
                  onClick={() => posterFileInputRef.current?.click()}
                  className="mt-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" /> 메인 포스터 사진 선택
                </button>
              )}

              {/* 릴스 모션그래픽 생성 버튼 & 프리뷰 */}
              {posterPath && (
                <div className="w-full mt-3 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingReels}
                    onClick={handleGenerateReels}
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
                    title="1080x1920 무왜곡 2.5D 모션그래픽 릴스 비디오 생성"
                  >
                    {isGeneratingReels ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>릴스 모션 렌더링 중...</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-4 h-4" />
                        <span>🎬 릴스 모션 생성</span>
                      </>
                    )}
                  </button>

                  {reelsError && (
                    <div className="w-full p-2 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900/50 text-center">
                      {reelsError}
                    </div>
                  )}

                  {reelsVideoUrl && (
                    <div className="w-full mt-1 p-3 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-purple-500/30 flex flex-col items-center gap-2 shadow-sm">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Film className="w-3.5 h-3.5" /> 릴스 프리뷰 (9:16)
                        </span>
                        <a
                          href={reelsVideoUrl}
                          download={`reels_${exhibition.id || "video"}.mp4`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download className="w-3 h-3" /> 다운로드
                        </a>
                      </div>
                      <div className="relative w-full max-w-[180px] aspect-[9/16] rounded-lg overflow-hidden bg-black shadow-inner border border-slate-700/50">
                        <video
                          src={reelsVideoUrl}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 우측: 전시 상세 메타데이터 */}
            <div className="md:col-span-8 space-y-4">
              {/* 슬로건 및 소개글 */}
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      전시 슬로건 / 대표 헤드라인
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="예: 삶의 리듬을 풀어내는 혁신: 인공지능이 그리는 미래의 웰니스"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      상세 큐레이션 및 전시 소개글
                    </label>
                    <textarea
                      value={curationIntro}
                      onChange={(e) => setCurationIntro(e.target.value)}
                      rows={5}
                      placeholder="전시회 소개 및 큐레이션 요약문을 작성하세요..."
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 leading-relaxed resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {headline || `${university} ${department} 졸업전시회`}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {curationIntro || "등록된 상세 소개글이 없습니다."}
                  </p>
                </div>
              )}

              {/* 일정 및 장소 정보 */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 전시 기간
                      </label>
                      <input
                        type="text"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        placeholder="2025.11.12 ~ 11.18"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 전시 장소
                      </label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="교내 갤러리 또는 외부 미술관"
                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span className="truncate">{period || "일정 공지 대기"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span className="truncate">{venue || "장소 미정"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 공식 아카이브 웹사이트 URL */}
              <div className="pt-2">
                {isEditing ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> 공식 아카이브 웹사이트 URL
                    </label>
                    <input
                      type="text"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                    />
                  </div>
                ) : (
                  targetUrl && (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 text-xs font-semibold hover:bg-cyan-100 dark:hover:bg-cyan-900 transition"
                    >
                      공식 아카이브 웹사이트 바로가기 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 대학-산학협력 기업 & 실제 채용조건 교차검증 리서치 섹션 */}
          {(exhibition.hasCorporateCooperation || (exhibition.cooperationCompanies && exhibition.cooperationCompanies.length > 0)) && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/50 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white">
                        대학-산학협력 기업 & 실제 채용조건 교차검증 브리프
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-xs">
                        {exhibition.crossValidationStatus || "CORROBORATED"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      산학협력(수요/관심 신호)과 실제 공식 채용공고의 필수 역량을 다중 교차 검증한 인텔리전스입니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCorporateReport(!showCorporateReport)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {showCorporateReport ? "리포트 접기 ▲" : "7단계 전체 리포트 열람 ▼"}
                </button>
              </div>

              {/* 산학 협력 기업 태그 및 검증된 필수 스킬 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-100 dark:border-blue-900/60">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" /> 공식 산학협력 협약 기업:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(exhibition.cooperationCompanies || []).map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-bold shadow-2xs"
                      >
                        🏢 {comp}
                      </span>
                    ))}
                  </div>
                </div>

                {exhibition.verifiedRequiredSkills && exhibition.verifiedRequiredSkills.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 실제 채용공고 검증 필수 역량:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {exhibition.verifiedRequiredSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold"
                        >
                          ✓ {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 펼쳐지는 7단계 전체 마크다운 리포트 */}
              {showCorporateReport && exhibition.corporateResearchReport && (
                <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                  {exhibition.corporateResearchReport}
                </div>
              )}
            </div>
          )}

          {/* 하단: 출품작 갤러리 그리드 영역 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                출품작 갤러리 ({artworks.length}점)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? "💡 마우스로 카드를 드래그하거나 좌상단 번호(#)를 더블클릭하여 순서를 빠르게 재배치할 수 있습니다. (사진 교체, 삭제, 인라인 편집 지원)"
                  : "* 카드를 클릭하면 고화질 이미지를 확인할 수 있습니다."}
              </span>
            </div>

            {artworks.length > 0 || isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {artworks.map((art, idx) => {
                  const isDragging = draggedIndex === idx;
                  const isOver = dragOverIndex === idx;

                  return (
                    <div
                      key={idx}
                      draggable={isEditing}
                      onDragStart={(e) => {
                        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                        if (tag === "input" || tag === "textarea" || tag === "button") {
                          e.preventDefault();
                          return;
                        }
                        handleDragStart(idx, e);
                      }}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(idx, e)}
                      className={`relative group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm transition-all duration-200 flex flex-col ${
                        isEditing ? "cursor-grab active:cursor-grabbing" : ""
                      } ${
                        isDragging
                          ? "opacity-40 scale-95 border-2 border-blue-500 ring-2 ring-blue-500/50 z-30"
                          : isOver
                          ? "border-dashed border-2 border-blue-400 ring-2 ring-blue-500 scale-[1.02] bg-blue-50/20 dark:bg-blue-950/30 z-20"
                          : "border border-slate-200 dark:border-slate-800 hover:border-cyan-500 hover:shadow-md"
                      }`}
                    >
                      {/* 드래그 핸들 및 더블클릭 순서 변경 배지 */}
                      <OrderBadge
                        index={idx}
                        totalCount={artworks.length}
                        onMove={(newOrder) => handleMoveWorkToIndex(idx, newOrder)}
                        disabled={!isEditing}
                      />

                      {/* 작품 이미지 영역 */}
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center select-none">
                        <img
                          src={
                            art.imagePath.startsWith("http")
                              ? art.imagePath
                              : `/api/images/${art.imagePath}`
                          }
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 select-none pointer-events-none"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />

                        {/* 개별 작품 사진 교체 로딩 스피너 */}
                        {uploadingArtworkIndex === idx && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20">
                            <Loader2 className="w-6 h-6 animate-spin mb-1" />
                            <span className="text-[10px] font-bold">사진 교체 중...</span>
                          </div>
                        )}

                        {/* 편집 모드 시 우측 상단 액션 툴바 */}
                        {!isProduction && isEditing && uploadingArtworkIndex !== idx && (
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                            <label
                              className="cursor-pointer p-1.5 rounded-lg bg-black/75 hover:bg-cyan-600 text-white shadow-md transition flex items-center gap-1 text-[11px] font-bold"
                              title="사진 교체"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleArtworkImageChange(idx, e)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveArtwork(idx);
                              }}
                              className="p-1.5 rounded-lg bg-black/75 hover:bg-red-600 text-white shadow-md transition"
                              title="작품 삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 작품 정보 영역 (인라인 편집 지원) */}
                      <div
                        className="p-4 bg-white dark:bg-slate-950 flex-1 flex flex-col justify-between"
                        onMouseDown={(e) => {
                          const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
                          if (tag === "input" || tag === "textarea") {
                            e.stopPropagation();
                          }
                        }}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                              <span>{department || "학과"} #{idx + 1}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                  역할 / 분야
                                </label>
                                <input
                                  type="text"
                                  value={art.role}
                                  onChange={(e) =>
                                    handleUpdateArtworkField(idx, "role", e.target.value)
                                  }
                                  placeholder="역할/분야"
                                  className="w-full text-xs px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                  작가명
                                </label>
                                <input
                                  type="text"
                                  value={art.author}
                                  onChange={(e) =>
                                    handleUpdateArtworkField(idx, "author", e.target.value)
                                  }
                                  placeholder="작가명"
                                  className="w-full text-xs px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                작품명
                              </label>
                              <input
                                type="text"
                                value={art.title}
                                onChange={(e) =>
                                  handleUpdateArtworkField(idx, "title", e.target.value)
                                }
                                placeholder="작품명"
                                className="w-full text-xs font-bold px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                                작품 설명 (선택)
                              </label>
                              <textarea
                                value={art.description}
                                onChange={(e) =>
                                  handleUpdateArtworkField(idx, "description", e.target.value)
                                }
                                placeholder="작품 상세 설명..."
                                rows={2}
                                className="w-full text-xs px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 resize-none leading-relaxed"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-medium truncate max-w-[130px]">
                                {department} #{idx + 1}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {art.author}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-gray-200 mt-2 mb-1">
                              {art.title}
                            </h4>
                            {art.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                {art.description}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 편집 모드 시 마지막 칸에 노출되는 [+ 새 출품작 추가] 카드 */}
                {!isProduction && isEditing && (
                  <div
                    onClick={() => newArtworkFileInputRef.current?.click()}
                    className="relative aspect-video md:aspect-auto min-h-[220px] rounded-xl border-2 border-dashed border-cyan-400/80 dark:border-cyan-600/80 hover:border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/20 hover:bg-cyan-50/70 dark:hover:bg-cyan-950/40 transition flex flex-col items-center justify-center p-6 text-center cursor-pointer group shadow-sm"
                  >
                    <input
                      ref={newArtworkFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddNewArtworkFile}
                    />

                    {isAddingArtwork ? (
                      <div className="flex flex-col items-center gap-2 text-cyan-600 dark:text-cyan-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-xs font-bold">새 작품 업로드 중...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-300 flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-inner">
                          <Plus className="w-6 h-6 stroke-[2.5]" />
                        </div>
                        <h4 className="text-sm font-extrabold text-cyan-800 dark:text-cyan-300">
                          + 새 출품작 추가
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[180px]">
                          작품 사진 파일을 선택하여 신규 출품작을 등록하세요
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                등록된 상세 작품 에셋이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
