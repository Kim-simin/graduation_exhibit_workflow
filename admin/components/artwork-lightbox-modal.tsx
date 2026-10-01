"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Artwork } from "@/lib/get-exhibitions";

export interface ArtworkLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: Artwork[];
  initialIndex?: number;
  university?: string;
  department?: string;
}

export function ArtworkLightboxModal({
  isOpen,
  onClose,
  artworks,
  initialIndex = 0,
  university,
  department,
}: ArtworkLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Sync initialIndex when modal opens or index changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, artworks.length - 1)));
      setIsZoomed(false);
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, initialIndex, artworks.length]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (artworks.length <= 1) return;
    setIsZoomed(false);
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : artworks.length - 1));
  }, [artworks.length]);

  const handleNext = useCallback(() => {
    if (artworks.length <= 1) return;
    setIsZoomed(false);
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex((prev) => (prev < artworks.length - 1 ? prev + 1 : 0));
  }, [artworks.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "z" || e.key === "Z") {
        setIsZoomed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || artworks.length === 0) return null;

  const currentArt = artworks[currentIndex] || artworks[0];
  const imageSrc = currentArt.imagePath.startsWith("http")
    ? currentArt.imagePath
    : `/api/images/${currentArt.imagePath}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="고화질 작품 뷰어"
      className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 1. 상단 컨트롤 바 */}
      <header
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/70 backdrop-blur-sm border-b border-white/10 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 좌측 정보: 대학/학과명 및 순번 뱃지 */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold shrink-0">
            #{currentIndex + 1} / {artworks.length}
          </span>
          <div className="truncate text-xs sm:text-sm text-gray-300">
            {university && <span className="font-semibold text-white">{university} </span>}
            {department && <span className="text-gray-400">{department}</span>}
          </div>
        </div>

        {/* 우측 도구: 줌 토글, 새 탭 열기, 다운로드, 닫기 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 원본 배율 줌 토글 */}
          <button
            type="button"
            onClick={() => setIsZoomed((prev) => !prev)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition"
            title={isZoomed ? "화면에 맞추기 (Z)" : "원본 크기로 확대 (Z)"}
          >
            {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* 새 탭에서 원본 보기 */}
          <a
            href={imageSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition flex items-center gap-1 text-xs font-medium"
            title="새 탭에서 원본 이미지 열기"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline">새 탭 원본</span>
          </a>

          {/* 다운로드 버튼 */}
          <a
            href={imageSrc}
            download={`${currentArt.title || "artwork"}.png`}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition"
            title="고화질 이미지 다운로드"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-500/80 text-gray-200 hover:text-white transition ml-1"
            title="닫기 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. 중앙 메인 이미지 뷰어 영역 */}
      <main
        className="relative flex-1 flex items-center justify-center overflow-auto p-2 sm:p-6"
        onClick={(e) => {
          // Clicking outer background closes; clicking image toggles zoom
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* 이전 작품 버튼 (좌측) */}
        {artworks.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-cyan-600 text-white border border-white/20 hover:border-cyan-400 shadow-xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
            title="이전 작품 (←)"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}

        {/* 로딩 인디케이터 */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-cyan-400 gap-3 z-10 pointer-events-none">
            <Loader2 className="w-10 h-10 animate-spin" />
            <span className="text-xs font-mono font-bold tracking-wider text-gray-300">
              고화질 이미지 로딩 중...
            </span>
          </div>
        )}

        {/* 오류 안내 */}
        {hasError && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 text-gray-300 max-w-md z-10">
            <ImageIcon className="w-12 h-12 mb-3 text-red-400 opacity-80" />
            <h4 className="text-sm font-bold text-white mb-1">이미지를 불러올 수 없습니다</h4>
            <p className="text-xs text-gray-400 mb-4 break-all">{imageSrc}</p>
            <a
              href={imageSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> 직접 열기 시도
            </a>
          </div>
        )}

        {/* 고화질 작품 이미지 본체 */}
        {!hasError && (
          <div
            className={`transition-all duration-300 flex items-center justify-center ${
              isZoomed ? "min-w-full min-h-full cursor-zoom-out" : "max-w-full max-h-full cursor-zoom-in"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed((prev) => !prev);
            }}
          >
            <img
              key={imageSrc}
              src={imageSrc}
              alt={currentArt.title}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className={`rounded-lg shadow-2xl transition-all duration-200 select-none ${
                isZoomed
                  ? "max-w-none w-auto h-auto scale-100 object-none"
                  : "max-h-[72vh] max-w-[88vw] object-contain"
              } ${isLoading ? "opacity-0" : "opacity-100"}`}
              style={{
                imageRendering: "auto",
              }}
            />
          </div>
        )}

        {/* 다음 작품 버튼 (우측) */}
        {artworks.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-cyan-600 text-white border border-white/20 hover:border-cyan-400 shadow-xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
            title="다음 작품 (→)"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        )}
      </main>

      {/* 3. 하단 캡션 정보 및 단축키 안내 바 */}
      <footer
        className="w-full bg-black/85 backdrop-blur-md border-t border-white/10 px-4 sm:px-8 py-3.5 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xl">
                {currentArt.title || "무제"}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium">
                {currentArt.author || "작가 미상"}
              </span>
              {(currentArt.department || department) && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium">
                  {currentArt.department || department}
                </span>
              )}
              {currentArt.role && (
                <span className="text-xs text-gray-400 font-mono">
                  · {currentArt.role}
                </span>
              )}
            </div>

            {currentArt.description && (
              <p className="text-xs text-gray-300 max-h-16 overflow-y-auto leading-relaxed pr-2">
                {currentArt.description}
              </p>
            )}
          </div>

          <div className="text-[11px] text-gray-400 shrink-0 flex items-center gap-2.5 font-mono">
            <span className="hidden sm:inline">단축키:</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">→</kbd>
            <span className="hidden sm:inline text-gray-500">작품 이동</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">Z</kbd>
            <span className="hidden sm:inline text-gray-500">확대/축소</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">Esc</kbd>
            <span className="hidden sm:inline text-gray-500">닫기</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
