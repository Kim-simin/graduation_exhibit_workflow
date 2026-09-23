"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getProfessorById, getContentsForEntity } from "@/lib/data";
import {
  GraduationCap,
  BookOpen,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Gift,
  ExternalLink,
  ChevronRight,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Palette,
} from "lucide-react";
import AcademyConsultModal from "@/components/monetization/AcademyConsultModal";

export default function ProfessorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const initialProfessor = getProfessorById(id);
  const [professor, setProfessor] = useState<any>(initialProfessor);
  const [isLoading, setIsLoading] = useState(!initialProfessor);
  const relatedContents = getContentsForEntity(id, "professor");

  const [isConsultOpen, setIsConsultOpen] = useState(false);

  useEffect(() => {
    if (!professor) {
      fetch("/api/professors")
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "SUCCESS" && Array.isArray(data.professors)) {
            const found = data.professors.find((p: any) => p.id === id);
            if (found) {
              setProfessor(found);
            }
          }
        })
        .catch((err) => console.warn("Failed to fetch professor dynamically:", err))
        .finally(() => setIsLoading(false));
    }
  }, [id, professor]);

  if (isLoading) {
    return (
      <div style={{ maxWidth: "76rem", margin: "0 auto", padding: "4rem 1.25rem", textAlign: "center", color: "#94a3b8" }}>
        교수진 및 연구실 정보를 로드하는 중입니다...
      </div>
    );
  }

  if (!professor) {
    return notFound();
  }

  const banner = professor.partner_academy_banner;

  return (
    <div style={{ maxWidth: "76rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 상단 뒤로가기 */}
      <Link
        href="/professors"
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
        전체 교수진 및 학과 목록으로 돌아가기
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
        {/* 교수 헤더 카드 */}
        <div
          style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "1rem",
            padding: "2rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.75rem", alignItems: "flex-start" }}>
            <img
              src={professor.avatar_url}
              alt={professor.name}
              style={{
                width: "6rem",
                height: "6rem",
                borderRadius: "9999px",
                objectFit: "cover",
                border: "3px solid #6366f1",
              }}
            />

            <div style={{ flex: "1 1 360px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  {professor.name} 교수
                </h1>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    color: "#a5b4fc",
                    fontWeight: 600,
                  }}
                >
                  {professor.title}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(6, 182, 212, 0.15)",
                    color: "#22d3ee",
                    fontWeight: 600,
                  }}
                >
                  {professor.lab_name}
                </span>
              </div>

              <p style={{ fontSize: "0.9375rem", color: "#94a3b8", margin: "0 0 0.85rem" }}>
                {professor.university} {professor.department}
              </p>

              <p style={{ fontSize: "0.9375rem", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 1rem" }}>
                {professor.bio}
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {professor.research_areas?.map((area: string) => (
                  <span
                    key={area}
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      backgroundColor: "#1e293b",
                      color: "#94a3b8",
                      border: "1px solid #334155",
                    }}
                  >
                    #{area}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: "1rem" }}>
                <Link
                  href={`/?search=${encodeURIComponent(professor.university)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    color: "#a5b4fc",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <Palette style={{ width: "0.875rem", height: "0.875rem" }} />
                  {professor.university} {professor.department} 졸업전시회 출품작 보기
                  <ChevronRight style={{ width: "0.75rem", height: "0.75rem" }} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2열 레이아웃: 좌측(학기 과제 + 학생 제출물) / 우측(B2B 입시 미술학원 연계 배너) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          {/* 좌측: 학기 과제 설명 & 학생 쇼케이스 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* 핵심 과제 설명 섹션 */}
            <div
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "1rem",
                padding: "1.75rem",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#f59e0b",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                }}
              >
                <BookOpen style={{ width: "0.875rem", height: "0.875rem" }} />
                {professor.assignment_details?.semester ?? "학기 미확인"} 지정 과제
              </div>

              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.85rem" }}>
                {professor.assignment_details?.title ?? "과제 명칭 확인된 정보 없음"}
              </h2>

              {/* 1줄 핵심 설명 강조 박스 */}
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  borderLeft: "4px solid #f59e0b",
                  padding: "1rem",
                  borderRadius: "0 0.5rem 0.5rem 0",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700, marginBottom: "0.25rem" }}>
                  과제 1줄 핵심 문제의식:
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.5 }}>
                  "{professor.assignment_one_liner ?? "확인된 정보 없음"}"
                </div>
              </div>

              <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                <strong>연구 및 과제 목표:</strong> {professor.assignment_details?.objective ?? "확인된 정보 없음"}
              </p>
            </div>

            {/* 산학협력 프로젝트 및 연계 기업 섹션 (Industry-Academia Cooperation Intelligence) */}
            {professor.industry_collaborations && professor.industry_collaborations.length > 0 && (
              <div
                style={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "1rem",
                  padding: "1.75rem",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ padding: "0.4rem", borderRadius: "0.5rem", backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa" }}>
                      <Building2 style={{ width: "1.2rem", height: "1.2rem" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                        공식 산학협력 프로젝트 및 연계 기업 ({professor.industry_collaborations.length}건)
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        대학 산학협력단(LINC 3.0) 및 공식 기업 산학협약 기반 교차검증 완료
                      </span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "9999px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <CheckCircle2 style={{ width: "0.75rem", height: "0.75rem" }} /> VERIFIED COLLABORATION
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                  {professor.industry_collaborations.map((collab: any, idx: number) => (
                    <div
                      key={collab.id || idx}
                      style={{
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#60a5fa" }}>
                            🏢 {collab.company}
                          </span>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: "rgba(99, 102, 241, 0.2)",
                              color: "#a5b4fc",
                              fontWeight: 600,
                            }}
                          >
                            {collab.cooperation_type || "산학공동연구"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontFamily: "monospace" }}>
                          {collab.period}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#ffffff" }}>
                        {collab.title}
                      </div>
                      {collab.reward_or_budget && (
                        <div style={{ fontSize: "0.75rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <ShieldCheck style={{ width: "0.875rem", height: "0.875rem" }} />
                          지원 혜택: {collab.reward_or_budget}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 학생 제출물 썸네일 그리드 쇼케이스 */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  해당 과제 우수 학생 제출물 ({professor.student_submissions.length}건)
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
                {professor.student_submissions.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #1e293b",
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ height: "14rem", backgroundColor: "#1e293b", position: "relative" }}>
                      <img
                        src={sub.image?.startsWith("http") || sub.image?.startsWith("/") ? sub.image : `/${sub.image}`}
                        alt={sub.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80";
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                          {sub.title}
                        </h4>
                        <span style={{ fontSize: "0.8125rem", color: "#818cf8", fontWeight: 600 }}>
                          출품자: {sub.student_name}
                        </span>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#1e293b",
                          padding: "0.75rem",
                          borderRadius: "0.5rem",
                          border: "1px solid #334155",
                          fontSize: "0.8125rem",
                          color: "#cbd5e1",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                          lineHeight: 1.5,
                        }}
                      >
                        <MessageSquare style={{ width: "1rem", height: "1rem", flexShrink: 0, marginTop: "0.15rem", color: "#f59e0b" }} />
                        <div>
                          <strong style={{ color: "#f59e0b" }}>지도교수 총평:</strong> {sub.comment}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 8: 검증된 AI 콘텐츠 연계 섹션 (Related Content Intelligence) */}
            {relatedContents.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles style={{ width: "1.1rem", height: "1.1rem", color: "#818cf8" }} />
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                      지도교수 연구 및 학기 과제 연계 콘텐츠 ({relatedContents.length}건)
                    </h3>
                  </div>
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
                    STEP 8 Verified Content
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                  {relatedContents.map((cnt) => (
                    <div
                      key={cnt.content_id}
                      style={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #1e293b",
                        borderRadius: "0.75rem",
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              fontWeight: 700,
                            }}
                          >
                            {cnt.status === "APPROVED" ? "공식 승인됨 (APPROVED)" : "QA 검증 완료 (QA_PASSED)"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600 }}>
                            {(cnt.platform || "").toUpperCase()} · {(cnt.content_type || "").toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>
                          ID: {cnt.content_id} (v{cnt.version})
                        </span>
                      </div>

                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                        {cnt.title}
                      </h4>

                      <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
                        "{cnt.hook}"
                      </p>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {(cnt.keywords ?? []).slice(0, 4).map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "0.6875rem",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "0.25rem",
                              backgroundColor: "#1e293b",
                              color: "#cbd5e1",
                            }}
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          backgroundColor: "#1e293b",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.75rem",
                          color: "#cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <strong style={{ color: "#f59e0b" }}>출처 근거:</strong> {(cnt.source_traceability ?? []).length}건 매핑 완료
                        </span>
                        <span style={{ color: "#38bdf8" }}>
                          목적: {cnt.objective}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 우측 사이드바: 입시 미술학원 B2B 연계 배너 컴포넌트 */}
          <div>
            <div
              style={{
                backgroundColor: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "1rem",
                padding: "1.75rem",
                boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)",
                position: "sticky",
                top: "5.5rem",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                }}
              >
                <Gift style={{ width: "0.8rem", height: "0.8rem" }} />
                제휴 입시 학원 B2B 특별 프로모션
              </div>

              <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                이 전공·대학에 진학하려면?
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.75rem", lineHeight: 1.3 }}>
                2026 {professor.university} {professor.department} 입시 합격 전략 가이드
              </h3>

              <div
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.7)",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fde68a", marginBottom: "0.35rem" }}>
                  {banner.academy_name}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                  {banner.slogan}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem" }}>
                  문의: {banner.phone} · 프로모션 코드: <strong style={{ color: "#38bdf8" }}>{banner.discount_code}</strong>
                </div>
              </div>

              <p style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5, marginBottom: "1.5rem" }}>
                본 학과의 실기 및 비실기 서류 전형 요강, 역대 합격생 우수 재현작 분석 자료를 1:1 맞춤 컨설팅과 함께 무료 제공합니다.
              </p>

              <button
                type="button"
                onClick={() => setIsConsultOpen(true)}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f59e0b",
                  border: "none",
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
                }}
              >
                <span>합격 가이드북 무료 신청하기</span>
                <ChevronRight style={{ width: "1.1rem", height: "1.1rem" }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 상담 모달 연동 */}
      <AcademyConsultModal
        banner={banner}
        university={professor.university}
        department={professor.department}
        isOpen={isConsultOpen}
        onClose={() => setIsConsultOpen(false)}
      />
    </div>
  );
}
