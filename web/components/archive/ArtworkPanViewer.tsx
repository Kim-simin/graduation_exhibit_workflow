'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  AlignJustify,
  Download,
  ExternalLink,
  Move,
  Loader2
} from 'lucide-react';
import type { Artwork } from '@/lib/get-exhibitions';
import { mediaUrl } from '@/lib/archive';

export interface ArtworkPanViewerProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: Artwork[];
  initialIndex?: number;
  university?: string;
  department?: string;
}

export default function ArtworkPanViewer({
  isOpen,
  onClose,
  artworks,
  initialIndex = 0,
  university,
  department
}: ArtworkPanViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'reset'>('width');

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPanRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);

  // 현재 작품
  const currentArt = artworks[currentIndex] || artworks[0];
  const originalSrc = currentArt
    ? currentArt.original_image_url || currentArt.imagePath
    : '';

  // 인덱스 동기화 및 뷰포트 맞춤 초기화
  const resetToFitWidth = useCallback(() => {
    if (!viewportRef.current || !imgRef.current) return;
    const vp = viewportRef.current;
    const img = imgRef.current;
    const nw = img.naturalWidth || 1200;
    const nh = img.naturalHeight || 1200;
    const vpWidth = vp.clientWidth;
    const vpHeight = vp.clientHeight;

    // 가로 폭을 뷰포트 너비의 92% (최대 1100px)에 맞춤
    const targetWidth = Math.min(vpWidth * 0.92, 1100);
    const fitScale = targetWidth / nw;
    const scaledHeight = nh * fitScale;

    setScale(fitScale);
    setFitMode('width');

    // 긴 세로형 작품: 이미지 상단이 뷰포트 상단(약 20px 패딩)에 위치하도록 설정
    if (scaledHeight > vpHeight) {
      const topOffset = (scaledHeight - vpHeight) / 2 + 30;
      setPan({ x: 0, y: topOffset });
    } else {
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const resetToFitPage = useCallback(() => {
    if (!viewportRef.current || !imgRef.current) return;
    const vp = viewportRef.current;
    const img = imgRef.current;
    const nw = img.naturalWidth || 1200;
    const nh = img.naturalHeight || 1200;
    const vpWidth = vp.clientWidth * 0.92;
    const vpHeight = vp.clientHeight * 0.92;

    const scaleX = vpWidth / nw;
    const scaleY = vpHeight / nh;
    const fitScale = Math.min(scaleX, scaleY, 1);

    setScale(fitScale);
    setPan({ x: 0, y: 0 });
    setFitMode('page');
  }, []);

  const resetOriginal = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setFitMode('reset');
  }, []);

  // 모달 열릴 때 & 인덱스 변경 시 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, artworks.length - 1)));
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, initialIndex, artworks.length]);

  // 이미지 로드 완료 시 기본 Fit Width 적용
  const handleImageLoaded = () => {
    setIsLoading(false);
    setHasError(false);
    resetToFitWidth();
  };

  // 바디 스크롤 차단
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // 키보드 내비게이션
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetToFitWidth();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, artworks.length, currentIndex, onClose, resetToFitWidth]);

  const handlePrev = useCallback(() => {
    if (artworks.length <= 1) return;
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : artworks.length - 1));
  }, [artworks.length]);

  const handleNext = useCallback(() => {
    if (artworks.length <= 1) return;
    setIsLoading(true);
    setHasError(false);
    setCurrentIndex(prev => (prev < artworks.length - 1 ? prev + 1 : 0));
  }, [artworks.length]);

  // Zoom 핸들러
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.3, 4.0));
  };
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev * 0.7, 0.08));
  };

  // 휠 줌 핸들러
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setScale(prev => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(next, 0.08), 4.0);
    });
  };

  // Pointer Drag-to-Pan (마우스 및 싱글 터치 통합)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);

    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialPanRef.current = { ...pan };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    setPan({
      x: initialPanRef.current.x + dx,
      y: initialPanRef.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      const el = e.currentTarget as HTMLElement;
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // 모바일 핀치 줌 (터치 2개 제스처 지원)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDistRef.current;
      setScale(Math.min(Math.max(pinchStartScaleRef.current * ratio, 0.08), 4.0));
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
  };

  if (!isOpen || artworks.length === 0 || !currentArt) return null;

  const imgSrc = mediaUrl(originalSrc);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Behance 스타일 작품 원본 뷰어"
      className="fixed inset-0 z-[120] bg-neutral-950/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* 1. 상단 컨트롤 바 */}
      <header
        className="w-full flex items-center justify-between px-3 sm:px-6 py-2.5 bg-neutral-900/80 backdrop-blur-md border-b border-white/10 z-30"
        onClick={e => e.stopPropagation()}
      >
        {/* 좌측: 순번 뱃지 & 작품 제목/작가 */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shrink-0">
            #{currentIndex + 1} / {artworks.length}
          </span>
          <div className="truncate text-xs sm:text-sm text-gray-200">
            <span className="font-bold text-white mr-1.5">{currentArt.title}</span>
            <span className="text-gray-400">· {currentArt.author}</span>
            {(currentArt.department || department) && (
              <span className="hidden sm:inline text-xs text-emerald-400 ml-2 font-mono">
                [{currentArt.department || department}]
              </span>
            )}
          </div>
        </div>

        {/* 우측 도구: 뷰 모드(Fit Width, Fit Page, Zoom, 닫기) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 화면 너비 맞춤 (Fit Width) */}
          <button
            type="button"
            onClick={resetToFitWidth}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
              fitMode === 'width'
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                : 'bg-white/10 border-white/10 text-gray-300 hover:bg-white/20'
            }`}
            title="화면 너비 맞춤 (긴 작품 읽기 모드)"
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span className="hidden md:inline">너비 맞춤</span>
          </button>

          {/* 전체 맞춤 (Fit Page) */}
          <button
            type="button"
            onClick={resetToFitPage}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
              fitMode === 'page'
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                : 'bg-white/10 border-white/10 text-gray-300 hover:bg-white/20'
            }`}
            title="전체 이미지 한눈에 보기"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">전체 맞춤</span>
          </button>

          {/* 줌 인/아웃 */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition"
            title="확대 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition"
            title="축소 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* 원본 복귀 */}
          <button
            type="button"
            onClick={resetOriginal}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition hidden sm:inline-flex"
            title="원래 배율 (100%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* 새 탭 원본 */}
          <a
            href={imgSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition flex items-center"
            title="새 탭에서 원본 이미지 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-red-500 text-gray-200 hover:text-white transition ml-1"
            title="닫기 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. 메인 Drag-to-Pan 뷰포트 영역 */}
      <main
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 w-full h-full overflow-hidden select-none flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* 드래그 탐색 안내 힌트 뱃지 */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 flex items-center gap-1.5 shadow-lg">
          <Move className="w-3.5 h-3.5 text-emerald-400" />
          <span>마우스 드래그로 이동 · 휠로 확대/축소</span>
        </div>

        {/* 이전 작품 버튼 (좌측) */}
        {artworks.length > 1 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 z-30 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-emerald-600 text-white border border-white/20 hover:border-emerald-400 shadow-2xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
            title="이전 작품 (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* 로딩 인디케이터 */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-400 gap-3 z-10 pointer-events-none">
            <Loader2 className="w-9 h-9 animate-spin" />
            <span className="text-xs font-mono font-medium tracking-wide text-gray-300">
              고화질 원본 로딩 중...
            </span>
          </div>
        )}

        {/* 오류 안내 */}
        {hasError && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-neutral-900/80 rounded-2xl border border-white/10 text-gray-300 max-w-md z-10">
            <h4 className="text-sm font-bold text-white mb-2">이미지를 불러올 수 없습니다</h4>
            <p className="text-xs text-gray-400 mb-4 break-all">{imgSrc}</p>
            <a
              href={imgSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> 직접 열기
            </a>
          </div>
        )}

        {/* 드래그 및 줌 변환 캔버스 레이어 */}
        {!hasError && (
          <div
            className="transform-gpu will-change-transform"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            <img
              ref={imgRef}
              key={imgSrc}
              src={imgSrc}
              alt={currentArt.title}
              onLoad={handleImageLoaded}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              draggable={false}
              className={`max-w-none shadow-2xl select-none pointer-events-none ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              style={{
                display: 'block'
              }}
            />
          </div>
        )}

        {/* 다음 작품 버튼 (우측) */}
        {artworks.length > 1 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 z-30 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-emerald-600 text-white border border-white/20 hover:border-emerald-400 shadow-2xl backdrop-blur-sm transition-all hover:scale-110 active:scale-95 cursor-pointer"
            title="다음 작품 (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </main>

      {/* 3. 하단 작품 정보 및 캡션 바 */}
      <footer
        className="w-full bg-neutral-900/90 backdrop-blur-md border-t border-white/10 px-4 sm:px-8 py-3 z-30"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white truncate max-w-xl">
                {currentArt.title || '출품작'}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">
                {currentArt.author || '작가'}
              </span>
              {(currentArt.department || department) && (
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium">
                  {currentArt.department || department}
                </span>
              )}
            </div>

            {currentArt.description && (
              <p className="text-xs text-gray-300 max-h-14 overflow-y-auto leading-relaxed pr-2">
                {currentArt.description}
              </p>
            )}
          </div>

          <div className="text-[11px] text-gray-400 shrink-0 flex items-center gap-2 font-mono">
            <span className="hidden sm:inline">단축키:</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">←/→</kbd>
            <span className="hidden sm:inline text-gray-500">작품 이동</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">+/-</kbd>
            <span className="hidden sm:inline text-gray-500">확대</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">0</kbd>
            <span className="hidden sm:inline text-gray-500">너비 맞춤</span>
            <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-300 border border-white/10">Esc</kbd>
            <span className="hidden sm:inline text-gray-500">닫기</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
