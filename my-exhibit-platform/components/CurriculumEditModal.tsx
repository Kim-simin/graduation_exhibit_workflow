"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Sparkles, Building2, Video, Layers, Loader2, CheckCircle2 } from "lucide-react";
import { DepartmentCurriculum, GradeTechStep } from "@/types/curriculum";

interface CurriculumEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedCurriculum: DepartmentCurriculum) => void;
  initialData?: Partial<DepartmentCurriculum> | null;
}

const DEFAULT_GRADE_STEPS: GradeTechStep[] = [
  { grade: "1학년", stage: "기초 조형 및 리서치", tools: ["기초도구", "분석툴"], desc: "전공 기초 지식 및 개념 이해" },
  { grade: "2학년", stage: "실무 응용 및 모델링", tools: ["실무SW", "데이터분석"], desc: "실무 소프트웨어 도구 및 분석 훈련" },
  { grade: "3학년", stage: "실전 프로젝트 및 통합", tools: ["전문기술", "파이프라인"], desc: "산학 프로젝트 및 포트폴리오 기획" },
  { grade: "4학년", stage: "산학 캡스톤 및 상용화", tools: ["상용스펙", "배포규격"], desc: "졸업 캡스톤 및 상용 규격 완성" },
];

export default function CurriculumEditModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
}: CurriculumEditModalProps) {
  const [university, setUniversity] = useState("");
  const [departmentCategory, setDepartmentCategory] = useState("");
  const [department, setDepartment] = useState("");
  const [badgeTitle, setBadgeTitle] = useState("");
  const [curriculumTitle, setCurriculumTitle] = useState("");
  const [shortVideoUrl, setShortVideoUrl] = useState("");
  const [videoPoster, setVideoPoster] = useState("");
  const [gradeSteps, setGradeSteps] = useState<GradeTechStep[]>(DEFAULT_GRADE_STEPS);
  const [benchmarkedStr, setBenchmarkedStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setUniversity(initialData.lead_school?.university || "");
      setDepartmentCategory(initialData.department_category || "");
      setDepartment(initialData.lead_school?.department || "");
      setBadgeTitle(initialData.lead_school?.badge_title || "");
      setCurriculumTitle(initialData.curriculum_title || "");
      setShortVideoUrl(
        initialData.short_video_url ||
          "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-41365-large.mp4"
      );
      setVideoPoster(
        initialData.video_poster ||
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
      );
      if (initialData.grade_tech_tree && initialData.grade_tech_tree.length > 0) {
        setGradeSteps(initialData.grade_tech_tree);
      } else {
        setGradeSteps(DEFAULT_GRADE_STEPS);
      }

      if (Array.isArray(initialData.benchmarked_universities)) {
        setBenchmarkedStr(
          initialData.benchmarked_universities
            .map((b) => `${b.university} ${b.department}`)
            .join(", ")
        );
      } else {
        setBenchmarkedStr("");
      }
    } else {
      setUniversity("");
      setDepartmentCategory("");
      setDepartment("");
      setBadgeTitle("");
      setCurriculumTitle("");
      setShortVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-screen-close-up-41365-large.mp4");
      setVideoPoster("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800");
      setGradeSteps(DEFAULT_GRADE_STEPS);
      setBenchmarkedStr("");
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleGradeChange = (
    idx: number,
    field: "stage" | "desc" | "tools",
    value: string
  ) => {
    setGradeSteps((prev) => {
      const copy = [...prev];
      if (field === "tools") {
        copy[idx] = {
          ...copy[idx],
          tools: value.split(",").map((s) => s.trim()).filter(Boolean),
        };
      } else {
        copy[idx] = { ...copy[idx], [field]: value };
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!university.trim() || !departmentCategory.trim() || !curriculumTitle.trim()) {
      setErrorMsg("대학교, 학과 분야 및 커리큘럼 제목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const benchmarked_universities = benchmarkedStr
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(" ");
        return {
          university: parts[0] || "",
          department: parts.slice(1).join(" ") || "관련학과",
        };
      });

    const payload: Partial<DepartmentCurriculum> = {
      id: initialData?.id,
      department_category: departmentCategory,
      lead_school: {
        university,
        department: department.trim() || "대표학과",
        badge_title: badgeTitle.trim() || `${university} 대표 선도학과`,
      },
      curriculum_title: curriculumTitle,
      short_video_url: shortVideoUrl,
      video_poster: videoPoster,
      grade_tech_tree: gradeSteps,
      tech_stack: gradeSteps.flatMap((g) => g.tools).filter(Boolean),
      benchmarked_universities,
    };

    try {
      const res = await fetch("/api/curriculums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.status === "SUCCESS") {
        onSaved(data.curriculum);
        onClose();
      } else {
        setErrorMsg(data.message || "저장 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "네트워크 통신 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-[#0f1423] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-white my-8 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {initialData?.id ? "선도학과 커리큘럼 카드 수정" : "새 선도학과 커리큘럼 카드 등록"}
              </h2>
              <p className="text-xs text-slate-400">
                선도 대학교의 30초 숏폼 영상 및 1~4학년 실무 테크트리를 입력하여 카드를 활성화합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* 대학교 및 학과 카테고리 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                대학교명 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="예: 서울대학교"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                학과(전공) 카테고리 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={departmentCategory}
                onChange={(e) => setDepartmentCategory(e.target.value)}
                placeholder="예: 컴퓨터공학 (IT/SW)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          {/* 상세 학과명 및 선도 배지명 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                상세 학과명 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 공과대학 컴퓨터공학부"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                선도 학과 식별 배지명
              </label>
              <input
                type="text"
                value={badgeTitle}
                onChange={(e) => setBadgeTitle(e.target.value)}
                placeholder="예: 차세대 분산 컴퓨팅 및 지능형 AI 시스템 선도 학과"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* 실무 커리큘럼 핵심 과정명 */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              실무 커리큘럼 핵심 과정명 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={curriculumTitle}
              onChange={(e) => setCurriculumTitle(e.target.value)}
              placeholder="예: 클라우드 네이티브 분산 시스템 및 거대 인공지능(LLM) 서빙 인프라 엔지니어링"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          {/* 30초 숏폼 영상 URL 및 썸네일 포스터 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                30초 숏폼 영상 URL (MP4)
              </label>
              <input
                type="text"
                value={shortVideoUrl}
                onChange={(e) => setShortVideoUrl(e.target.value)}
                placeholder="https://... 또는 /uploads/..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                영상 썸네일 포스터 URL
              </label>
              <input
                type="text"
                value={videoPoster}
                onChange={(e) => setVideoPoster(e.target.value)}
                placeholder="https://... 또는 /uploads/..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* 1~4학년 실무 작업 테크트리 입력 필드 */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-3 text-xs">
              <Layers className="w-4 h-4" />
              <span>1~4학년 실무 작업 테크트리 설정</span>
            </div>

            <div className="space-y-3">
              {gradeSteps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-amber-400 text-xs">{step.grade}</span>
                    <input
                      type="text"
                      value={step.tools.join(", ")}
                      onChange={(e) => handleGradeChange(idx, "tools", e.target.value)}
                      placeholder="실무 툴 (쉼표 구분: Figma, Illustrator 등)"
                      className="w-2/3 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={step.stage}
                      onChange={(e) => handleGradeChange(idx, "stage", e.target.value)}
                      placeholder="단계명 (예: 기초 조형 및 UX 리서치)"
                      className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={step.desc}
                      onChange={(e) => handleGradeChange(idx, "desc", e.target.value)}
                      placeholder="상세 설명 (예: 휴먼 팩터 리서치 설계)"
                      className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 동일 커리큘럼 개설 대학교 */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              동일 커리큘럼 개설 대학교 (쉼표 구분, 예: KAIST 전산학부, POSTECH 컴퓨터공학과)
            </label>
            <input
              type="text"
              value={benchmarkedStr}
              onChange={(e) => setBenchmarkedStr(e.target.value)}
              placeholder="예: 홍익대학교 시각디자인과, 국민대학교 AI디자인학과"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>커리큘럼 카드 저장 및 즉시 배포</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
