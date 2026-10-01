"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Volume2, VolumeX, Play, Pause, Sparkles, Building2, ExternalLink, Layers } from "lucide-react";
import { DepartmentCurriculum } from "@/types/curriculum";

interface CurriculumShortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  curriculum: DepartmentCurriculum | null;
}

export default function CurriculumShortsModal({
  isOpen,
  onClose,
  curriculum,
}: CurriculumShortsModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !curriculum) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col md:flex-row overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition border border-white/20"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 9:16 비디오 플레이어 영역 */}
        <div
          className="relative bg-black flex items-center justify-center cursor-pointer md:w-[420px] shrink-0"
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            src={curriculum.short_video_url}
            poster={curriculum.video_poster}
            loop
            playsInline
            autoPlay
            muted={isMuted}
            className="w-full h-[55vh] md:h-[82vh] object-cover"
          />

          {/* 비디오 컨트롤 오버레이 */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>30초 숏츠 쇼케이스</span>
            </span>
          </div>

          {/* 우하단 음소거 버튼 */}
          <button
            type="button"
            onClick={toggleMute}
            className="absolute bottom-4 right-4 z-10 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition"
            title={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* 일시정지 오버레이 아이콘 */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="p-4 rounded-full bg-indigo-600/90 text-white shadow-xl">
                <Play className="w-8 h-8 fill-current translate-x-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* 우측 커리큘럼 상세 정보 패널 */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col justify-between bg-slate-900/90">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{curriculum.lead_school.badge_title}</span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white leading-snug mb-2">
              {curriculum.curriculum_title}
            </h2>

            <div className="flex items-center gap-2 text-sm text-cyan-400 font-bold mb-5 flex-wrap">
              <Building2 className="w-4 h-4 text-cyan-300" />
              <span className="text-white font-extrabold">
                {curriculum.lead_school.university}
              </span>
              <span>{curriculum.lead_school.department}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-xs px-2 py-0.5 rounded bg-slate-800">
                {curriculum.department_category}
              </span>
            </div>

            {/* 1~4학년 실무 작업 테크트리 */}
            <div className="mb-6">
              <div className="text-xs font-bold text-slate-400 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1~4학년 실무 작업 테크트리</span>
                </span>
                <span className="text-[11px] text-indigo-300 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  실무 툴 & 단계별 학습
                </span>
              </div>
              <div className="space-y-1.5">
                {(curriculum.grade_tech_tree || []).map((step, idx) => (
                  <div key={idx} className="flex flex-col">
                    <div className="bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/40 rounded-xl p-3 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="text-xs sm:text-sm font-black">
                          <span className="text-amber-400 font-extrabold mr-1.5">
                            {step.grade}:
                          </span>
                          <span className="text-cyan-300 font-bold">
                            {step.tools.join(", ")}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 shrink-0">
                          {step.stage}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed pl-0.5">
                        {step.desc}
                      </div>
                    </div>
                    {/* 수직 화살표 ↓ */}
                    {idx < (curriculum.grade_tech_tree?.length || 4) - 1 && (
                      <div className="flex items-center justify-center py-1 text-cyan-400 text-xs font-black select-none">
                        ↓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 동일 커리큘럼 개설 대학교 */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 mb-2">
                🏛️ 동일 커리큘럼 개설 대학교 ({curriculum.benchmarked_universities.length}개교)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {curriculum.benchmarked_universities.map((p, idx) => (
                  <Link
                    key={idx}
                    href={
                      p.exhibition_link_id
                        ? `/exhibit/${p.exhibition_link_id}`
                        : `/?search=${encodeURIComponent(p.university)}`
                    }
                    onClick={onClose}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition"
                  >
                    {p.university} {p.department} ↗
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <Link
              href={`/?search=${encodeURIComponent(curriculum.lead_school.university)}`}
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm text-center transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
            >
              <span>이 학과 커리큘럼 수료 학생 결과물 보기</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
