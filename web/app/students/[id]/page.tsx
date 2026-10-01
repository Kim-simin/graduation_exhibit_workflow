"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getStudentById, getMatchedJobsForStudent } from "@/lib/data";
import {
  Briefcase,
  Palette,
  Sparkles,
  Mail,
  Share2,
  ExternalLink,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  Building2,
} from "lucide-react";
import ScoutModal from "@/components/monetization/ScoutModal";
import FreelanceProjectModal from "@/components/monetization/FreelanceProjectModal";

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const student = getStudentById(id);

  const [isScoutOpen, setIsScoutOpen] = useState(false);
  const [isFreelanceOpen, setIsFreelanceOpen] = useState(false);
  const [expandedPortfolioId, setExpandedPortfolioId] = useState<string | null>(
    student ? student.portfolio_items[0]?.id || null : null
  );

  if (!student) {
    return notFound();
  }

  const matchedJobs = getMatchedJobsForStudent(student);

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 상단 뒤로가기 */}
      <Link
        href="/students"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "#94a3b8",
          fontSize: "0.875rem",
          textDecoration: "none",
          marginBottom: "1.5rem",
        }}
      >
        <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
        전체 대학생 인재 목록으로 돌아가기
      </Link>

      {/* 프로필 헤더 카드 */}
      <div
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "1rem",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "flex-start" }}>
          {/* 인적사항 및 바이오 (프로필사진 없음) */}
          <div style={{ flex: "1 1 360px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  {student.name}
                </h1>
                <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "0.875rem" }}>
                  [UI용 테스트/시드]
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  color: "#a5b4fc",
                  border: "1px solid rgba(99, 102, 241, 0.35)",
                }}
              >
                희망직무: {student.role}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "0.25rem",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                검증 증거: UI용 테스트/시드
              </span>
            </div>

            <p style={{ fontSize: "0.9375rem", color: "#94a3b8", margin: "0 0 1rem" }}>
              <GraduationCap style={{ width: "1rem", height: "1rem", display: "inline", verticalAlign: "middle", marginRight: "0.35rem" }} />
              {student.university} {student.department} ({student.year}학년)
            </p>

            <p style={{ fontSize: "0.9375rem", color: "#e2e8f0", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
              {student.bio}
            </p>

            {/* 스킬 목록 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
              {student.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "#1e293b",
                    color: "#cbd5e1",
                    border: "1px solid #334155",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>

            {/* SNS 링크 */}
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", color: "#94a3b8" }}>
              {student.sns_links.behance && (
                <a
                  href={student.sns_links.behance}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#38bdf8", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  Behance <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                </a>
              )}
              {student.sns_links.linkedin && (
                <a
                  href={student.sns_links.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#818cf8", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  LinkedIn <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                </a>
              )}
              {student.sns_links.instagram && (
                <a
                  href={student.sns_links.instagram}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#f43f5e", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
                >
                  Instagram <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 3대 핵심 수익화 액션 CTA 바 */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #1e293b",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {/* 1. 기업 스카우트 제안 */}
          <button
            type="button"
            onClick={() => setIsScoutOpen(true)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#6366f1",
              border: "none",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Briefcase style={{ width: "1.1rem", height: "1.1rem" }} />
            <span>인재 스카우트 제안</span>
          </button>

          {/* 2. 에스크로 외주/프로젝트 의뢰 */}
          <button
            type="button"
            onClick={() => setIsFreelanceOpen(true)}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#34d399",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Palette style={{ width: "1.1rem", height: "1.1rem" }} />
            <span>외주/프로젝트 협업 의뢰</span>
          </button>

          {/* 3. 멘토링 피드백 요청 딥링크 */}
          <Link
            href={`/mentoring?student_id=${student.id}&portfolio=${encodeURIComponent(
              student.portfolio_items[0]?.title || ""
            )}`}
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#fbbf24",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Sparkles style={{ width: "1.1rem", height: "1.1rem" }} />
            <span>멘토링 피드백 요청하기</span>
          </Link>
        </div>
      </div>

      {/* 포트폴리오 쇼케이스 갤러리 */}
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", marginBottom: "1.25rem" }}>
          대표 졸업작품 & 포트폴리오 아카이브
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          {student.portfolio_items.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "1rem",
                overflow: "hidden",
              }}
            >
              <div style={{ height: "26rem", backgroundColor: "#1e293b", position: "relative" }}>
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    backdropFilter: "blur(6px)",
                    fontSize: "0.75rem",
                    color: "#e2e8f0",
                    fontWeight: 600,
                  }}
                >
                  {item.category} · {item.year}
                </div>
              </div>

              <div style={{ padding: "1.75rem" }}>
                <h3 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.75rem" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
                  {item.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "9999px",
                        backgroundColor: "#1e293b",
                        color: "#94a3b8",
                        border: "1px solid #334155",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* 메인 이미지 밑 포트폴리오 더보기 란 */}
                <div style={{ marginTop: "1.5rem", borderTop: "1px solid #1e293b", paddingTop: "1.25rem" }}>
                  <button
                    type="button"
                    onClick={() => setExpandedPortfolioId(expandedPortfolioId === item.id ? null : item.id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1.25rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(30, 41, 59, 0.6)",
                      border: "1px solid #334155",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Layers style={{ width: "1.1rem", height: "1.1rem", color: "#818cf8" }} />
                      <span>포트폴리오 상세 더보기 (프로젝트 기획서 & 실무 프로세스 분석)</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                      <span>{expandedPortfolioId === item.id ? "상세 접기" : "포트폴리오 더보기"}</span>
                      {expandedPortfolioId === item.id ? (
                        <ChevronUp style={{ width: "1rem", height: "1rem" }} />
                      ) : (
                        <ChevronDown style={{ width: "1rem", height: "1rem" }} />
                      )}
                    </div>
                  </button>

                  {/* 펼쳐졌을 때의 상세 내용 */}
                  {expandedPortfolioId === item.id && (
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1.5rem",
                        borderRadius: "0.75rem",
                        backgroundColor: "#0b1120",
                        border: "1px solid #1e293b",
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.25rem",
                      }}
                    >
                      {/* 1. 기획 배경 및 문제 정의 */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                          <FileText style={{ width: "0.875rem", height: "0.875rem", color: "#38bdf8" }} />
                          <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                            1. 프로젝트 기획 배경 및 문제 정의 (Background & Problem Definition)
                          </h4>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                          복잡하고 파편화된 데이터 구조 속에서 사용자가 직관적으로 정보를 인지하고 즉각적인 결정을 내릴 수 있도록 돕는 인터페이스 설계에 중점을 두었습니다. 기존 서비스들이 겪고 있던 정보 과부하와 높은 이탈률 문제를 개선하기 위해 단계별 정보 시각화 아키텍처를 수립하였습니다.
                        </p>
                      </div>

                      {/* 2. 핵심 솔루션 및 인터랙션 구조 */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                          <Sparkles style={{ width: "0.875rem", height: "0.875rem", color: "#818cf8" }} />
                          <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
                            2. 핵심 솔루션 & 사용자 인터랙션 플로우 (Key Solution & Interaction)
                          </h4>
                        </div>
                        <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                          • <strong>직관적 마이크로 인터랙션:</strong> 조작 시 즉각적인 시각적 피드백과 모션 그래픽을 적용하여 학습 비용 최소화<br />
                          • <strong>확장형 모듈 디자인:</strong> 컴포넌트 기반 디자인 시스템을 설계하여 다양한 뷰포트와 디바이스 환경에서 일관된 사용자 경험 제공<br />
                          • <strong>실제 유저 테스트 검증:</strong> 타깃 사용자 15명을 대상으로 UT(Usability Test)를 진행하여 작업 수행 속도 38% 향상 검증 완료
                        </p>
                      </div>

                      {/* 3. 역할 및 사용 툴 명세 */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", backgroundColor: "#131d31", padding: "1rem", borderRadius: "0.5rem" }}>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>담당 역할 및 기여도</span>
                          <p style={{ fontSize: "0.8125rem", color: "#ffffff", fontWeight: 700, margin: "0.25rem 0 0" }}>
                            {student.role} (개인 주도 프로젝트 · 기여도 100%)
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>활용 툴 및 프레임워크</span>
                          <p style={{ fontSize: "0.8125rem", color: "#818cf8", fontWeight: 700, margin: "0.25rem 0 0" }}>
                            {student.skills.join(" · ")}
                          </p>
                        </div>
                        <div>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>졸업전시 출품 연도</span>
                          <p style={{ fontSize: "0.8125rem", color: "#34d399", fontWeight: 700, margin: "0.25rem 0 0" }}>
                            {item.year}학년도 졸업작품 (평가 우수작)
                          </p>
                        </div>
                      </div>

                      {/* 4. 원본 포트폴리오 및 자료 링크 */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", paddingTop: "0.5rem" }}>
                        {student.sns_links.behance && (
                          <a
                            href={student.sns_links.behance}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "0.5rem 0.85rem",
                              borderRadius: "0.375rem",
                              backgroundColor: "rgba(56, 189, 248, 0.15)",
                              border: "1px solid rgba(56, 189, 248, 0.35)",
                              color: "#38bdf8",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            Behance 원본 포트폴리오 전체 보기 <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                          </a>
                        )}
                        {student.sns_links.github && (
                          <a
                            href={student.sns_links.github}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "0.5rem 0.85rem",
                              borderRadius: "0.375rem",
                              backgroundColor: "rgba(148, 163, 184, 0.15)",
                              border: "1px solid rgba(148, 163, 184, 0.35)",
                              color: "#cbd5e1",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            GitHub 소스코드 및 데모 보기 <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                          </a>
                        )}
                        {student.sns_links.linkedin && (
                          <a
                            href={student.sns_links.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "0.5rem 0.85rem",
                              borderRadius: "0.375rem",
                              backgroundColor: "rgba(99, 102, 241, 0.15)",
                              border: "1px solid rgba(99, 102, 241, 0.35)",
                              color: "#818cf8",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            LinkedIn 이력 및 네트워킹 <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsScoutOpen(true)}
                          style={{
                            padding: "0.5rem 0.85rem",
                            borderRadius: "0.375rem",
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#34d399",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            marginLeft: "auto",
                          }}
                        >
                          <Briefcase style={{ width: "0.75rem", height: "0.75rem" }} />
                          이 포트폴리오로 스카우트 제안
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 학생 포트폴리오 연계 매핑 채용공고 (Mapped Job Postings) */}
      {matchedJobs.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Briefcase style={{ width: "1.35rem", height: "1.35rem", color: "#6366f1" }} />
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                학생 포트폴리오 연계 매핑 채용공고 ({matchedJobs.length}건)
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  fontWeight: 800,
                }}
              >
                UI용 테스트/시드 매핑
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "#a5b4fc",
                  fontWeight: 600,
                }}
              >
                포트폴리오 역량 100% 매칭
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
            {matchedJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                }}
              >
                {/* 상단 기업명 + UI용 테스트/시드 표기 + 매칭률 */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>{job.logoEmoji || "🏢"}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff" }}>
                        {job.companyName}
                      </span>
                      <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "0.75rem" }}>
                        [UI용 테스트/시드]
                      </span>
                    </div>
                    {job.isPartnership && (
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "0.25rem",
                          backgroundColor: "rgba(99, 102, 241, 0.2)",
                          color: "#a5b4fc",
                          fontWeight: 700,
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                        }}
                      >
                        산학협력 기업
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        color: "#34d399",
                        fontWeight: 700,
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      {job.employmentType} · {job.careerLevel}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        color: "#60a5fa",
                        fontWeight: 700,
                      }}
                    >
                      역량 매칭률 98%
                    </span>
                  </div>
                </div>

                {/* 공고 타이틀 */}
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.35rem" }}>
                    {job.title}
                  </h3>
                  <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0 }}>
                    근무지: {job.location || "서울/수도권"} · 마감일: {job.deadline || "채용 시 마감"}
                  </p>
                </div>

                {/* 포트폴리오 연계 매핑 근거 */}
                <div
                  style={{
                    backgroundColor: "#1e293b",
                    borderLeft: "3px solid #6366f1",
                    padding: "0.85rem 1rem",
                    borderRadius: "0 0.5rem 0.5rem 0",
                    fontSize: "0.8125rem",
                    color: "#cbd5e1",
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.25rem", color: "#818cf8", fontWeight: 700 }}>
                    <Sparkles style={{ width: "0.875rem", height: "0.875rem" }} />
                    포트폴리오 연계 매핑 근거:
                  </div>
                  <span>
                    {student.name} 학생의 대표 졸업작품 <strong>[{student.portfolio_items[0]?.title}]</strong>에서 입증된{" "}
                    <strong style={{ color: "#a5b4fc" }}>{(job.techStacks || []).slice(0, 3).join(", ")}</strong> 역량과 전공({student.department})이 해당 채용 포지션의 우대 자격 요건({(job.preferredDepartments || []).join(", ")})과 최우선 매칭되었습니다.
                  </span>
                </div>

                {/* 우대 전공 및 기술 스택 */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>우대 전공:</span>
                  {job.preferredDepartments?.map((dept) => (
                    <span
                      key={dept}
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "#1e293b",
                        color: "#94a3b8",
                        border: "1px solid #334155",
                      }}
                    >
                      {dept}
                    </span>
                  ))}

                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginLeft: "0.5rem" }}>기술 스택:</span>
                  {job.techStacks?.map((tech) => (
                    <span
                      key={tech}
                      style={{
                        fontSize: "0.6875rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "rgba(99, 102, 241, 0.1)",
                        color: "#818cf8",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* 하단 검증 증거 및 액션 버튼 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid #1e293b",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    <strong style={{ color: "#ef4444" }}>원문 검증 증거 (Evidence):</strong>{" "}
                    <span style={{ color: "#ef4444", fontWeight: 800 }}>UI용 테스트/시드</span> · {job.evidenceText || "전공 적합성 및 실무 역량 검증 완료"}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <a
                      href={job.originUrl || job.sourceUrl || `/jobs`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "0.375rem",
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      채용공고 원문 <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} />
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsScoutOpen(true)}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "0.375rem",
                        backgroundColor: "rgba(99, 102, 241, 0.2)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        color: "#a5b4fc",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <Briefcase style={{ width: "0.75rem", height: "0.75rem" }} />
                      포트폴리오 연계 지원
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모달 연동 */}
      <ScoutModal student={student} isOpen={isScoutOpen} onClose={() => setIsScoutOpen(false)} />
      <FreelanceProjectModal
        student={student}
        isOpen={isFreelanceOpen}
        onClose={() => setIsFreelanceOpen(false)}
      />
    </div>
  );
}
