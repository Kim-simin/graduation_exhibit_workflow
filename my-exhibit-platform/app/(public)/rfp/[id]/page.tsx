"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { getRfpById, getContentsForEntity } from "@/lib/data";
import { RFPSubmission } from "@/types";
import {
  Briefcase,
  Calendar,
  Award,
  Shield,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  FileText,
  Lightbulb,
  Layers,
  Send,
  Sparkles,
  Building2,
} from "lucide-react";
import CorporateOfferModal from "@/components/monetization/CorporateOfferModal";

export default function RFPDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const rfp = getRfpById(id);
  const relatedContents = getContentsForEntity(id, "rfp");

  const [activeOffer, setActiveOffer] = useState<{
    submission: RFPSubmission;
    type: "internship" | "contract";
  } | null>(null);

  if (!rfp) {
    return notFound();
  }

  return (
    <div style={{ maxWidth: "76rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 상단 뒤로가기 */}
      <Link
        href="/rfp"
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
        전체 기업 과제(RFP) 목록으로 돌아가기
      </Link>

      {/* RFP 공고 헤더 카드 */}
      <div
        style={{
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "1rem",
          padding: "2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "2rem" }}>{rfp.company_logo || "🏢"}</span>
            <div>
              <div style={{ fontSize: "0.8125rem", color: "#38bdf8", fontWeight: 700 }}>
                {rfp.company_industry}
              </div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                {rfp.company_name}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                fontWeight: 700,
              }}
            >
              제출 접수중
            </span>
            <span style={{ fontSize: "0.8125rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Calendar style={{ width: "0.875rem", height: "0.875rem" }} /> 마감: {rfp.deadline}
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", margin: "0 0 1rem", lineHeight: 1.3 }}>
          {rfp.title}
        </h1>

        {/* 영업기밀 보호형 브리프 본문 */}
        <div
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.6)",
            border: "1px solid #334155",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#38bdf8",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              marginBottom: "0.5rem",
            }}
          >
            <Shield style={{ width: "0.875rem", height: "0.875rem" }} />
            기업 비밀 보호형 브리프 (Abstract Brief)
          </div>
          <p style={{ fontSize: "0.9375rem", color: "#e2e8f0", lineHeight: 1.7, margin: "0 0 0.85rem" }}>
            {rfp.abstract_brief}
          </p>
          <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
            <strong>문제 상세:</strong> {rfp.problem_statement}
          </p>
        </div>

        {/* 제출 자격 & 보상 배지 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            marginBottom: "1.5rem",
            fontSize: "0.8125rem",
          }}
        >
          <div>
            <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.25rem" }}>
              <CheckCircle2 style={{ width: "0.875rem", height: "0.875rem", color: "#10b981" }} /> 대학생 전용 제출 자격
            </span>
            <strong style={{ color: "#ffffff" }}>{rfp.target_qualifications}</strong>
          </div>
          <div>
            <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.25rem" }}>
              <Award style={{ width: "0.875rem", height: "0.875rem", color: "#f59e0b" }} /> 상금 및 채용 혜택
            </span>
            <strong style={{ color: "#fde68a" }}>{rfp.budget_or_reward}</strong>
          </div>
        </div>

        {/* 산학협력 수요 신호 & 실제 채용 교차검증 브리프 */}
        {(rfp.corroboration_status || rfp.cooperation_signal || (rfp.verified_required_skills && rfp.verified_required_skills.length > 0)) && (
          <div
            style={{
              padding: "1.25rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              marginBottom: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 style={{ width: "1rem", height: "1rem", color: "#60a5fa" }} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#93c5fd" }}>
                  산학협력 수요 신호 & 실제 채용공고 교차검증 완료
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.6875rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(37, 99, 235, 0.2)",
                  color: "#60a5fa",
                  fontWeight: 700,
                  border: "1px solid rgba(96, 165, 250, 0.3)",
                }}
              >
                신뢰도 판정: {rfp.corroboration_status || "CORROBORATED"}
              </span>
            </div>

            {rfp.cooperation_signal && (
              <p style={{ fontSize: "0.8125rem", color: "#cbd5e1", margin: 0 }}>
                <strong>공식 산학협력 프로젝트:</strong> {rfp.cooperation_signal}
              </p>
            )}

            {rfp.verified_required_skills && rfp.verified_required_skills.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
                  실제 채용 검증 필수 역량:
                </span>
                {rfp.verified_required_skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "0.25rem",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#34d399",
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Link
            href={`/rfp/submit?rfp_id=${rfp.id}`}
            style={{
              padding: "0.85rem 1.5rem",
              borderRadius: "0.5rem",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            <PlusCircle style={{ width: "1.1rem", height: "1.1rem" }} />
            <span>이 과제에 3단계 해결안 제출하기</span>
          </Link>
        </div>
      </div>

      {/* 학생 제출물 피드 뷰어 */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              대학생 해결안 제안 피드 ({rfp.submissions.length}건)
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
              [1. 문제점 인지] ➔ [2. 창의적 해결방안] ➔ [3. 핵심 결과물/프로토타입] 3단계 정형화 뷰
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          {rfp.submissions.map((sub) => (
            <div
              key={sub.id}
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "1rem",
                padding: "1.75rem",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* 제출자 헤더 */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                    {sub.summary_title}
                  </h3>
                  <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                    제안자: <strong style={{ color: "#a5b4fc" }}>{sub.student_name}</strong> ({sub.university} {sub.department}) · 제출일: {sub.submitted_at}
                  </div>
                </div>

                {/* 기업 전용 액션 버튼 2개 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setActiveOffer({ submission: sub, type: "internship" })}
                    style={{
                      padding: "0.5rem 0.85rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      border: "1px solid rgba(99, 102, 241, 0.35)",
                      color: "#a5b4fc",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <Award style={{ width: "0.875rem", height: "0.875rem" }} />
                    인턴/채용 오퍼
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveOffer({ submission: sub, type: "contract" })}
                    style={{
                      padding: "0.5rem 0.85rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      color: "#34d399",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <FileText style={{ width: "0.875rem", height: "0.875rem" }} />
                    외주/산학 계약 전환
                  </button>
                </div>
              </div>

              {/* 3단계 포맷 카드 그리드 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* 1단계: 문제점 인지 */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid #334155",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#f43f5e",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <FileText style={{ width: "0.875rem", height: "0.875rem" }} />
                    1단계: 문제점 인지
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
                    {sub.problem_recognition}
                  </p>
                </div>

                {/* 2단계: 창의적 해결방안 */}
                <div
                  style={{
                    backgroundColor: "rgba(30, 41, 59, 0.6)",
                    border: "1px solid #334155",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Lightbulb style={{ width: "0.875rem", height: "0.875rem" }} />
                    2단계: 창의적 해결방안
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
                    {sub.solution}
                  </p>
                </div>
              </div>

              {/* 3단계: 핵심 결과물 / 프로토타입 이미지 */}
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Layers style={{ width: "0.875rem", height: "0.875rem" }} />
                  3단계: 핵심 결과물 / 프로토타입 렌더링
                </div>
                <div
                  style={{
                    height: "18rem",
                    backgroundColor: "#1e293b",
                    borderRadius: "0.5rem",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={sub.outcome_image}
                    alt={sub.summary_title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 8: 검증된 과제 연계 콘텐츠 (Related Content Intelligence) */}
      {relatedContents.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles style={{ width: "1.2rem", height: "1.2rem", color: "#f43f5e" }} />
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                기업 RFP 및 요구 역량 연계 콘텐츠 ({relatedContents.length}건)
              </h2>
            </div>
            <span
              style={{
                fontSize: "0.6875rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(244, 63, 94, 0.15)",
                color: "#fda4af",
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
                    <span style={{ fontSize: "0.75rem", color: "#f43f5e", fontWeight: 600 }}>
                      {(cnt.platform || "").toUpperCase()} · {(cnt.content_type || "").toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>
                    ID: {cnt.content_id} (v{cnt.version})
                  </span>
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                  {cnt.title}
                </h3>

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
                    타겟: {cnt.target_audience}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 기업 오퍼 / 계약 모달 */}
      {activeOffer && (
        <CorporateOfferModal
          submission={activeOffer.submission}
          rfpTitle={rfp.title}
          companyName={rfp.company_name}
          type={activeOffer.type}
          isOpen={!!activeOffer}
          onClose={() => setActiveOffer(null)}
        />
      )}
    </div>
  );
}
