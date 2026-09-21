"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  PlusCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Calendar,
  Building2,
  GraduationCap,
  Layers,
  MapPin,
  Globe,
  Tag,
  Loader2,
  AlertCircle,
  Bot,
  Trash2,
} from "lucide-react";
import { Exhibition } from "@/lib/get-exhibitions";

const UNIVERSITY_PRESETS = [
  "홍익대",
  "서울대",
  "국민대",
  "이화여대",
  "연세대",
  "고려대",
  "건국대",
  "한양대",
  "중앙대",
  "경희대",
  "성균관대",
  "한국예술종합학교",
  "상명대",
  "숙명여대",
  "단국대",
  "서울과기대",
];

const DEPARTMENT_PRESETS = [
  "시각디자인",
  "산업디자인",
  "인터랙션디자인",
  "컴퓨터공학",
  "인공지능",
  "디지털미디어",
  "미디어커뮤니케이션",
  "조형예술",
  "건축학",
  "패션디자인",
];

const CATEGORY_OPTIONS = [
  "디자인·UX/UI",
  "미술·회화",
  "공예·조형",
  "영상·미디어",
  "사진·브랜드",
  "건축·공간",
  "패션·의류",
  "게임·캐릭터",
];

interface AddExhibitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultYear?: string;
  onSuccess: (newExhibition: Exhibition) => void;
}

export default function AddExhibitionModal({
  isOpen,
  onClose,
  defaultYear = "2026",
  onSuccess,
}: AddExhibitionModalProps) {
  const [year, setYear] = useState(defaultYear === "all" ? "2026" : defaultYear);
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("디자인·UX/UI");
  const [title, setTitle] = useState("");
  const [isTitleCustomized, setIsTitleCustomized] = useState(false);
  const [slogan, setSlogan] = useState("");
  const [period, setPeriod] = useState("2026.11월 전시 예정");
  const [venue, setVenue] = useState("교내 전시관 및 온라인 공식 아카이브");
  const [targetUrl, setTargetUrl] = useState("");
  const [tags, setTags] = useState("2026졸전, 졸업전시, 신진창작자");

  const [posterBase64, setPosterBase64] = useState<string | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 로컬 LLM (Qwen2.5-VL) 링크 분석 및 기존 졸업작품 탐색 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [analyzedEngine, setAnalyzedEngine] = useState<string | null>(null);
  const [artworks, setArtworks] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 연도 변경 동기화
  useEffect(() => {
    if (defaultYear && defaultYear !== "all") {
      setYear(defaultYear);
    }
  }, [defaultYear]);

  // 대학명 및 학과 입력 시 타이틀 자동 생성 (사용자가 직접 타이핑하지 않은 경우)
  useEffect(() => {
    if (!isTitleCustomized) {
      const u = university.trim() || "대학교";
      const d = department.trim() || "전공";
      setTitle(`[${u}] ${year} ${d} 졸업전시회`);
    }
  }, [university, department, year, isTitleCustomized]);

  // 로컬 LLM 기반 링크 분석 및 졸업작품 자동 탐색 핸들러
  const handleAnalyzeLink = async () => {
    if (!targetUrl.trim()) {
      alert("졸업전시회 웹사이트 링크(URL)를 입력해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage("🌐 웹사이트 접속 및 메타데이터 파싱 중...");
    setErrorMessage(null);
    setAnalyzedEngine(null);

    const stageTimer1 = setTimeout(() => {
      setAnalysisStage("🤖 설치된 Llama.cpp (Qwen2.5-VL-7B)으로 대학/학과 지능형 인식 중...");
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setAnalysisStage("🎨 기존 졸업작품 탐색 엔진으로 학생 출품작 추출 중...");
    }, 2800);

    try {
      const res = await fetch("/api/cards/analyze-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl.trim(),
          year: year || "2026",
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS" && data.data) {
        const d = data.data;
        if (d.university) setUniversity(d.university);
        if (d.department) setDepartment(d.department);
        if (d.year) setYear(d.year);
        if (d.category) setCategory(d.category);
        if (d.title) {
          setTitle(d.title);
          setIsTitleCustomized(true);
        }
        if (d.slogan) setSlogan(d.slogan);
        if (d.period) setPeriod(d.period);
        if (d.venue) setVenue(d.venue);
        if (d.posterPreview) {
          setPosterPreview(d.posterPreview);
        }
        if (d.tags) setTags(d.tags);
        if (d.artworks && Array.isArray(d.artworks)) {
          setArtworks(d.artworks);
        }
        setAnalyzedEngine(data.engine === "llama_cpp_qwen2.5_vl" ? "Llama.cpp (Qwen2.5-VL)" : "Llama.cpp 기반 엔진");
      } else {
        setErrorMessage(data.error || "Llama.cpp 링크 분석에 실패했습니다.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "서버 통신 중 오류가 발생했습니다.");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsAnalyzing(false);
    }
  };

  // 탐색된 출품작 개별 삭제 핸들러
  const handleRemoveArtwork = (index: number) => {
    setArtworks((prev) => prev.filter((_, i) => i !== index));
  };

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일(PNG, JPG, WebP 등)만 업로드 가능합니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPosterBase64(result);
      setPosterPreview(result);
    };
    reader.readAsDataURL(file);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!university.trim()) {
      setErrorMessage("대학교명을 입력해 주세요.");
      return;
    }
    if (!department.trim()) {
      setErrorMessage("전공/학과명을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        university: university.trim(),
        department: department.trim(),
        year: year.trim(),
        category,
        title: title.trim(),
        slogan: slogan.trim() || `${university.trim()} ${department.trim()} 졸업전시회 공식 아카이브`,
        period: period.trim(),
        venue: venue.trim(),
        targetUrl: targetUrl.trim(),
        tags: tags
          .split(/[,#\s]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        poster_base64: posterBase64,
        poster_image: posterPreview && !posterPreview.startsWith("data:") ? posterPreview : null,
        status: "published",
        artworks: artworks,
      };

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        const worksCountMsg = artworks.length > 0 ? ` (출품작 ${artworks.length}점 포함)` : "";
        alert(`🎉 [${university.trim()} ${department.trim()}] ${year}년 졸업전시회 카드가 성공적으로 등록되었습니다!${worksCountMsg}`);
        if (data.exhibition) {
          onSuccess(data.exhibition);
        }
        onClose();
      } else {
        setErrorMessage(data.error || "카드 추가에 실패했습니다.");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-extrabold text-slate-900 dark:text-white">
                  대학교 졸업전시회 카드 추가
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[11px] font-bold">
                  {year}년 신규 등록
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                관리자 모드에서 전국 주요 대학·학과의 졸업전시회 카드를 아카이브에 즉시 발행합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 폼 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs md:text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center gap-2 text-red-600 dark:text-red-300 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 기존 카드뉴스 정밀 검수 관제 페이지 바로가기 안내 */}
          <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-900 dark:text-cyan-200">
              <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>기존 카드뉴스 검수 관제 페이지에서 리서치 파라미터 자동 채우기 및 출품작 검수를 수행할 수 있습니다.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = `/admin?tab=cardnews&year=${encodeURIComponent(year || '2026')}`;
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shrink-0 transition"
            >
              기존 카드뉴스 검수로 이동 ↗
            </button>
          </div>

          {/* 🌟 로컬 LLM (Qwen2.5-VL) 기반 링크 분석 & 졸업작품 자동 탐색 바 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-purple-500/10 to-cyan-500/10 border border-red-500/30 dark:border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-red-500 dark:text-red-400 animate-pulse" />
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                  설치된 Llama.cpp (Qwen2.5-VL-7B) 자동 분석 & 졸업작품 탐색
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Llama.cpp 엔진 가동
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  placeholder="졸업전시회 웹사이트 링크를 입력하세요 (예: https://graduation.univ.ac.kr)"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={handleAnalyzeLink}
                disabled={isAnalyzing || !targetUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Llama.cpp 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Llama.cpp 자동 채우기 & 작품 탐색</span>
                  </>
                )}
              </button>
            </div>

            {/* 분석 진행 상태 안내 */}
            {isAnalyzing && (
              <div className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5 font-bold animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{analysisStage}</span>
              </div>
            )}

            {analyzedEngine && !isAnalyzing && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>
                  {analyzedEngine} 인식 완료! 대학교·학과·카테고리 및 출품작 {artworks.length}점이 자동 채워졌습니다.
                </span>
              </div>
            )}
          </div>

          {/* 1. 전시 연도 선택 */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-cyan-500" /> 전시 연도 선택
            </label>
            <div className="flex items-center gap-2">
              {["2026", "2025", "2024"].map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setYear(y)}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs transition border ${
                    year === y
                      ? "bg-cyan-600 border-cyan-600 text-white shadow-md shadow-cyan-600/20"
                      : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {y}년도 전시
                </button>
              ))}
            </div>
          </div>

          {/* 2. 대학교 및 학과 입력 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 대학교 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-500" /> 대학교명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="예: 홍익대학교, 서울대"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-900 dark:text-white"
              />
              {/* 대학교 추천 칩 */}
              <div className="flex flex-wrap gap-1 mt-2">
                {UNIVERSITY_PRESETS.slice(0, 8).map((u) => (
                  <button
                    type="button"
                    key={u}
                    onClick={() => setUniversity(u)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* 학과/전공 */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-500" /> 학과 / 전공명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="예: 시각디자인학과, 산업디자인"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-900 dark:text-white"
              />
              {/* 학과 추천 칩 */}
              <div className="flex flex-wrap gap-1 mt-2">
                {DEPARTMENT_PRESETS.slice(0, 6).map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDepartment(d)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition"
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 산업군 / 카테고리 분류 */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-500" /> 산업군 분야 (카테고리)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-900 dark:text-white"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 4. 전시회 타이틀 및 슬로건 */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>전시회 명칭 (타이틀)</span>
                {isTitleCustomized && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsTitleCustomized(false);
                      setTitle(`[${university || "대학교"}] ${year} ${department || "학과"} 졸업전시회`);
                    }}
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    자동 완성으로 되돌리기
                  </button>
                )}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsTitleCustomized(true);
                }}
                placeholder="예: [홍익대] 2026 시각디자인 졸업전시회"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> 슬로건 / 대표 캐치프레이즈
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder="예: AURA: 경계를 넘나드는 차세대 디자인과 인터랙션"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* 5. 전시 일정 및 장소, URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" /> 전시 기간 / 일정
              </label>
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="예: 2026.11.12(화) ~ 11.18(월)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" /> 전시 장소 (오프라인/온라인)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="예: 교내 현대미술관 및 온라인 공식 아카이브"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-sky-500" /> 공식 웹사이트 / 도록 URL
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="예: https://graduation.univ.ac.kr"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* 6. 메인 포스터 이미지 등록 */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-teal-500" /> 메인 포스터 / 대표 이미지
              </span>
              {posterPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setPosterBase64(null);
                    setPosterPreview(null);
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  이미지 삭제
                </button>
              )}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {posterPreview ? (
              <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center group">
                <img
                  src={posterPreview}
                  alt="포스터 미리보기"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-800 font-bold text-xs hover:bg-white shadow"
                  >
                    포스터 변경
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-32 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center cursor-pointer transition text-center p-4"
              >
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  메인 포스터 이미지 파일 업로드
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  클릭하여 이미지 파일을 선택하세요 (미선택 시 공식 프리셋 포스터 자동 적용)
                </p>
              </div>
            )}
          </div>

          {/* 7. 🎨 AI 탐색된 졸업작품 목록 */}
          {artworks.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                    AI 탐색된 졸업작품 목록 ({artworks.length}점 자동 확보)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  카드 등록 시 플랫폼 아카이브에 함께 영구 저장됩니다.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                {artworks.map((art, idx) => (
                  <div
                    key={art.id || idx}
                    className="relative group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex flex-col justify-between overflow-hidden shadow-sm"
                  >
                    {art.imagePath || art.image ? (
                      <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-900 mb-1.5 flex items-center justify-center">
                        <img
                          src={art.imagePath || art.image}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1.5 flex items-center justify-center text-[10px] text-slate-400">
                        이미지 없음
                      </div>
                    )}
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={art.title}>
                      {art.title}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between mt-0.5">
                      <span>{art.author || `${university || "학생"} 작가`}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveArtwork(idx)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition text-[10px] font-bold"
                        title="출품작 제거"
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. 태그 */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-500" /> 검색 태그 (쉼표로 구분)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="예: 2026졸전, 시각디자인, 인터랙션, UX/UI, 졸업작품"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold shadow-lg shadow-red-600/20 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>카드 생성 및 발행 중...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {year}년 대학교 카드 추가 및 즉시 발행{artworks.length > 0 ? ` (출품작 ${artworks.length}점 포함)` : ""}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
