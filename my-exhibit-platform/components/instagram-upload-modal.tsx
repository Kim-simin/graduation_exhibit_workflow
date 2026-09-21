"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import {
  X,
  Instagram,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Layers,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Exhibition } from "@/lib/get-exhibitions";
import { generateInstagramCaption } from "@/lib/instagram-caption";

interface InstagramUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition | null;
  onSuccess?: (cardId: string, publishedAt: string) => void;
  isCooldownActive?: boolean;
  cooldownRemaining?: number;
}

export function InstagramUploadModal({
  isOpen,
  onClose,
  exhibition,
  onSuccess,
  isCooldownActive,
  cooldownRemaining = 0,
}: InstagramUploadModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [publishStatus, setPublishStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 슬라이드 목록 동적 바인딩 (1번: 메인 공식 포스터, 2~10번: 재정렬된 순서의 앞선 9개 출품작)
  const slides: { title: string; subtitle: string; imagePath: string }[] = useMemo(() => {
    const list: { title: string; subtitle: string; imagePath: string }[] = [];
    if (!exhibition) return list;

    // 1번 슬라이드: 메인 공식 포스터 (고정)
    if (exhibition.posterPath) {
      list.push({
        title: "메인 공식 포스터",
        subtitle: `${exhibition.university} ${exhibition.department}`,
        imagePath: exhibition.posterPath,
      });
    }

    // 2~10번 슬라이드: 재배치된 출품작 중 상위 9개
    const artworks = (exhibition.artworks && Array.isArray(exhibition.artworks))
      ? exhibition.artworks
      : ((exhibition as any).works && Array.isArray((exhibition as any).works))
      ? (exhibition as any).works
      : [];

    const maxArtworks = Math.min(artworks.length, 10 - list.length);
    for (let i = 0; i < maxArtworks; i++) {
      const art = artworks[i];
      const img = art.imagePath || (art as any).imageUrl || (art as any).image || "";
      list.push({
        title: art.title || `작품 #${i + 1}`,
        subtitle: art.author || (art as any).student_name || `${exhibition.university} 출품작`,
        imagePath: img,
      });
    }

    return list;
  }, [exhibition?.posterPath, exhibition?.artworks, (exhibition as any)?.works]);

  // 기본 캡션 초기화 및 출품작 순서 변경 시 자동 동기화
  useEffect(() => {
    if (!exhibition) return;

    // 리서치 메타데이터 및 재정렬된 출품작 명단 100% 실시간 반영
    const generated = generateInstagramCaption(exhibition);
    setCaption(generated);
  }, [
    exhibition,
    exhibition?.artworks,
    (exhibition as any)?.works,
    exhibition?.posterPath,
    exhibition?.targetUrl,
  ]);

  // 모달 오픈 시 진행상태 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setPublishStatus("idle");
      setErrorMessage("");
      setProgress(0);
      setCurrentStep(0);
      setStatusMessage("");
    }
  }, [isOpen]);

  // 상태 폴링 이펙트
  useEffect(() => {
    if (!jobId || publishStatus !== "running") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/publish/instagram/status?jobId=${jobId}`);
        if (!res.ok) throw new Error("상태 조회 실패");
        const data = await res.json();

        if (data.progress !== undefined) setProgress(data.progress);
        if (data.step !== undefined) setCurrentStep(data.step);
        if (data.message) setStatusMessage(data.message);

        if (data.status === "completed") {
          setPublishStatus("completed");
          setIsPublishing(false);
          if (onSuccess && exhibition) {
            onSuccess(exhibition.id, data.publishedAt || new Date().toISOString());
          }
          clearInterval(interval);
        } else if (data.status === "error") {
          setPublishStatus("error");
          setErrorMessage(data.message || "발행 중 오류가 발생했습니다.");
          setIsPublishing(false);
          clearInterval(interval);
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, publishStatus, exhibition, onSuccess]);

  if (!isOpen || !exhibition) return null;

  const handleStartPublish = async () => {
    if (isCooldownActive) {
      alert(`연속 발행 방지 쿨다운 중입니다 (${cooldownRemaining}초 남음). 잠시 후 다시 시도해주세요.`);
      return;
    }
    if (slides.length === 0) {
      alert("업로드할 이미지가 없습니다.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus("running");
    setProgress(10);
    setCurrentStep(1);
    setStatusMessage("발행 요청 등록 중...");
    setErrorMessage("");

    try {
      const res = await fetch("/api/publish/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: exhibition.id,
          university: exhibition.university,
          department: exhibition.department,
          year: exhibition.year || "2025",
          caption: caption.trim(),
          slides: slides.map((s) => s.imagePath),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "발행 요청 처리에 실패했습니다.");
      }

      setJobId(data.jobId);
    } catch (err: any) {
      setIsPublishing(false);
      setPublishStatus("error");
      setErrorMessage(err.message || "네트워크 통신 오류가 발생했습니다.");
    }
  };

  const stepsList = [
    { num: 1, label: "1080x1080 여백 보정 (Pillow)" },
    { num: 2, label: "로컬 크롬 프로필 및 세션 구동" },
    { num: 3, label: "캐러셀 슬라이드 일괄 첨부" },
    { num: 4, label: "인간 모사 캡션 작성 (30~80ms)" },
    { num: 5, label: "피드 발행 완료" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-sm animate-fadeIn"
      onClick={() => {
        if (!isPublishing) onClose();
      }}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Instagram className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">인스타그램 캐러셀 피드 자동 발행</h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 5대 병목 사전 방어형
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {exhibition.university} · {exhibition.department} ({exhibition.year || "2025"})
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isPublishing}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디: 좌측 프리뷰(1:1 레터박스) + 우측 캡션/상태 제어 */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
          {/* 좌측: 1:1 슬라이드 캐러셀 프리뷰 */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Layers className="w-4 h-4 text-rose-500" />
                <span>1080x1080 레터박스 프리뷰</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                총 {slides.length}장 슬라이드 (10장 이내)
              </span>
            </div>

            {/* 1:1 정방형 캔버스 프레임 (#fafafa soft-white) */}
            <div className="relative w-full aspect-square rounded-xl bg-[#fafafa] dark:bg-slate-900 border border-slate-300 dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
              {slides.length > 0 && slides[currentSlideIndex] ? (
                <img
                  src={`/api/images/${slides[currentSlideIndex].imagePath}`}
                  alt={slides[currentSlideIndex].title}
                  className="max-w-full max-h-full object-contain drop-shadow-sm transition-all duration-300"
                />
              ) : (
                <div className="text-xs text-slate-400">이미지가 없습니다</div>
              )}

              {/* 슬라이드 넘김 화살표 */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* 현재 슬라이드 번호 뱃지 */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono backdrop-blur-sm">
                {currentSlideIndex + 1} / {slides.length}
              </div>

              {/* 현재 슬라이드 제목 */}
              {slides[currentSlideIndex] && (
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/70 text-white text-xs backdrop-blur-sm max-w-[240px] truncate">
                  {slides[currentSlideIndex].title}
                </div>
              )}
            </div>

            {/* 썸네일 스트립 */}
            <div className="w-full flex items-center gap-2 mt-3 overflow-x-auto pb-2 scrollbar-thin">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg bg-[#fafafa] dark:bg-slate-900 border-2 overflow-hidden transition ${
                    currentSlideIndex === idx
                      ? "border-rose-500 ring-2 ring-rose-500/30"
                      : "border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={`/api/images/${s.imagePath}`}
                    alt={s.title}
                    className="w-full h-full object-contain p-0.5"
                  />
                  <span className="absolute top-0.5 left-0.5 px-1 bg-black/70 text-[9px] text-white rounded font-mono">
                    {idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 우측: 캡션 편집 및 발행 제어 */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>인스타그램 피드 캡션 (문구 편집 가능)</span>
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {caption.length}자
                </span>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={isPublishing}
                rows={11}
                className="w-full p-3.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none font-sans leading-relaxed text-slate-800 dark:text-slate-200"
                placeholder="인스타그램에 발행될 캡션 문구를 입력하세요..."
              />

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                💡 <span className="font-semibold text-rose-500">인간 모사 지터 타이핑</span>: 본문에 입력된 캡션은 Playwright 브라우저를 통해 글자당 30~80ms의 무작위 지터 속도로 자연스럽게 작성됩니다.
              </p>
            </div>

            {/* 진행 단계 & 진행률 인디케이터 (발행 중 또는 완료 상태) */}
            {publishStatus !== "idle" && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    {publishStatus === "running" && (
                      <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                    )}
                    {publishStatus === "completed" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    {publishStatus === "error" && (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                    <span>
                      {publishStatus === "running" && "자동 발행 진행 중..."}
                      {publishStatus === "completed" && "피드 발행 성공!"}
                      {publishStatus === "error" && "발행 실패"}
                    </span>
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    {progress}%
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-500 ${
                      publishStatus === "completed"
                        ? "bg-emerald-500"
                        : publishStatus === "error"
                        ? "bg-red-500"
                        : "bg-gradient-to-r from-rose-500 to-purple-600"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                  {statusMessage || "작업을 준비하고 있습니다..."}
                </p>

                {/* 스텝 리스트 */}
                <div className="space-y-1">
                  {stepsList.map((step) => {
                    const isDone = currentStep > step.num || publishStatus === "completed";
                    const isCurrent = currentStep === step.num && publishStatus === "running";
                    return (
                      <div
                        key={step.num}
                        className={`flex items-center gap-2 text-[11px] ${
                          isDone
                            ? "text-emerald-600 dark:text-emerald-400 font-medium"
                            : isCurrent
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-slate-400 dark:text-slate-600"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                        )}
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {publishStatus === "error" && errorMessage && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* 쿨다운 알림 */}
            {isCooldownActive && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse flex-shrink-0" />
                <span>
                  연속 발행 방지 쿨다운 중: <strong>{cooldownRemaining}초</strong> 후 새 피드를 발행할 수 있습니다.
                </span>
              </div>
            )}

            {/* 하단 액션 버튼 */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isPublishing}
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition disabled:opacity-50"
              >
                {publishStatus === "completed" ? "닫기" : "취소"}
              </button>

              {publishStatus !== "completed" && (
                <button
                  type="button"
                  disabled={isPublishing || isCooldownActive || slides.length === 0}
                  onClick={handleStartPublish}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg shadow-rose-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>발행 진행 중...</span>
                    </>
                  ) : isCooldownActive ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>쿨다운 대기 중 ({cooldownRemaining}s)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>🚀 인스타그램 피드 발행 시작</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
