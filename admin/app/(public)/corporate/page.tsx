"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getCorporateData } from "@/lib/data";
import { CorporateRFP, IPFreePassItem } from "@/types";
import {
  Briefcase,
  Sparkles,
  ShieldCheck,
  Calendar,
  Award,
  Download,
  CheckCircle2,
  FileCheck,
  ExternalLink,
  Layers,
  Palette,
  Box,
  Type,
  FileText,
  Lock,
  ArrowRight,
  Info,
  X,
  Check,
} from "lucide-react";

export default function CorporatePage() {
  const corporateData = getCorporateData();
  const rfpList = corporateData.rfp_list || [];
  const ipList = corporateData.ip_freepass_list || [];

  // Modal State for Brand Asset Download
  const [selectedAsset, setSelectedAsset] = useState<IPFreePassItem | null>(null);
  const [agreedToLicense, setAgreedToLicense] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleOpenDownload = (asset: IPFreePassItem) => {
    setSelectedAsset(asset);
    setAgreedToLicense(false);
    setDownloadSuccess(false);
    setIsDownloading(false);
  };

  const handleCloseModal = () => {
    setSelectedAsset(null);
    setDownloadSuccess(false);
    setIsDownloading(false);
  };

  const handleConfirmDownload = () => {
    if (!agreedToLicense) return;
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
    }, 1000);
  };

  return (
    <div className="min-w-0 w-full px-4 md:px-8 lg:px-12 py-8 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      {/* 1. 상단 히어로 헤더 */}
      <div className="mb-10 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Corporate Collaboration & Open IP Hub</span>
          </div>

          {/* 섹션 빠른 이동 앵커 바 */}
          <div className="flex items-center gap-2 text-xs">
            <a
              href="#section-rfp"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition"
            >
              🎯 산학 협력 과제 (RFP)
            </a>
            <a
              href="#section-ip"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition"
            >
              🏷️ 브랜드 IP 프리패스
            </a>
            <Link
              href="/rfp/submit"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-sm"
            >
              <FileText className="w-3 h-3" />
              <span>제안서 제출하기</span>
            </Link>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          기업 과제 & 브랜드 IP 프리패스
        </h1>
        <p className="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          국내 대표 혁신 기업의 실무 문제를 창의적으로 해결하는 산학 과제(RFP)와, 졸업작품 및 캡스톤 디자인에 공식 승인된 브랜드 자산을 합법적으로 활용하는 프리패스를 한곳에서 만나보세요.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* [Section A] 기업 산학 협력 과제 (RFP) 공고 리스트                           */}
      {/* ========================================================================= */}
      <section id="section-rfp" className="mb-16 scroll-mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                기업 산학 협력 과제 (RFP)
              </h2>
            </div>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
              기업의 실무 문제를 창의적으로 해결하고 채용/외주 스카우트 기회를 얻으세요.
            </p>
          </div>

          <Link
            href="/rfp/submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>과제 제안서 작성</span>
          </Link>
        </div>

        {/* 기업 기밀 보호 안내 배너 */}
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-amber-900 dark:text-amber-200">
              기업 기밀 보호형 브리프(Abstract Brief) 안내:
            </strong>{" "}
            기업의 미공개 연구개발 및 핵심 영업기밀을 보호하기 위해 과제 내용은 추상화된 요약본으로 공개됩니다. 학생 제안서의 지식재산권은 플랫폼 에스크로 규약에 의해 안전하게 귀속·보호됩니다.
          </div>
        </div>

        {/* RFP 카드 그리드 (grid-cols-1 md:grid-cols-2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0 w-full">
          {rfpList.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40 text-indigo-500" />
              <p className="text-sm font-semibold">현재 등록된 산학 협력 과제(RFP) 카드 정보가 없습니다.</p>
            </div>
          ) : (
            rfpList.map((rfp) => (
            <div
              key={rfp.id}
              className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all min-w-0"
            >
              <div>
                {/* 상단 기업 정보 및 뱃지 */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{rfp.logo_emoji || "🏢"}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate block">
                        {rfp.company}
                      </span>
                      {rfp.industry && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                          {rfp.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {rfp.status || "접수중"}
                  </span>
                </div>

                {/* 과제 타이틀 */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight line-clamp-2">
                  {rfp.title}
                </h3>

                {/* Abstract Brief (추상화된 문제 정의) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>추상화된 문제 정의 (Abstract Brief)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {rfp.abstract_brief}
                  </p>
                </div>

                {/* 제출 기한 & 혜택 정보 */}
                <div className="space-y-2 mb-5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">제출 기한:</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{rfp.deadline} 까지</span>
                  </div>

                  {rfp.reward && (
                    <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                      <Award className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">지원 혜택: </span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{rfp.reward}</span>
                      </div>
                    </div>
                  )}

                  {rfp.target && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Info className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>대상: {rfp.target}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 하단 액션 버튼 그룹 */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/rfp/submit?rfp_id=${rfp.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-600/20 text-center"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📝 과제 제안서 및 결과물 제출하기</span>
                </Link>

                <Link
                  href={`/rfp/${rfp.id}`}
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition text-center"
                >
                  <span>상세 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* [Section B] 기업 브랜드 IP 프리패스 (Open Brand Assets)                    */}
      {/* ========================================================================= */}
      <section id="section-ip" className="pt-8 border-t border-slate-200 dark:border-slate-800 scroll-mt-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              기업 브랜드 IP 프리패스
            </h2>
          </div>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
            공식 승인된 기업의 브랜드 자산을 졸업작품과 캡스톤 디자인에 자유롭게 활용하세요.
          </p>
        </div>

        {/* 공식 라이선스 승인 안내 배너 */}
        <div className="mb-8 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs flex items-start gap-3">
          <Sparkles className="w-5 h-5 shrink-0 text-cyan-600 dark:text-cyan-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-cyan-900 dark:text-cyan-200">
              공식 제휴 Open IP 프리패스 규약:
            </strong>{" "}
            본 플랫폼에 등록된 브랜드 에셋은 해당 기업의 공식 승인을 거쳐 제공되며, 대한민국 대학 졸업전시·학술 연구·캡스톤 디자인 용도에 한해 저작권 위반 걱정 없이 무상으로 사용할 수 있습니다 (상업적 양도 및 무단 재배포 금지).
          </div>
        </div>

        {/* IP 프리패스 카드 그리드 (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0 w-full">
          {ipList.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40 text-cyan-500" />
              <p className="text-sm font-semibold">현재 등록된 기업 브랜드 IP 에셋 카드 정보가 없습니다.</p>
            </div>
          ) : (
            ipList.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all min-w-0"
            >
              <div>
                {/* 상단 기업 로고, 카테고리 및 인증 뱃지 */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {item.logo_emoji || "🏢"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {item.company}
                      </h3>
                      {item.category && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>공식 승인</span>
                  </span>
                </div>

                {/* 에셋 설명 */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
                  {item.description || `${item.company}의 공식 브랜드 아이덴티티 및 디자인 리소스 패키지입니다.`}
                </p>

                {/* 라이선스 허용 범위 박스 */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 mb-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-0.5">
                    <FileCheck className="w-3 h-3 shrink-0" />
                    <span>라이선스 허용 범위</span>
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {item.license}
                  </span>
                </div>

                {/* 4대 필수 에셋 구성 칩 (필수 노출) */}
                <div className="mb-5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>4대 필수 에셋 구성 (포함 내역)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <Palette className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="truncate">SVG/AI 로고 키트</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <Layers className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span className="truncate">브랜드 가이드라인</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <Box className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">3D 에셋 / 캐릭터 원본</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      <Type className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">공식 전용 폰트(서체)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 패키지 용량 & 다운로드 CTA 버튼 */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  <span>패키지 용량: {item.package_size || "120 MB"}</span>
                  <span>다운로드: {item.download_count?.toLocaleString() || "1,200"}회</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDownload(item)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md shadow-cyan-600/20 active:scale-[0.99]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>⬇ 브랜드 에셋 팩 다운로드</span>
                </button>
              </div>
            </div>
          ))
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 브랜드 에셋 팩 다운로드 모달                                               */}
      {/* ========================================================================= */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 모달 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl p-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600">
                {selectedAsset.logo_emoji || "🏢"}
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {selectedAsset.company}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  공식 브랜드 에셋 패키지 다운로드
                </span>
              </div>
            </div>

            {/* 포함된 4대 에셋 목록 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 mb-4 text-xs space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                📦 패키지 포함 에셋 ({selectedAsset.package_size || "150 MB"}):
              </span>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>SVG/AI 로고 키트 (Primary, Vector, Monochrome)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>브랜드 가이드라인 PDF (컬러 규정 & 여백 가이드)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>3D 에셋 및 캐릭터 원본 (OBJ / FBX / Blender)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>공식 전용 서체 라이선스 (OTF/TTF 폰트 파일)</span>
              </div>
            </div>

            {/* 라이선스 동의 체크박스 */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToLicense}
                  onChange={(e) => setAgreedToLicense(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  <strong>라이선스 서약:</strong> 본 에셋은 대한민국 대학 졸업작품 및 캡스톤 디자인 학업 연구 목적으로만 활용하며, 제3자 상업적 양도 또는 무단 배포를 하지 않을 것에 동의합니다.
                </span>
              </label>
            </div>

            {/* 성공 메시지 또는 액션 버튼 */}
            {downloadSuccess ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-center text-xs space-y-1">
                <div className="flex items-center justify-center gap-1 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>다운로드가 시작되었습니다!</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {selectedAsset.company}_Brand_Assets_Pack.zip ({selectedAsset.package_size || "150 MB"}) 파일이 브라우저에 저장됩니다.
                </p>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  확인 완료
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  취소
                </button>

                <button
                  type="button"
                  disabled={!agreedToLicense || isDownloading}
                  onClick={handleConfirmDownload}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-2xl text-xs font-semibold transition shadow-md ${
                    agreedToLicense && !isDownloading
                      ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20"
                      : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? "패키지 압축 생성 중..." : "동의하고 에셋 팩 받기"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
