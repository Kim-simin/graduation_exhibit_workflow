"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import {
  getChallengeById,
  getParentChallengeById,
} from "@/lib/data";
import { ChallengeResource } from "@/types/challenge";
import TeamApplicationModal from "@/components/challenge/TeamApplicationModal";
import ResourceDetailModal from "@/components/challenge/ResourceDetailModal";
import ChallengeStickyCTA from "@/components/challenge/ChallengeStickyCTA";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Target,
  FileText,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  Lock,
  Tag,
  Database,
  Cpu,
  BookOpen,
} from "lucide-react";

export default function ChallengeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const challenge = getChallengeById(id);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ChallengeResource | null>(null);
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [selectedMajorForApply, setSelectedMajorForApply] = useState<string | undefined>(undefined);

  if (!challenge) {
    notFound();
  }

  const parentChallenge = getParentChallengeById(challenge.parentChallengeId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RECRUITING":
      case "OPEN":
        return {
          label: "모집중",
          style: "bg-emerald-950/80 text-emerald-300 border-emerald-700/60",
        };
      case "PROPOSAL_REVIEW":
        return {
          label: "제안 검토중",
          style: "bg-amber-950/80 text-amber-300 border-amber-700/60",
        };
      case "IN_PROGRESS":
        return {
          label: "진행중",
          style: "bg-blue-950/80 text-blue-300 border-blue-700/60",
        };
      default:
        return {
          label: "완료",
          style: "bg-slate-800 text-slate-400 border-slate-700",
        };
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Intermediate":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Advanced":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "PATENT":
        return <FileText className="w-4 h-4 text-amber-400" />;
      case "DATASET":
        return <Database className="w-4 h-4 text-cyan-400" />;
      case "BRAND_IP":
        return <Tag className="w-4 h-4 text-pink-400" />;
      case "EQUIPMENT":
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case "RESEARCH":
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const statusBadge = getStatusBadge(challenge.status);

  // Proposal link
  const proposalHref = `/rfp/submit?challengeId=${encodeURIComponent(
    challenge.id
  )}&challengeTitle=${encodeURIComponent(
    challenge.title
  )}&parentChallenge=${encodeURIComponent(
    challenge.parentChallengeTitle
  )}&industry=${encodeURIComponent(
    challenge.industry
  )}&provider=${encodeURIComponent(
    challenge.providerName
  )}${selectedMajorForApply ? `&selectedMajor=${encodeURIComponent(selectedMajorForApply)}` : ""}`;

  return (
    <div className="min-w-0 w-full px-4 md:px-8 lg:px-12 py-8 max-w-5xl mx-auto text-slate-100 pb-32">
      {/* 뒤로가기 네비게이션 */}
      <div className="mb-6">
        <Link
          href="/industry-challenges"
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>산학협력 Challenge 목록으로</span>
        </Link>
      </div>

      {/* 01. Industry Challenge (Parent Theme Banner) */}
      <section className="mb-6 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/50 via-[#13172e] to-[#0c101d] border border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>01. Industry Mega Challenge</span>
            </div>
            <h2 className="text-base md:text-lg font-black text-white">
              {challenge.parentChallengeTitle}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {parentChallenge?.description || "기업·대학·연구기관이 공동 설계한 메가 테마 산업 과제입니다."}
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{challenge.industry}</span>
            <span className="text-[11px] text-slate-400">{challenge.region}</span>
          </div>
        </div>
      </section>

      {/* 02. Student Challenge Main Header */}
      <header className="mb-8 p-6 md:p-8 rounded-3xl bg-[#121626]/90 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-indigo-950 text-indigo-300 border-indigo-700/60">
            02. Student Challenge
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.style}`}>
            {statusBadge.label}
          </span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getDifficultyBadge(challenge.difficulty)}`}>
            {challenge.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            기간 {challenge.duration}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-4">
          {challenge.title}
        </h1>

        <p className="text-sm md:text-base text-indigo-200/90 font-medium leading-relaxed mb-6">
          &ldquo;{challenge.shortProblem}&rdquo;
        </p>

        {/* 메타 인포 그리드 */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">제공 기관 / 파트너</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              {challenge.providerUrl ? (
                <a
                  href={challenge.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-300 hover:underline flex items-center gap-1 truncate"
                  title={`${challenge.providerName} 공식 웹사이트`}
                >
                  <span className="truncate">{challenge.providerName}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                </a>
              ) : (
                <span className="truncate">{challenge.providerName}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">협력 권역</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {challenge.regionUrl ? (
                <a
                  href={challenge.regionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-300 hover:underline flex items-center gap-1 truncate"
                  title={`${challenge.region} 포털`}
                >
                  <span className="truncate">{challenge.region}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                </a>
              ) : (
                <span className="truncate">{challenge.region}</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">공식 원문 / 공고</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              {challenge.officialUrl ? (
                <a
                  href={challenge.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline font-bold"
                  title="주관기관 공식 공고문 바로가기"
                >
                  <span>공식 공고 확인</span>
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                </a>
              ) : (
                <span className="text-slate-500">정보 준비중</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">제안서 제출 마감</span>
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{challenge.proposalDeadline} 까지</span>
            </div>
          </div>
        </div>
      </header>

      {/* 세부 섹션 그리드 */}
      <div className="space-y-8">
        {/* 03. 문제 & 04. 목표 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 03. 문제 */}
          <section className="p-6 rounded-2xl bg-[#121626]/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>03. 현재 직면한 산업 문제 (Problem)</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {challenge.problemStatement}
            </p>
          </section>

          {/* 04. 목표 */}
          <section className="p-6 rounded-2xl bg-[#121626]/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
              <Target className="w-4 h-4" />
              <span>04. 학생팀 해결 목표 (Project Goal)</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {challenge.goal}
            </p>
          </section>
        </div>

        {/* 05. Background */}
        <section className="p-6 rounded-2xl bg-[#121626]/70 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-2">
            <FileText className="w-4 h-4" />
            <span>05. 산업적 배경 및 기술적 맥락 (Background)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {challenge.background}
          </p>
        </section>

        {/* 06. 팀 구성 및 전공별 역할 */}
        <section className="p-6 md:p-7 rounded-2xl bg-[#121626] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>06. 팀 구성 및 학과별 역할 (Team & Roles)</span>
            </div>
            <span className="text-xs text-slate-400">
              타 전공 학생과의 다학제 융합 팀 매칭 지원
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenge.majorRequirements.map((req) => {
              const isFilled = req.currentMembers >= req.capacity;

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isFilled
                      ? "bg-slate-900/60 border-slate-800 opacity-75"
                      : "bg-[#181d2f]/80 border-slate-700/80 hover:border-indigo-500/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-bold text-white">
                        {req.majorCategoryName}
                      </span>
                      {isFilled ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          모집 완료
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800/40">
                          {req.capacity - req.currentMembers}명 모집중
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-indigo-300 mb-2">
                      {req.roleName}
                    </h4>

                    <div className="space-y-1 mb-3">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        요구 역량:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {req.requiredSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-1.5 py-0.5 rounded bg-slate-800/90 text-slate-300 text-[10px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      인원: {req.currentMembers} / {req.capacity}명
                    </span>

                    {!isFilled && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMajorForApply(req.majorCategoryName);
                          setIsTeamModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                      >
                        지원하기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 07. 필요 역량 Skill Chips */}
        <section className="p-6 rounded-2xl bg-[#121626]/70 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-3">
            <Sparkles className="w-4 h-4" />
            <span>07. 종합 필요 역량 및 기술 스택 (Skills)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {challenge.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-200"
              >
                #{skill}
              </span>
            ))}
          </div>
        </section>

        {/* 08. 활용 가능한 IP / Resources (산학협력 IP 핵심 섹션) */}
        <section className="p-6 md:p-7 rounded-2xl bg-[#121626] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>08. 제공 가능한 산업 IP 및 연구 자원 (Available Resources)</span>
            </div>
            <span className="text-xs text-cyan-400 font-semibold hidden sm:inline">
              Verified Industry Assets
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            과제 수행에 활용할 수 있도록 기관이 사전 인가한 데이터셋, 공개 특허, 브랜드 에셋 및 계측 장비입니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {challenge.resources.map((res) => (
              <div
                key={res.id}
                onClick={() => {
                  setSelectedResource(res);
                  setIsResourceModalOpen(true);
                }}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      {getResourceTypeIcon(res.type)}
                      <span className="text-[11px] uppercase">{res.type}</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        res.accessLevel === "PUBLIC"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                          : res.accessLevel === "UNIVERSITY_ONLY"
                          ? "bg-blue-950 text-blue-400 border border-blue-800/40"
                          : "bg-purple-950 text-purple-400 border border-purple-800/40"
                      }`}
                    >
                      {res.accessLevel}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 mb-1">
                    {res.title}
                  </h5>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[130px]">{res.providerName || "협력 기관"}</span>
                  {res.url ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
                    >
                      <span>원천 데이터 ↗</span>
                    </a>
                  ) : (
                    <span className="text-cyan-400 font-semibold group-hover:underline">상세보기 &rarr;</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 09. 예상 Outcome */}
        <section className="p-6 rounded-2xl bg-[#121626]/70 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>09. 프로젝트 예상 산출물 (Expected Outcomes)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {challenge.expectedOutcomes.map((outcome, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300"
              >
                <div className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 10. 일정 (Timeline Milestones) */}
        <section className="p-6 md:p-7 rounded-2xl bg-[#121626] border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white mb-4">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>10. 프로젝트 진행 로드맵 & 마일스톤 (Timeline)</span>
          </div>

          <div className="space-y-3">
            {challenge.timeline.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 gap-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : item.status === "current"
                        ? "bg-indigo-600 text-white font-extrabold animate-pulse"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs md:text-sm font-bold text-white">
                      {item.phase}
                    </h5>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <span className="text-[11px] text-indigo-300 font-mono font-semibold">
                    {item.period}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      item.status === "completed"
                        ? "bg-emerald-950 text-emerald-400"
                        : item.status === "current"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-700/50"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {item.status === "completed" ? "완료" : item.status === "current" ? "진행중" : "예정"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 하단 Sticky CTA 바 */}
      <ChallengeStickyCTA
        challenge={challenge}
        selectedMajor={selectedMajorForApply}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
      />

      {/* 팀 참여 신청 모달 */}
      <TeamApplicationModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        challenge={challenge}
        initialMajor={selectedMajorForApply}
      />

      {/* 산학협력 IP / Resource 상세 모달 */}
      <ResourceDetailModal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        resource={selectedResource}
      />
    </div>
  );
}
