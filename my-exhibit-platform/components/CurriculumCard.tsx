"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Play, Sparkles, Building2, ExternalLink, Layers, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { DepartmentCurriculum } from "@/types/curriculum";

interface CurriculumCardProps {
  curriculum: DepartmentCurriculum;
  onOpenModal: (curriculum: DepartmentCurriculum) => void;
  isAdminEditMode?: boolean;
  onEdit?: (curriculum: DepartmentCurriculum) => void;
  onDelete?: (curriculum: DepartmentCurriculum) => void;
}

export default function CurriculumCard({
  curriculum,
  onOpenModal,
  isAdminEditMode = false,
  onEdit,
  onDelete,
}: CurriculumCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      className={`bg-[#13192b] border rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between group ${
        isAdminEditMode
          ? "border-red-500/50 hover:border-red-400"
          : "border-slate-800 hover:border-cyan-500/50"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 관리자 관제 모드 활성화 시 상단 수정/삭제 바 */}
      {isAdminEditMode && (
        <div
          className="z-30 px-3 py-2 bg-red-950/90 backdrop-blur-md border-b border-red-500/40 flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[11px] font-mono font-bold text-red-200 truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>선도학과 카드 관리</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(curriculum);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition shadow-sm"
                title="커리큘럼 카드 수정"
              >
                <Edit className="w-3 h-3 text-cyan-400" /> 수정
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(curriculum);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
                title="커리큘럼 카드 삭제"
              >
                <Trash2 className="w-3 h-3" /> 삭제
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        {/* ① 상단: 선도대학 학과 식별 배지 & 숏츠(9:16) 영상 */}
        <div
          className="relative h-[220px] w-full bg-slate-950 overflow-hidden cursor-pointer"
          onClick={() => onOpenModal(curriculum)}
          title="클릭하여 30초 실무 요약 숏츠 크게보기"
        >
          <video
            ref={videoRef}
            src={curriculum.short_video_url}
            poster={curriculum.video_poster}
            muted
            loop
            playsInline
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* 비디오 비네팅 그라디언트 */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#13192b] via-transparent to-black/70 pointer-events-none" />

          {/* 상단 좌측: 선도대학 학과 식별 배지 (굵은 텍스트 강조) */}
          <div className="absolute top-2.5 left-2.5 z-10 max-w-[82%]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/40 text-white text-xs font-bold shadow-lg truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-400 font-extrabold mr-0.5">[선도 학과]</span>
              <span className="font-black text-white truncate">
                {curriculum.lead_school.university} {curriculum.lead_school.department}
              </span>
            </span>
          </div>

          {/* 상단 우측: 30초 실무 요약 숏츠 배지 */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
              <Play className="w-3 h-3 fill-current" />
              <span>30초 숏츠</span>
            </span>
          </div>

          {/* 중앙 호버 시 재생 유도 버튼 아이콘 */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
              isHovered ? "opacity-90" : "opacity-60"
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            </div>
          </div>

          {/* 하단 텍스트 오버레이 (선도대학명 & 학과 & 세부 선도 타이틀) */}
          <div className="absolute bottom-2.5 left-3 right-3 z-10 pointer-events-none">
            <div className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5 mb-0.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <strong className="text-sm font-black text-white">
                {curriculum.lead_school.university}
              </strong>
              <span>·</span>
              <span className="font-bold text-cyan-300">
                {curriculum.lead_school.department}
              </span>
            </div>
            <div className="text-[11px] text-amber-300 font-semibold truncate">
              {curriculum.lead_school.badge_title}
            </div>
          </div>
        </div>

        {/* ② 중단: 학과 실무 커리큘럼 타이틀 및 숏츠/테크트리 바로가기 */}
        <div className="p-4 sm:p-5">
          {/* 커리큘럼 실무 핵심 과정명 */}
          <h3
            className="text-sm sm:text-base font-black text-white leading-snug mb-3 line-clamp-2 group-hover:text-cyan-200 transition-colors cursor-pointer"
            onClick={() => onOpenModal(curriculum)}
          >
            {curriculum.curriculum_title}
          </h3>

          {/* 1~4학년 테크트리 & 30초 숏츠 모달 열기 퀵 버튼 (상세 내용은 두번째 모달에서 노출) */}
          <button
            type="button"
            onClick={() => onOpenModal(curriculum)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center justify-between group/btn shadow-inner mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>1~4학년 실무 테크트리 & 숏츠 보기</span>
            </span>
            <span className="text-[11px] text-amber-400 font-extrabold flex items-center gap-0.5 group-hover/btn:translate-x-0.5 transition-transform">
              <span>상세보기</span>
              <span>▶</span>
            </span>
          </button>

          {/* 전체 실무 소프트웨어 툴 칩 (전체 노출) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from(
              new Set(
                (curriculum.tech_stack && curriculum.tech_stack.length > 0)
                  ? curriculum.tech_stack
                  : (curriculum.grade_tech_tree || []).flatMap((g) => g.tools || [])
              )
            ).map((tool) => (
              <span
                key={tool}
                className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-bold text-[10px] shadow-xs"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ③ 하단: 동일/유사 커리큘럼 운영 대학교 나열 */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="border-t border-slate-800/80 pt-3.5 mb-3">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5">
              <span>🏛️ 동일 커리큘럼 개설 대학교</span>
              <span className="text-cyan-400 font-mono">
                ({curriculum.benchmarked_universities.length}개교)
              </span>
            </span>
          </div>

          {/* 대학 칩 목록 */}
          <div className="flex flex-wrap gap-1.5">
            {curriculum.benchmarked_universities.map((partner, idx) => {
              const targetHref = partner.exhibition_link_id
                ? `/exhibit/${partner.exhibition_link_id}`
                : `/?search=${encodeURIComponent(partner.university)}`;

              return (
                <Link
                  key={idx}
                  href={targetHref}
                  className="text-[11px] bg-slate-800/80 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/60 hover:border-cyan-500 transition-colors inline-flex items-center gap-1"
                  title={`${partner.university} ${partner.department} 졸업전시회 아카이브 바로가기`}
                >
                  <span>{partner.university} {partner.department}</span>
                  <span className="text-cyan-400 text-[10px]">↗</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼: [이 학과 커리큘럼 수료 학생 결과물 보기 ↗] */}
        <Link
          href={`/?search=${encodeURIComponent(curriculum.lead_school.university)}`}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600/20 hover:from-indigo-600/30 to-cyan-600/20 hover:to-cyan-600/30 border border-indigo-500/30 hover:border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>이 학과 커리큘럼 수료 학생 결과물 보기</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
