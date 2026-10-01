"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  BookOpen,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles,
  Users,
  Compass,
  Palette,
  Layers,
} from "lucide-react";

interface UniversityProfessorInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  university: string;
  professors: any[];
  onFilterByUniversity?: (univ: string) => void;
}

export default function UniversityProfessorInsightModal({
  isOpen,
  onClose,
  university,
  professors,
  onFilterByUniversity,
}: UniversityProfessorInsightModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !university) return null;

  // 해당 대학교 소속 교수진 필터링 (완전 일치 또는 포함)
  const targetUniv = university.trim();
  const univProfessors = professors.filter((p) => {
    if (!p.university) return false;
    const u = p.university.trim();
    return u === targetUniv || u.includes(targetUniv) || targetUniv.includes(u);
  });

  // 소속 학과 목록 집계
  const departments = Array.from(
    new Set(univProfessors.map((p) => p.department).filter(Boolean))
  );

  // 연구실 목록 집계
  const labs = Array.from(
    new Set(univProfessors.map((p) => p.lab_name).filter(Boolean))
  );

  // 연구 키워드 빈도 집계
  const keywordCounts: Record<string, number> = {};
  univProfessors.forEach((p) => {
    p.research_areas?.forEach((area: string) => {
      keywordCounts[area] = (keywordCounts[area] || 0) + 1;
    });
  });
  const sortedKeywords = Object.entries(keywordCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // 학생 제출물 수
  const totalSubmissions = univProfessors.reduce(
    (acc, p) => acc + (p.student_submissions?.length || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-start justify-between p-5 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>공식 학술 교원 인사이트 (FACULTY & CURRICULUM INTELLIGENCE)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
              <span className="text-indigo-400">[{university}]</span>
              <span>학과 교수진 & 핵심 탐구 과제 인사이트</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {departments.length > 0 ? departments.join(" · ") : "디자인 및 공학 계열"} | 총{" "}
              <strong className="text-white">{univProfessors.length}명</strong> 공식 등록 교수진 커리큘럼 종합 분석
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 바디 스크롤 영역 */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* 주요 지표 KPI 바 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>소속 교수진</span>
              </div>
              <div className="text-xl font-bold text-white">
                {univProfessors.length}
                <span className="text-xs font-normal text-slate-400 ml-1">명</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>특화 연구실 (Lab)</span>
              </div>
              <div className="text-xl font-bold text-white">
                {labs.length}
                <span className="text-xs font-normal text-slate-400 ml-1">개 랩</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>주요 연구 키워드</span>
              </div>
              <div className="text-xl font-bold text-white">
                {sortedKeywords.length}
                <span className="text-xs font-normal text-slate-400 ml-1">개 분야</span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>졸전 출품작 연계</span>
              </div>
              <div className="text-xl font-bold text-white">
                {totalSubmissions > 0 ? `${totalSubmissions}건` : "공식 연계"}
              </div>
            </div>
          </div>

          {/* 대학교 교수진 핵심 탐구 과제 & 연구 방향성 종합 요약 */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-800/50 to-slate-900 border border-indigo-500/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>{university} 학과 핵심 탐구 방향성 및 커리큘럼 인사이트</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong>{university}</strong> 교수진은{" "}
              {sortedKeywords.slice(0, 4).map(([kw]) => `#${kw}`).join(" ")} 등 실무 산업계와 직결된 융합 프로젝트를 중심으로 심도 있는 학기 탐구 과제 및 캡스톤 디자인을 지도하고 있습니다. 학부 및 대학원 연구실과의 밀접한 산학 연계를 통해 최신 실무 트렌드와 학술 연구를 결합한 혁신적인 결과물을 도출합니다.
            </p>

            {/* 핵심 연구 키워드 칩 */}
            {sortedKeywords.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-700/40 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-slate-400 mr-1">대표 연구 키워드:</span>
                {sortedKeywords.slice(0, 10).map(([kw, count]) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-indigo-300"
                  >
                    <span>#{kw}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({count})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 소속 교수진별 핵심 탐구 과제 일람 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{university} 소속 교수진별 핵심 탐구 과제 요약</span>
                <span className="text-xs text-slate-400 font-normal">({univProfessors.length}명)</span>
              </h3>
            </div>

            {univProfessors.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-xl text-slate-400 text-sm">
                등록된 교수진 정보가 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {univProfessors.map((p) => {
                  const isVerified = p.is_verified === true || p.verification_status === "VERIFIED";
                  const summaryTitle = `${p.university || university} ${p.department || ""} 핵심 탐구 과제 요약`.trim();

                  return (
                    <div
                      key={p.id}
                      className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-200"
                    >
                      <div>
                        {/* 교수 헤더 */}
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={
                              p.avatar_url ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                            }
                            alt={p.name}
                            className="w-11 h-11 rounded-full object-cover border border-indigo-500/40 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-white text-sm">{p.name} 교수</h4>
                              <span className="text-[11px] text-indigo-300 font-medium">{p.title}</span>
                              {isVerified && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  인증
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5">
                              {p.department || university}
                            </div>
                            {p.lab_name && (
                              <div className="text-[11px] text-cyan-400 mt-0.5 font-medium truncate">
                                🔬 {p.lab_name}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 핵심 탐구 과제 요약 박스 (요청 포맷: XX대학교 XX학과 핵심 탐구 과제 요약) */}
                        <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-2.5 mb-3">
                          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold mb-1">
                            <BookOpen className="w-3 h-3 shrink-0" />
                            <span className="truncate">{summaryTitle}</span>
                          </div>
                          <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
                            "{p.assignment_one_liner || p.bio || `${p.department || "학과"} 캡스톤 디자인 및 포트폴리오 지도`}"
                          </p>
                        </div>

                        {/* 연구 키워드 */}
                        {p.research_areas && p.research_areas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.research_areas.slice(0, 4).map((area: string) => (
                              <span
                                key={area}
                                className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded"
                              >
                                #{area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 하단 상세 버튼 */}
                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          제출물: <strong className="text-white">{p.student_submissions?.length || 0}건</strong>
                        </span>
                        <Link
                          href={`/professors/${p.id}`}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <span>과제 & 쇼케이스 보기</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 모달 하단 푸터 액션 */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/?search=${encodeURIComponent(university)}`}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>🎨 {university} 졸업전시회 출품작 보러가기 ↗</span>
          </Link>

          <div className="flex items-center gap-2">
            {onFilterByUniversity && (
              <button
                type="button"
                onClick={() => {
                  onFilterByUniversity(university);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                🔍 목록에서 {university}만 필터링
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
