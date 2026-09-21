"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Layers,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  ClipboardPaste,
  Image as ImageIcon,
  User,
  FileText,
  AlertCircle
} from "lucide-react";

interface ArtworkDraft {
  id: string;
  image_base64: string;
  student_name: string;
  title: string;
  description: string;
  role: string;
}

interface ScreenshotUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    university?: string;
    department?: string;
    year?: string;
    category?: string;
    title?: string;
    posterPath?: string | null;
    artworks?: any[];
  };
  queueList?: any[];
}

export default function ScreenshotUploadModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  queueList = [],
}: ScreenshotUploadModalProps) {
  const [selectedCardId, setSelectedCardId] = useState(initialData?.id || "");
  const [university, setUniversity] = useState(initialData?.university || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [year, setYear] = useState(initialData?.year || "2025");
  const [category, setCategory] = useState(initialData?.category || "디자인·UX/UI");
  const [exhibitionTitle, setExhibitionTitle] = useState(
    initialData?.title || `[${initialData?.university || "대학"}] ${initialData?.year || "2025"} ${initialData?.department || "학과"} 졸업전시회`
  );

  // 'poster' (메인 포스터 붙여넣기 모드) | 'works' (학생 출품작 붙여넣기 모드)
  const [activeTab, setActiveTab] = useState<"poster" | "works">("poster");

  // 메인 포스터 Base64 및 미리보기
  const [mainPosterBase64, setMainPosterBase64] = useState<string | null>(
    initialData?.posterPath ? `/api/images/${initialData.posterPath}` : null
  );

  // 학생 출품작 목록
  const [artworks, setArtworks] = useState<ArtworkDraft[]>(
    (initialData?.artworks || []).map((art: any, idx: number) => ({
      id: `init-${idx}`,
      image_base64: art.imagePath ? `/api/images/${art.imagePath}` : "",
      student_name: art.author || "",
      title: art.title || `출품작 #${idx + 1}`,
      description: art.description || "",
      role: art.role || "크리에이터",
    }))
  );

  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isVisionSplitting, setIsVisionSplitting] = useState(false);
  const visionFileInputRef = useRef<HTMLInputElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  const handleVisionExtractInModal = async (file: File) => {
    setIsVisionSplitting(true);
    showNotice("🤖 Gemini Vision으로 스크린샷 내 개별 작품을 분석하고 자동 크롭 중입니다...");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;

        const res = await fetch("/api/research/vision-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: base64,
            card_id: selectedCardId || "TEMP",
          }),
        });

        const data = await res.json();
        if (res.ok && data.status === "SUCCESS" && data.cards && data.cards.length > 0) {
          const newDrafts: ArtworkDraft[] = data.cards.map((c: any, i: number) => ({
            id: `crop-${Date.now()}-${i}`,
            image_base64: c.screenshot_path || c.thumbnail,
            student_name: c.author !== "출품 작가" ? c.author : "",
            title: c.title || `출품작 #${artworks.length + i + 1}`,
            description: c.raw_text || "",
            role: `${department || "디자인"} 크리에이터`,
          }));

          setArtworks((prev) => [...prev, ...newDrafts]);
          showNotice(`🎉 Gemini Vision 자동 분할 완료: 총 ${data.detected_count}개 작품 카드가 추가되었습니다!`);
        } else {
          alert(`분할 실패: ${data.error || "작품 감지 결과가 없습니다."}`);
        }
        setIsVisionSplitting(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(`Vision 분석 오류: ${err.message}`);
      setIsVisionSplitting(false);
    }
  };
  const worksFileInputRef = useRef<HTMLInputElement>(null);

  // initialData 변경 시 동기화
  useEffect(() => {
    if (initialData) {
      if (initialData.id) setSelectedCardId(initialData.id);
      if (initialData.university) setUniversity(initialData.university);
      if (initialData.department) setDepartment(initialData.department);
      if (initialData.year) setYear(initialData.year);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.title) setExhibitionTitle(initialData.title);
      else if (initialData.university && initialData.department) {
        setExhibitionTitle(`[${initialData.university}] ${initialData.year || "2025"} ${initialData.department} 졸업전시회`);
      }
      if (initialData.posterPath) {
        setMainPosterBase64(`/api/images/${initialData.posterPath}`);
      }
      if (initialData.artworks && initialData.artworks.length > 0) {
        setArtworks(
          initialData.artworks.map((art: any, idx: number) => ({
            id: `init-${idx}`,
            image_base64: art.imagePath ? `/api/images/${art.imagePath}` : "",
            student_name: art.author || "",
            title: art.title || `출품작 #${idx + 1}`,
            description: art.description || "",
            role: art.role || "크리에이터",
          }))
        );
      }
    }
  }, [initialData]);

  // 알림 토스트 헬퍼
  const showNotice = (msg: string) => {
    setPasteNotice(msg);
    setTimeout(() => setPasteNotice(null), 3000);
  };

  // 클립보드 이미지 처리 함수
  const handleImageFile = (file: File, target: "poster" | "works") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (!base64) return;

      if (target === "poster") {
        setMainPosterBase64(base64);
        showNotice("📸 공식 메인 포스터 스크린샷 붙여넣기 완료!");
        // 메인 포스터가 붙여지면 편의상 다음 작품 탭으로 자동 유도 가능
        if (artworks.length === 0) {
          setActiveTab("works");
        }
      } else {
        const newArtwork: ArtworkDraft = {
          id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          image_base64: base64,
          student_name: "",
          title: `출품작 #${artworks.length + 1}`,
          description: "",
          role: `${department || "디자인"} 크리에이터`,
        };
        setArtworks((prev) => [...prev, newArtwork]);
        showNotice(`🎨 학생 출품작 #${artworks.length + 1} 스크린샷 추가 완료!`);
      }
    };
    reader.readAsDataURL(file);
  };

  // 글로벌 paste 이벤트 리스너
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      let foundImage = false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            foundImage = true;
            handleImageFile(blob, activeTab);
          }
        }
      }

      if (!foundImage && e.clipboardData?.files.length) {
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type.startsWith("image/")) {
            handleImageFile(file, activeTab);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isOpen, activeTab, artworks.length, department]);

  // 대기열 목록에서 다른 대학 선택 시 동기화
  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cardId = e.target.value;
    setSelectedCardId(cardId);
    const matched = queueList.find((q) => q.id === cardId);
    if (matched) {
      setUniversity(matched.university);
      setDepartment(matched.department);
      setYear(matched.year || "2025");
      setCategory(matched.category || "디자인·UX/UI");
      setExhibitionTitle(`[${matched.university}] ${matched.year || "2025"} ${matched.department} 졸업전시회`);
      if (matched.poster_image) {
        setMainPosterBase64(`/api/images/${matched.poster_image}`);
      } else {
        setMainPosterBase64(null);
      }
    }
  };

  // 개별 출품작 필드 수정
  const updateArtworkField = (id: string, field: keyof ArtworkDraft, val: string) => {
    setArtworks((prev) =>
      prev.map((art) => (art.id === id ? { ...art, [field]: val } : art))
    );
  };

  // 개별 출품작 삭제
  const removeArtwork = (id: string) => {
    setArtworks((prev) => prev.filter((art) => art.id !== id));
  };

  // 저장 및 즉시 게시
  const handleSaveAndPublish = async () => {
    if (!mainPosterBase64) {
      alert("공식 메인 포스터를 먼저 스크린샷 붙여넣기(Ctrl+V)하거나 업로드해 주세요.");
      setActiveTab("poster");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        card_id: selectedCardId || `DES-${Date.now().toString().slice(-4)}`,
        university: university || "공식전시",
        department: department || "디자인",
        year: year || "2025",
        category: category || "디자인·UX/UI",
        exhibition_title: exhibitionTitle,
        main_poster_base64: mainPosterBase64,
        artworks: artworks.map((a) => ({
          student_name: a.student_name,
          title: a.title,
          description: a.description,
          role: a.role,
          image_base64: a.image_base64,
        })),
      };

      const res = await fetch("/api/research/direct-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        alert("🎉 공식 포스터 및 학생 출품작이 성공적으로 저장 및 반영되었습니다!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || "저장에 실패했습니다.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-5 bg-white/95 backdrop-blur border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold flex items-center gap-1.5">
                <ClipboardPaste className="w-3.5 h-3.5 text-cyan-600" /> 스크린샷 다이렉트 업로드 (Ctrl+V)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {selectedCardId || "DES-NEW"}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-900 mt-1">
              {university && department
                ? `${university} ${department} 포스터 & 출품작 직접 등록`
                : "졸업전시 포스터 및 출품작 직접 등록"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Notice Toast */}
        {pasteNotice && (
          <div className="bg-cyan-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> {pasteNotice}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-1 bg-white">
          {/* Target Metadata Configuration */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600" /> 대상 전시회 메타정보
              </span>
              {queueList.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">대기열 카드 변경:</span>
                  <select
                    value={selectedCardId}
                    onChange={handleSelectPreset}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-cyan-600 shadow-sm"
                  >
                    <option value="">카드 선택...</option>
                    {queueList.map((item) => (
                      <option key={item.id} value={item.id}>
                        [{item.id}] {item.university} {item.department} ({item.status || "대기"})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">대학교</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="예: 서경대학교"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">학과</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="예: 시각정보디자인"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">연도</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">산업군</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                전시 공식 타이틀
              </label>
              <input
                type="text"
                value={exhibitionTitle}
                onChange={(e) => setExhibitionTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
              />
            </div>
          </div>

          {/* Tab Selector & Guide */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("poster")}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "poster"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                1. 공식 메인 포스터 {mainPosterBase64 ? "✓" : "(필수)"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("works")}
                className={`flex-1 sm:flex-none inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "works"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                }`}
              >
                <Layers className="w-4 h-4" />
                2. 학생 출품 포스터/작품 ({artworks.length}점)
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-cyan-800 shadow-sm">
              <ClipboardPaste className="w-3.5 h-3.5 text-cyan-600" />
              <span>
                현재 <strong>{activeTab === "poster" ? "공식 메인 포스터" : "학생 출품작"}</strong> 붙여넣기 모드 (키보드 <strong>Ctrl + V</strong>)
              </span>
            </div>
          </div>

          {/* TAB 1: 공식 메인 포스터 영역 */}
          {activeTab === "poster" && (
            <div className="space-y-4">
              <div
                tabIndex={0}
                onClick={() => posterFileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    posterFileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageFile(e.dataTransfer.files[0], "poster");
                  }
                }}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[260px] outline-none ${
                  mainPosterBase64
                    ? "border-cyan-500/50 bg-slate-50"
                    : "border-slate-300 hover:border-cyan-500 bg-slate-50/70 focus:ring-2 focus:ring-cyan-500"
                }`}
              >
                <input
                  ref={posterFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFile(e.target.files[0], "poster");
                    }
                  }}
                />

                {mainPosterBase64 ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <div className="relative max-h-[320px] rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100">
                      <img
                        src={mainPosterBase64}
                        alt="메인 포스터 미리보기"
                        className="max-h-[320px] w-auto object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 포스터 등록 완료
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          posterFileInputRef.current?.click();
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 transition"
                      >
                        이미지 변경
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMainPosterBase64(null);
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs text-rose-700 transition"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mx-auto text-cyan-600 shadow-sm">
                      <ClipboardPaste className="w-7 h-7 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800">
                        여기를 클릭한 후 <span className="text-cyan-600">[Ctrl + V]</span>를 눌러 공식 포스터 붙여넣기
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        화면 캡처 도구(Win+Shift+S)로 복사한 뒤 키보드 Ctrl+V를 누르거나, 파일을 드래그앤드롭 / 클릭하여 선택하세요.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-500 shadow-sm">
                      <span>지원 형식: PNG, JPG, WEBP, 클립보드 이미지</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: 학생 출품 포스터 / 작품 목록 영역 */}
          {activeTab === "works" && (
            <div className="space-y-4">
              {/* Gemini Vision Screenshot Grid Auto-Split Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-purple-50 border border-purple-200 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 text-purple-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-purple-950 font-bold block">
                      여러 작품이 격자로 포함된 전체 스크린샷 이미지를 일괄 분할할 수 있습니다
                    </span>
                    <span className="text-[11px] text-purple-700">
                      Gemini Vision이 각 학생 작품 영역을 시각적으로 탐지하고 자동 크롭하여 개별 카드로 등록합니다.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => visionFileInputRef.current?.click()}
                  disabled={isVisionSplitting}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                >
                  {isVisionSplitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      AI 자동 크롭 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      📸 스크린샷 AI 자동 분할 (Vision)
                    </>
                  )}
                </button>
                <input
                  ref={visionFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleVisionExtractInModal(e.target.files[0]);
                    }
                  }}
                />
              </div>
              {/* Works Paste Dropzone */}
              <div
                tabIndex={0}
                onClick={() => worksFileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    worksFileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    for (let i = 0; i < e.dataTransfer.files.length; i++) {
                      handleImageFile(e.dataTransfer.files[i], "works");
                    }
                  }
                }}
                className="border-2 border-dashed border-cyan-400 hover:border-cyan-500 rounded-2xl p-5 text-center cursor-pointer bg-slate-50 focus:ring-2 focus:ring-cyan-500 transition outline-none"
              >
                <input
                  ref={worksFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      for (let i = 0; i < e.target.files.length; i++) {
                        handleImageFile(e.target.files[i], "works");
                      }
                    }
                  }}
                />
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0 shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h5 className="text-sm font-bold text-slate-800">
                      학생 출품작 스크린샷 붙여넣기: <span className="text-cyan-600">[Ctrl + V]</span> 반복 입력 가능
                    </h5>
                    <p className="text-xs text-slate-500">
                      여러 학생의 작품이나 포스터를 캡처할 때마다 Ctrl+V를 누르면 아래에 순차적으로 계속 추가됩니다!
                    </p>
                  </div>
                </div>
              </div>

              {/* Artworks Card List */}
              {artworks.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>등록된 학생 출품작 ({artworks.length}점)</span>
                    <button
                      type="button"
                      onClick={() => setArtworks([])}
                      className="text-rose-600 hover:text-rose-700 text-[11px] font-semibold"
                    >
                      전체 비우기
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
                    {artworks.map((art, idx) => (
                      <div
                        key={art.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden p-3 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition space-y-3"
                      >
                        <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                          {art.image_base64 ? (
                            <img
                              src={art.image_base64}
                              alt={art.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">이미지 없음</span>
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/90 text-cyan-800 font-mono text-[10px] border border-slate-200 shadow-sm">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeArtwork(art.id)}
                            className="absolute top-2 right-2 p-1 rounded-md bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition shadow-sm"
                            title="출품작 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-600 mb-0.5">
                                학생(작가) 이름
                              </label>
                              <input
                                type="text"
                                value={art.student_name}
                                onChange={(e) => updateArtworkField(art.id, "student_name", e.target.value)}
                                placeholder="예: 김민지"
                                className="w-full px-2.5 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-600 mb-0.5">
                                작품명 / 프로젝트명
                              </label>
                              <input
                                type="text"
                                value={art.title}
                                onChange={(e) => updateArtworkField(art.id, "title", e.target.value)}
                                placeholder="예: 루몰트 (LUMOLT)"
                                className="w-full px-2.5 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600 font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-600 mb-0.5">
                              작품 설명 또는 역할 (선택)
                            </label>
                            <input
                              type="text"
                              value={art.description}
                              onChange={(e) => updateArtworkField(art.id, "description", e.target.value)}
                              placeholder="예: 인터랙티브 웹 디자인 및 브랜드 아이덴티티 구축"
                              className="w-full px-2.5 py-1 rounded bg-white border border-slate-300 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-cyan-600"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  아직 등록된 학생 출품작이 없습니다. 위의 영역을 클릭하고 스크린샷을 찍어 [Ctrl + V]를 눌러보세요!
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Sticky Footer Actions Bar */}
        <div className="sticky bottom-0 z-20 p-4 md:p-5 bg-white/95 backdrop-blur border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className={mainPosterBase64 ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}>
              ● 포스터: {mainPosterBase64 ? "등록됨" : "미등록"}
            </span>
            <span>|</span>
            <span className={artworks.length > 0 ? "text-cyan-700 font-bold" : "text-slate-400"}>
              학생 작품: {artworks.length}점
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSaveAndPublish}
              disabled={isSaving || !mainPosterBase64}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 저장 및 반영 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> 💾 저장 및 갤러리 즉시 게시
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
