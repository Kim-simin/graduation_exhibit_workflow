"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, notFound, useSearchParams } from "next/navigation";
import { getMentorById, getContentsForEntity } from "@/lib/data";
import {
  Sparkles,
  Star,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import MentoringBookingModal from "@/components/monetization/MentoringBookingModal";

function MentorDetailContent() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const prefilledPortfolio = searchParams.get("portfolio") || "";

  const mentor = getMentorById(id);
  const relatedContents = getContentsForEntity(id, "mentor");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  if (!mentor) {
    return notFound();
  }

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 상단 뒤로가기 */}
      <Link
        href="/mentoring"
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
        전체 멘토 리스트로 돌아가기
      </Link>

      {/* 멘토 프로필 카드 */}
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-start" }}>
          <div
            style={{
              width: "5.5rem",
              height: "5.5rem",
              borderRadius: "9999px",
              backgroundColor: "#1e293b",
              border: "3px solid #6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              flexShrink: 0,
            }}
          >
            {mentor.company_logo || "💼"}
          </div>

          <div style={{ flex: "1 1 360px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                {mentor.name} 멘토
              </h1>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(99, 102, 241, 0.2)",
                  color: "#a5b4fc",
                  fontWeight: 700,
                }}
              >
                실무 {mentor.experience_years}년차
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontSize: "0.9375rem", fontWeight: 700 }}>
                <Star style={{ width: "1.1rem", height: "1.1rem", fill: "#f59e0b" }} />
                <span>{mentor.rating.toFixed(1)}</span>
                <span style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: 400 }}>
                  ({mentor.review_count}개의 멘티 후기)
                </span>
              </div>
            </div>

            <p style={{ fontSize: "1rem", color: "#38bdf8", fontWeight: 600, margin: "0 0 0.85rem" }}>
              {mentor.company} · {mentor.role}
            </p>

            <p style={{ fontSize: "0.9375rem", color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
              {mentor.bio}
            </p>

            {/* 전문 분야 태그 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {mentor.specialties.map((spec) => (
                <span
                  key={spec}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "0.25rem",
                    backgroundColor: "rgba(99, 102, 241, 0.12)",
                    color: "#a5b4fc",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}
                >
                  #{spec}
                </span>
              ))}
            </div>
          </div>

          {/* 우측 상단 결제 및 예약 박스 */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              minWidth: "220px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              1:1 세션 (30분 화상 코칭)
            </div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", marginBottom: "1rem" }}>
              {mentor.price_per_session.toLocaleString()}원
            </div>
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "#6366f1",
                border: "none",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9375rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
              }}
            >
              지금 세션 예약하기
            </button>
            <div style={{ fontSize: "0.6875rem", color: "#6ee7b7", marginTop: "0.5rem" }}>
              C2C 중개 안전 에스크로 적용
            </div>
          </div>
        </div>
      </div>

      {/* 2열 레이아웃: 커리어 타임라인 & 멘티 리뷰 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
        {/* 좌측: 커리어 타임라인 */}
        <div
          style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "1rem",
            padding: "1.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Briefcase style={{ width: "1.25rem", height: "1.25rem", color: "#818cf8" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
              실무 커리어 타임라인
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {mentor.career_timeline.map((c, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  paddingLeft: "1.5rem",
                  borderLeft: "2px solid #334155",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "-0.4rem",
                    top: "0.2rem",
                    width: "0.75rem",
                    height: "0.75rem",
                    borderRadius: "9999px",
                    backgroundColor: "#6366f1",
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 600 }}>{c.period}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff", margin: "0.15rem 0" }}>
                  {c.company} · {c.role}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#94a3b8", lineHeight: 1.5 }}>
                  {c.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 이전 멘티 후기 & 예약 가능 시간대 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* 예약 가능 일정 */}
          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "1rem",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Calendar style={{ width: "1.25rem", height: "1.25rem", color: "#34d399" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                신청 가능한 타임슬롯
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {mentor.available_slots.map((slot, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.375rem",
                    backgroundColor: slot.booked ? "rgba(30, 41, 59, 0.4)" : "#1e293b",
                    border: "1px solid #334155",
                    fontSize: "0.8125rem",
                    color: slot.booked ? "#64748b" : "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <Clock style={{ width: "0.875rem", height: "0.875rem", color: "#818cf8" }} />
                    {slot.date.slice(5)} {slot.time}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: slot.booked ? "#ef4444" : "#34d399", fontWeight: 600 }}>
                    {slot.booked ? "예약됨" : "신청가능"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 이전 멘티 후기 */}
          <div
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "1rem",
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <MessageSquare style={{ width: "1.25rem", height: "1.25rem", color: "#f59e0b" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                이전 멘티 실제 첨삭 후기 ({mentor.reviews.length}건)
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {mentor.reviews.map((rev, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontWeight: 600, color: "#ffffff", fontSize: "0.875rem" }}>
                      {rev.author} ({rev.university})
                    </span>
                    <div style={{ display: "flex", color: "#f59e0b" }}>
                      {Array.from({ length: rev.rating }).map((_, r) => (
                        <Star key={r} style={{ width: "0.875rem", height: "0.875rem", fill: "#f59e0b" }} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
                    "{rev.content}"
                  </p>
                  <div style={{ fontSize: "0.6875rem", color: "#64748b", marginTop: "0.4rem" }}>
                    {rev.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 8: 검증된 멘토링 연계 콘텐츠 (Related Content Intelligence) */}
      {relatedContents.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles style={{ width: "1.2rem", height: "1.2rem", color: "#6366f1" }} />
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
                실무 멘토링 & 취업 포트폴리오 연계 콘텐츠 ({relatedContents.length}건)
              </h2>
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
                    전략: {cnt.engagement_strategy?.save || "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 멘토링 예약 모달 */}
      <MentoringBookingModal
        mentor={mentor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        prefilledLink={prefilledPortfolio}
      />
    </div>
  );
}

export default function MentorDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>멘토 프로필 불러오는 중...</div>}>
      <MentorDetailContent />
    </Suspense>
  );
}
