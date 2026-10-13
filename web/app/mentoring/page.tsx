'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Play,
  Layers,
  GraduationCap,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useRecommendations, ChallengeCard, FeedbackFeed } from '@/components/challenges/Challenges';

export default function MentoringHubPage() {
  const { items: recommendations, loading, error } = useRecommendations();

  return (
    <main className="grad-main">
      {/* 1. Header & Primary CTA */}
      <div className="grad-page-title">
        <p className="grad-kicker">INDUSTRY MENTORING & RECOMMENDED PROJECTS</p>
        <div className="grad-section-head flex-wrap gap-4">
          <div>
            <h1>현직자 멘토링 & 프로젝트 추천</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              대학 정규 교육과정과 산업 현장의 기술 격차를 줄이기 위해, 현업 전문가가 최신 기술과 실무 문제를 바탕으로 개인 프로젝트를 추천하고 피드백을 제공합니다.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/challenges/new" className="grad-button primary">
              <Sparkles size={16} />
              개인 프로젝트 추천하기
            </Link>
            <Link href="/projects?source=recommended" className="grad-button">
              추천 프로젝트 둘러보기 <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Three-tier Status Framework & Core Policy Notice */}
      <section className="industry-notice rounded-xl p-5 my-6 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>추천 및 검증 3단계 프레임워크 (Industry Verification Principles)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-amber-900">
          <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
            <strong className="block text-amber-950 mb-1 font-semibold">1. Industry Recommended</strong>
            <span>
              현직자가 실무 기술과 문제를 추천한 상태입니다. 실무 관련성 제안일 뿐이며, 학생 개인의 역량을 검증한 상태가 아닙니다.
            </span>
          </div>
          <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
            <strong className="block text-amber-950 mb-1 font-semibold">2. Industry Reviewed</strong>
            <span>
              학생이 프로젝트를 수행한 후, 현직자가 실제 결과물과 문제 해결 과정을 검토하고 평가 근거와 피드백을 남긴 상태입니다.
            </span>
          </div>
          <div className="p-3 bg-white/70 rounded-lg border border-amber-200">
            <strong className="block text-amber-950 mb-1 font-semibold">3. Employer Recognized</strong>
            <span>
              실제 채용·인사 권한이 있는 기업에서 성과 활용 및 인정 범위를 공식 확인한 경우에만 엄격히 표기됩니다.
            </span>
          </div>
        </div>
        <p className="text-[11px] text-amber-800 font-medium pt-1 border-t border-amber-200/60">
          ※ 본 플랫폼의 현직자 추천 프로젝트는 학생의 자율적 실무 역량 강화를 돕는 가이드이며, 특정 기업의 채용 가산점이나 공식 인정을 보장하지 않습니다.
        </p>
      </section>

      {/* 3. 5 Technical Resource Categories */}
      <section className="industry-section">
        <div className="grad-section-head">
          <div>
            <p className="grad-kicker">CURATED TOOLING</p>
            <h2>현직자가 추천하는 5대 기술 카테고리</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="industry-resource rounded-lg p-3.5">
            <span className="text-slate-500 font-semibold block mb-1">💻 1. Software</span>
            <strong className="text-slate-800 font-medium">Program / Software</strong>
            <p className="text-[11px] text-slate-500 mt-1">실제 산업 현장 표준 개발 도구 및 소프트웨어 스택</p>
          </div>
          <div className="industry-resource rounded-lg p-3.5">
            <span className="text-indigo-600 font-semibold block mb-1">🧠 2. AI Model</span>
            <strong className="text-slate-800 font-medium">AI Model</strong>
            <p className="text-[11px] text-slate-500 mt-1">문제 해결에 최적화된 LLM, 비전, 멀티모달 모델</p>
          </div>
          <div className="industry-resource rounded-lg p-3.5">
            <span className="text-teal-600 font-semibold block mb-1">🛠️ 3. AI Tool</span>
            <strong className="text-slate-800 font-medium">AI Tool & Service</strong>
            <p className="text-[11px] text-slate-500 mt-1">생산성을 극대화하는 검증된 개발·디자인 AI 도구</p>
          </div>
          <div className="industry-resource rounded-lg p-3.5">
            <span className="text-emerald-600 font-semibold block mb-1">⚡ 4. AI Skill</span>
            <strong className="text-slate-800 font-medium">Skill & Workflow</strong>
            <p className="text-[11px] text-slate-500 mt-1">AI 에이전트 실행 Skill 및 사람이 습득할 직무 역량</p>
          </div>
          <div className="industry-resource rounded-lg p-3.5">
            <span className="text-amber-600 font-semibold block mb-1">🔌 5. MCP</span>
            <strong className="text-slate-800 font-medium">MCP & Integration</strong>
            <p className="text-[11px] text-slate-500 mt-1">외부 데이터 및 서비스와 연동하는 안전한 프로토콜</p>
          </div>
        </div>
      </section>

      {/* 4. Latest Recommended Projects Grid */}
      <section className="industry-section">
        <div className="grad-section-head">
          <div>
            <p className="grad-kicker">PROJECTS TO START</p>
            <h2>현직자가 추천한 개인 프로젝트 ({recommendations.length})</h2>
          </div>
          <Link href="/projects?source=recommended" className="grad-text-link">
            전체보기 <ArrowRight size={16} />
          </Link>
        </div>

        {error && <p role="status" className="grad-error">{error}</p>}
        {loading && <p className="grad-empty">추천 프로젝트를 불러오는 중입니다.</p>}

        {!loading && recommendations.length > 0 && (
          <div className="industry-challenge-grid">
            {recommendations.slice(0, 6).map((item) => (
              <ChallengeCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && !recommendations.length && (
          <div className="grad-empty">
            <Briefcase size={32} />
            <h3>등록된 추천 프로젝트가 아직 없습니다</h3>
            <p>검증된 현직자 멘토로 참여하여 후배 대학생들을 위한 첫 실무 프로젝트를 제안해 보세요.</p>
            <Link href="/challenges/new" className="grad-button primary mt-2">
              <Sparkles size={16} /> 첫 프로젝트 추천하기
            </Link>
          </div>
        )}
      </section>

      {/* 5. Mentor Feedback Feed */}
      <FeedbackFeed />

      {/* 6. Mentor Participation & Benefit Guidance */}
      <section className="industry-section bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 my-6 border border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl">
          <p className="grad-kicker">FOR MENTORS</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            현직자 멘토로 참여하여 실무 경험을 나눠주세요
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            현직자의 프로젝트 추천 콘텐츠는 대학생들에게 전액 무료로 공개됩니다. 유료 강의 수강 여부와 관계없이 모든 학생이 참여할 수 있으며, 멘토 프로필을 통해 전문 분야, 소속, 강의 및 프로젝트 코칭 링크를 자연스럽게 알릴 수 있습니다.
          </p>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Link href="/challenges/new" className="grad-button primary">
              <Sparkles size={16} /> 개인 프로젝트 추천하기
            </Link>
            <Link href="/my?tab=profile" className="grad-button">
              내정보에서 멘토 프로필 등록
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
