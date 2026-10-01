"use client";

import React, { useState } from "react";
import { getBrandAssets, getTaxonomy } from "@/lib/data";
import { BrandAsset } from "@/types";
import {
  Sparkles,
  Download,
  CheckCircle2,
  FileCheck,
  Layers,
  Palette,
  Box,
  Type,
  X,
  Check,
  Tag,
  ShieldCheck,
  ExternalLink,
  AlertCircle
} from "lucide-react";

export default function BrandAssetsPage() {
  const brandAssets = getBrandAssets();
  const taxonomy = getTaxonomy();
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>("all");

  // Modal State for Brand Asset Download
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null);
  const [agreedToLicense, setAgreedToLicense] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const filteredAssets = brandAssets.filter((item) => {
    if (selectedTaxonomy === "all") return true;
    const tax = taxonomy.find((t) => t.id === selectedTaxonomy);
    if (!tax) return true;
    return (
      item.category?.includes(tax.name) ||
      item.industry?.includes(tax.name) ||
      tax.keywords.some((kw) => item.category?.includes(kw) || item.company?.includes(kw))
    );
  });

  const handleOpenDownload = (asset: BrandAsset) => {
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
      {/* 1. 페이지 헤더 섹션 */}
      <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
          <Tag className="w-3.5 h-3.5" />
          <span>Official Verified Brand IP FreePass</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <span>🏷️</span>
          <span>기업 브랜드 IP 프리패스</span>
        </h1>
        <p className="mt-3 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          공식 승인 및 검증(Verified)된 기업의 상표권, 캐릭터, 서체, 3D 에셋을 졸업작품과 캡스톤 디자인에 합법적으로 활용하세요.
        </p>
      </div>

      {/* 공통 Taxonomy 산업군/카테고리 필터 칩 바 */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setSelectedTaxonomy("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
            selectedTaxonomy === "all"
              ? "bg-cyan-600 text-white border border-cyan-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          🌐 전체 분야 ({brandAssets.length})
        </button>
        {taxonomy.map((tax) => {
          const isSelected = selectedTaxonomy === tax.id;
          const matchCount = brandAssets.filter(
            (b) =>
              b.category?.includes(tax.name) ||
              b.industry?.includes(tax.name) ||
              tax.keywords.some((kw) => b.category?.includes(kw) || b.company?.includes(kw))
          ).length;
          return (
            <button
              key={tax.id}
              type="button"
              onClick={() => setSelectedTaxonomy(tax.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                isSelected
                  ? "text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
              style={{
                backgroundColor: isSelected ? tax.color : undefined,
                borderColor: isSelected ? tax.color : undefined,
              }}
            >
              <span>{tax.icon}</span>
              <span>{tax.name}</span>
              <span className="text-[10px] opacity-80">({matchCount})</span>
            </button>
          );
        })}
      </div>

      {/* 2. 제휴 규약 공지 배너 */}
      <div className="mb-8 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-800 dark:text-cyan-300 text-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 shrink-0 text-cyan-600 dark:text-cyan-400 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-cyan-900 dark:text-cyan-200">
            ✨ 공식 제휴 Open IP 프리패스 규약:
          </strong>{" "}
          본 플랫폼에 등록된 에셋은 비영리 학술 연구 및 캡스톤 디자인 용도에 한해 저작권 위반 없이 무상 사용할 수 있습니다 (상업적 2차 판매 및 무단 재배포 엄격 금지).
        </div>
      </div>

      {/* 3. 카드 UI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0 w-full">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-500">
            <Palette className="w-10 h-10 mx-auto mb-3 opacity-40 text-slate-400" />
            <p className="text-sm font-semibold">현재 등록된 기업 브랜드 IP 에셋 카드 정보가 없습니다.</p>
          </div>
        ) : (
          filteredAssets.map((item) => {
          const isVerified = item.is_verified === true || item.verification_status === "VERIFIED";

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all min-w-0"
            >
              <div>
                {/* 상단 기업 로고, 카테고리 및 인증 뱃지 */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
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

                  {isVerified ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>공식 라이선스 인증</span>
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <AlertCircle className="w-2.5 h-2.5" />
                      <span>규약 확인 중</span>
                    </span>
                  )}
                </div>

                {/* 에셋 설명 */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
                  {item.description || `${item.company}의 공식 브랜드 아이덴티티 및 디자인 리소스 패키지입니다.`}
                </p>

                {/* 허용 라이선스 범위 박스 */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 mb-4">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <FileCheck className="w-3 h-3 shrink-0" />
                      <span>라이선스 허용 범위</span>
                    </div>
                    {item.official_policy_url && (
                      <a
                        href={item.official_policy_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-0.5"
                      >
                        <span>공식 가이드</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {item.license_scope || item.license}
                  </span>
                </div>

                {/* 제공 에셋 4대 필수 칩 */}
                <div className="mb-5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>제공 에셋 4종 구성</span>
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
                      <span className="truncate">공식 전용 폰트</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단 용량 & 다운로드 CTA 버튼 */}
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
          );
        })
        )}
      </div>

      {/* 다운로드 모달 */}
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

            {/* 라이선스 서약 체크박스 */}
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
