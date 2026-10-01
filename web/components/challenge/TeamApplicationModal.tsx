"use client";

import React, { useState, useEffect } from "react";
import { Challenge, ChallengeMajorRequirement } from "@/types/challenge";
import {
  X,
  Users,
  CheckCircle2,
  Sparkles,
  Send,
  Building2,
  GraduationCap,
  Link as LinkIcon,
  HelpCircle,
} from "lucide-react";

interface TeamApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  initialMajor?: string;
}

export default function TeamApplicationModal({
  isOpen,
  onClose,
  challenge,
  initialMajor,
}: TeamApplicationModalProps) {
  const [university, setUniversity] = useState("부산대학교");
  const [department, setDepartment] = useState(initialMajor || "컴퓨터공학과");
  const [grade, setGrade] = useState("3학년");
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [skills, setSkills] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [motivation, setMotivation] = useState("");
  const [teamPreference, setTeamPreference] = useState<"NEED_TEAM" | "HAVE_TEAM">("NEED_TEAM");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (challenge && challenge.majorRequirements.length > 0) {
      // Find open requirement
      const openReq = challenge.majorRequirements.find((r) => r.currentMembers < r.capacity);
      setSelectedRole(openReq ? `${openReq.majorCategoryName} - ${openReq.roleName}` : challenge.majorRequirements[0].roleName);
      if (initialMajor) {
        setDepartment(initialMajor);
      }
    }
    setIsSuccess(false);
  }, [challenge, initialMajor, isOpen]);

  if (!isOpen || !challenge) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage for demo persistence
    try {
      const existing = JSON.parse(localStorage.getItem("team_applications") || "[]");
      const newApp = {
        id: `app_${Date.now()}`,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        applicantName,
        university,
        department,
        grade,
        email,
        role: selectedRole,
        skills: skills.split(",").map((s) => s.trim()),
        portfolioUrl,
        motivation,
        teamPreference,
        status: "APPLIED",
        appliedAt: new Date().toISOString(),
      };
      localStorage.setItem("team_applications", JSON.stringify([newApp, ...existing]));
    } catch (err) {
      console.error(err);
    }
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-2xl bg-[#0f1424] border border-slate-800 p-6 md:p-8 shadow-2xl text-slate-100">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            {/* 상단 타이틀 */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>팀 참여 신청</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                {challenge.title}
              </h2>
              <p className="mt-1 text-xs md:text-sm text-slate-400">
                제공 기관: <strong className="text-slate-200">{challenge.providerName}</strong> ({challenge.region})
              </p>
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 대학교 & 학과 & 학년 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    대학교
                  </label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="예: 부산대학교"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    학과 / 전공
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="예: 컴퓨터공학과"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    학년
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1학년">1학년</option>
                    <option value="2학년">2학년</option>
                    <option value="3학년">3학년</option>
                    <option value="4학년">4학년 (졸업예정)</option>
                    <option value="대학원생">대학원생 (석/박사)</option>
                  </select>
                </div>
              </div>

              {/* 이름 & 연락처 이메일 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    지원 학생 성함
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    연락처 이메일
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@univ.ac.kr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 지원 역할 선택 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  지원 희망 역할
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {challenge.majorRequirements.map((req) => (
                    <option
                      key={req.id}
                      value={`${req.majorCategoryName} - ${req.roleName}`}
                    >
                      [{req.majorCategoryName}] {req.roleName} ({req.currentMembers}/{req.capacity}명 모집)
                    </option>
                  ))}
                </select>
              </div>

              {/* 보유 Skill */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  보유 핵심 역량 / Skill (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="예: Python, PyTorch, RAG, CAD, Figma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 포트폴리오 URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  포트폴리오 또는 GitHub / Notion URL (선택)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 팀 참여 형태 선택 (팀 구성 희망 vs 기존 팀 참여) */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  팀 구성 참여 형태
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      teamPreference === "NEED_TEAM"
                        ? "bg-indigo-950/50 border-indigo-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamPreference"
                      value="NEED_TEAM"
                      checked={teamPreference === "NEED_TEAM"}
                      onChange={() => setTeamPreference("NEED_TEAM")}
                      className="mt-0.5 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <strong className="block font-semibold">팀 구성 희망</strong>
                      <span className="text-[11px] text-slate-400 leading-tight">
                        아직 팀원이 없어 타 학과 학생들과 매칭을 희망합니다.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      teamPreference === "HAVE_TEAM"
                        ? "bg-indigo-950/50 border-indigo-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="teamPreference"
                      value="HAVE_TEAM"
                      checked={teamPreference === "HAVE_TEAM"}
                      onChange={() => setTeamPreference("HAVE_TEAM")}
                      className="mt-0.5 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <strong className="block font-semibold">기존 팀 참여</strong>
                      <span className="text-[11px] text-slate-400 leading-tight">
                        이미 팀원이 구성되어 팀 단위로 프로젝트에 지원합니다.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 짧은 참여 동기 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  참여 동기 및 해결 포부 (2~3줄 요약)
                </label>
                <textarea
                  rows={2}
                  required
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="예: 실제 조선 현장의 비정형 도면 검색 문제를 LLM 파이프라인으로 해결하여 현업 적용 가능성을 검증하고 싶습니다."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* 제출 버튼 */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>참여 신청서 등록</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              팀 참여 신청이 완료되었습니다!
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              <strong className="text-white">[{challenge.title}]</strong> 과제의
              담당 멘토 및 {teamPreference === "NEED_TEAM" ? "타 학과 팀 매칭 풀" : "심사단"}에
              신청서가 접수되었습니다. 안내 메일이 등록하신 이메일(
              <span className="text-indigo-400 font-semibold">{email}</span>)로 발송됩니다.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                확인 완료
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
