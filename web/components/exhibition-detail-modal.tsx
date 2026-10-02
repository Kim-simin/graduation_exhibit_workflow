"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Layers,
  Sparkles,
  Building2,
  Briefcase,
  ShieldCheck,
  Maximize2,
  Share2,
  Check,
  ClipboardPaste,
} from "lucide-react";
import { Exhibition, Artwork } from "@/lib/get-exhibitions";
import { isArtworkZoomDisabled } from "@/src/utils/categoryMapper";
import { ArtworkLightboxModal } from "./artwork-lightbox-modal";

interface ExhibitionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition | null;
}

export function ExhibitionDetailModal({
  isOpen,
  onClose,
  exhibition,
}: ExhibitionDetailModalProps) {
  // 모달 내부 상태 관리
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number | null>(null);
  const [isPosterLightboxOpen, setIsPosterLightboxOpen] = useState(false);
  const [showCorporateReport, setShowCorporateReport] = useState(false);

  // 상단 링크공유 패널 상태
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedArtworkIndex !== null) {
          setSelectedArtworkIndex(null);
        } else if (isPosterLightboxOpen) {
          setIsPosterLightboxOpen(false);
        } else if (isSharePanelOpen) {
          setIsSharePanelOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, selectedArtworkIndex, isPosterLightboxOpen, isSharePanelOpen, onClose]);

  if (!isOpen || !exhibition) return null;

  const {
    id,
    university,
    department,
    year = "2025",
    category,
    title,
    headline,
    curationIntro,
    period,
    venue,
    targetUrl,
    posterPath,
  } = exhibition;

  const artworks: Artwork[] = exhibition.artworks || exhibition.works || [];

  // 공학·IT 계열 확대 비활성화 정책 적용 (MANDATORY RULE 4)
  const isZoomDisabled = isArtworkZoomDisabled(exhibition);

  // 공유 링크 헬퍼
  const getModalShareUrl = () => {
    return targetUrl && targetUrl.startsWith("http")
      ? targetUrl
      : typeof window !== "undefined"
      ? `${window.location.origin}/exhibit/${encodeURIComponent(id)}`
      : "";
  };

  const handleCopyModalUrl = async () => {
    const url = getModalShareUrl();
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2500);
    } catch (e) {
      console.error("클립보드 복사 실패:", e);
    }
  };

  const handleModalNativeShare = async () => {
    const url = getModalShareUrl();
    if (!url) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `[${university}] ${title}`,
          text: `${university} ${department} 온라인 졸업전시를 확인해보세요!`,
          url,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") console.error(err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 바 */}
        <div className="z-20 px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 shrink-0">
              {category}
            </span>
            <div className="min-w-0 flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold truncate text-slate-900 dark:text-white">
                {university} {department} {year}년도 졸업전시회
              </h2>
              {targetUrl && (
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-cyan-500 transition shrink-0"
                  title="공식 웹사이트 열기"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* 우측 액션 버튼 그룹 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 온라인 전시 링크공유 버튼 */}
            <button
              type="button"
              onClick={() => setIsSharePanelOpen(!isSharePanelOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0 ${
                isSharePanelOpen
                  ? "bg-cyan-600 text-white shadow-cyan-500/25"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400"
              }`}
              title="해당 대학교 온라인 전시 링크공유"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
              <span>링크공유</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 상단 '링크공유' 오버레이 패널 */}
        {isSharePanelOpen && (
          <div className="z-30 px-6 py-4 bg-cyan-50/95 dark:bg-cyan-950/90 border-b border-cyan-300 dark:border-cyan-800/80 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-cyan-600 text-white">
                  <Share2 className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200">
                  온라인 전시 링크 공유
                </span>
                <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400">
                  [{university}] {title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSharePanelOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="패널 닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-cyan-300 dark:border-cyan-700 rounded-xl px-3 py-1.5 flex items-center">
                <input
                  type="text"
                  readOnly
                  value={getModalShareUrl()}
                  className="w-full bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 outline-none select-all truncate"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyModalUrl}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shrink-0 ${
                  isLinkCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-cyan-600 hover:bg-cyan-700 text-white active:scale-95"
                }`}
              >
                {isLinkCopied ? (
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
              {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                <button
                  type="button"
                  onClick={handleModalNativeShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 hover:bg-cyan-200 dark:hover:bg-cyan-800 text-cyan-800 dark:text-cyan-200 text-xs font-bold transition"
                  title="기기 공유창 열기"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>기기 공유</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 모달 스크롤 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8">
          {/* 상단 2열 정보 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* 좌측: 메인 공식 포스터 */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div
                onClick={() => {
                  if (posterPath) {
                    setIsPosterLightboxOpen(true);
                  }
                }}
                className={`relative aspect-[9/16] w-full max-w-[280px] rounded-2xl overflow-hidden bg-slate-900/90 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg group flex items-center justify-center ${
                  posterPath ? "cursor-pointer hover:border-cyan-500 hover:ring-2 hover:ring-cyan-500/30 transition-all" : ""
                }`}
                title={posterPath ? "클릭하여 메인 포스터 고화질 확인" : undefined}
              >
                {posterPath ? (
                  <img
                    src={`/api/images/${posterPath}`}
                    alt={title}
                    className="w-full h-full object-cover object-center transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <span className="text-xs">등록된 포스터 이미지가 없습니다</span>
                  </div>
                )}

                {/* 포스터 고화질 확대 힌트 오버레이 */}
                {posterPath && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                    <span className="px-3 py-1.5 rounded-full bg-cyan-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                      <Maximize2 className="w-3.5 h-3.5" /> 고화질 포스터 확대
                    </span>
                  </div>
                )}
              </div>

              {/* 공식 아카이브 웹사이트 바로가기 버튼 */}
              {targetUrl && (
                <div className="w-full max-w-[280px] mt-3">
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-500/20 transition-all"
                    title="공식 아카이브 웹사이트 새 창으로 열기"
                  >
                    <span>공식 아카이브 웹사이트 바로가기</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* 우측: 전시 상세 메타데이터 */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block mb-1">
                  {university} · {department}
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {title}
                </h3>
                {headline && headline !== title && (
                  <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {headline}
                  </p>
                )}
              </div>

              {/* 전시 본문 전체 설명글 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>전시 기획 서문 및 큐레이션 소개</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed md:leading-loose whitespace-pre-line break-words font-normal">
                  {curationIntro || exhibition.description || "등록된 상세 소개글이 없습니다."}
                </p>
              </div>

              {/* 일정 및 장소 정보 카드 */}
              <div className="pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">전시 기간 / 공식 일정</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono break-words">{period || "공식 일정 확인 필요"}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 block mb-0.5">전시 장소 / 오프라인 위치</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{venue || "장소 미정"}</span>
                    </div>
                  </div>
                </div>
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
                    {(exhibition.cooperationCompanies || []).map((comp: any, idx) => {
                      const compName = typeof comp === "string" ? comp : comp?.company_name || comp?.name || String(comp);
                      return (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-bold shadow-2xs"
                        >
                          🏢 {compName}
                        </span>
                      );
                    })}
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

          {/* 하단: 출품작 갤러리 그리드 영역 (기존 5088615 3열 레이아웃 완벽 복원) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                출품작 갤러리 ({artworks.length}점)
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isZoomDisabled ? "" : "* 카드를 클릭하면 고화질 이미지를 확인할 수 있습니다."}
              </span>
            </div>

            {artworks.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {artworks.map((art, idx) => {
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!isZoomDisabled) {
                          setSelectedArtworkIndex(idx);
                        }
                      }}
                      className={`relative group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm transition-all duration-200 flex flex-col ${
                        isZoomDisabled
                          ? "cursor-default border border-slate-200 dark:border-slate-800"
                          : "cursor-pointer hover:border-cyan-500 hover:shadow-lg border border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {/* 순서 번호 배지 */}
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-white text-[11px] font-mono font-bold select-none">
                        #{idx + 1}
                      </div>

                      {/* 작품 이미지 영역 */}
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center select-none">
                        <img
                          src={
                            art.imagePath.startsWith("http")
                              ? art.imagePath
                              : `/api/images/${art.imagePath}`
                          }
                          alt={art.title}
                          className={`w-full h-full object-cover transition duration-500 select-none pointer-events-none ${
                            isZoomDisabled ? "" : "group-hover:scale-105"
                          }`}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />

                        {/* 고화질 확대 오버레이 안내 */}
                        {!isZoomDisabled && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-10">
                            <span className="px-3 py-1.5 rounded-full bg-cyan-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                              <Maximize2 className="w-3.5 h-3.5" /> 고화질 확대
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 작품 메타데이터 및 상세 설명 (RULE 1: 상세 학과명 우선 배지 표시) */}
                      <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-1 mb-1">
                            <span
                              className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-medium truncate max-w-full"
                              title={art.department || department}
                            >
                              {(art.department || department)} #{idx + 1}
                            </span>
                            <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                              {art.author}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-gray-200 mt-1 mb-0.5 line-clamp-1 sm:line-clamp-2">
                            {art.title}
                          </h4>
                          {art.description && (
                            <p className="text-[9px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                              {art.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                등록된 상세 작품 에셋이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 개별 출품작 고화질 뷰어 라이트박스 */}
        <ArtworkLightboxModal
          isOpen={selectedArtworkIndex !== null && !isZoomDisabled}
          onClose={() => setSelectedArtworkIndex(null)}
          artworks={artworks}
          initialIndex={selectedArtworkIndex ?? 0}
          university={university}
          department={department}
        />

        {/* 메인 포스터 고화질 뷰어 */}
        {posterPath && (
          <ArtworkLightboxModal
            isOpen={isPosterLightboxOpen}
            onClose={() => setIsPosterLightboxOpen(false)}
            artworks={[
              {
                title: `${university} ${department} 메인 공식 포스터`,
                author: `${university} ${department}`,
                role: "공식 전시 포스터",
                imagePath: posterPath,
                description: curationIntro || headline || "",
              },
            ]}
            initialIndex={0}
            university={university}
            department={department}
          />
        )}
      </div>
    </div>
  );
}
