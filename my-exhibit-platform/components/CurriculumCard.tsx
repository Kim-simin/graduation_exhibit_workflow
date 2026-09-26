"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Play, Sparkles, Building2, ExternalLink, Layers, CheckCircle2 } from "lucide-react";
import { DepartmentCurriculum } from "@/types/curriculum";

interface CurriculumCardProps {
  curriculum: DepartmentCurriculum;
  onOpenModal: (curriculum: DepartmentCurriculum) => void;
}

export default function CurriculumCard({ curriculum, onOpenModal }: CurriculumCardProps) {
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
      className="bg-[#13192b] border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        {/* ① 상단: 선도대학 학과 식별 배지 & 숏츠(9:16) 영상 */}
        <div
          className="relative h-[290px] w-full bg-slate-950 overflow-hidden cursor-pointer"
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
          <div className="absolute top-3 left-3 z-10 max-w-[82%]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-amber-500/40 text-white text-xs font-bold shadow-lg truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-400 font-extrabold mr-0.5">[선도 학과]</span>
              <span className="font-black text-white truncate">
                {curriculum.lead_school.university} {curriculum.lead_school.department}
              </span>
            </span>
          </div>

          {/* 상단 우측: 30초 실무 요약 숏츠 배지 */}
          <div className="absolute top-3 right-3 z-10">
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
            <div className="w-12 h-12 rounded-full bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            </div>
          </div>

          {/* 하단 텍스트 오버레이 (선도대학명 & 학과 & 세부 선도 타이틀) */}
          <div className="absolute bottom-3 left-3.5 right-3.5 z-10 pointer-events-none">
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

        {/* ② 중단: 학과 실무 커리큘럼 및 3단계 학습 프로세스 */}
        <div className="p-4 sm:p-5">
          {/* 커리큘럼 실무 핵심 과정명 */}
          <h3
            className="text-base sm:text-lg font-black text-white leading-snug mb-3 line-clamp-2 group-hover:text-cyan-200 transition-colors cursor-pointer"
            onClick={() => onOpenModal(curriculum)}
          >
            {curriculum.curriculum_title}
          </h3>

          {/* 1~4학년 실무 작업 테크트리 수직 박스 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 shadow-inner">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>1~4학년 실무 작업 테크트리</span>
              </span>
              <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
                실무 툴 & 로드맵
              </span>
            </div>

            <div className="space-y-1">
              {(curriculum.grade_tech_tree || []).map((step, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-lg px-2.5 py-2 transition-colors">
                    {/* 1학년: Figma, Illustrator 형태 */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="text-xs font-black">
                        <span className="text-amber-400 font-extrabold mr-1.5">
                          {step.grade}:
                        </span>
                        <span className="text-cyan-300 font-bold">
                          {step.tools.join(", ")}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 shrink-0">
                        {step.stage}
                      </span>
                    </div>
                    {/* 상세 실무 내용 설명 */}
                    <div className="text-[11px] text-slate-300 pl-0.5 leading-snug line-clamp-1">
                      {step.desc}
                    </div>
                  </div>

                  {/* 수직 연결 화살표 ↓ */}
                  {idx < (curriculum.grade_tech_tree?.length || 4) - 1 && (
                    <div className="flex items-center justify-center py-0.5 text-cyan-400 text-xs font-black select-none leading-none">
                      ↓
                    </div>
                  )}
                </div>
              ))}
            </div>
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
