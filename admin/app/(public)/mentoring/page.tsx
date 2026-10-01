"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getMentors, getTaxonomy } from "@/lib/data";
import { Mentor } from "@/types";
import {
  Sparkles,
  Star,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import MentoringBookingModal from "@/components/monetization/MentoringBookingModal";

export default function MentoringListPage() {
  const mentors = getMentors();
  const taxonomy = getTaxonomy();
  const [selectedSpecialty, setSelectedSpecialty] = useState("전체");
  const [selectedTaxonomy, setSelectedTaxonomy] = useState("all");
  const [bookingMentor, setBookingMentor] = useState<Mentor | null>(null);

  const specialties = [
    "전체",
    "포트폴리오 정밀 첨삭",
    "3D 모션 포트폴리오",
    "모빌리티/하드웨어 인터랙션",
    "종합 브랜딩 솔루션",
  ];

  const filteredMentors = mentors.filter((m) => {
    const specialtyMatch = selectedSpecialty === "전체" || m.specialties.includes(selectedSpecialty);
    if (!specialtyMatch) return false;

    if (selectedTaxonomy === "all") return true;
    const tax = taxonomy.find((t) => t.id === selectedTaxonomy);
    if (!tax) return true;

    return (
      m.specialties?.some((sp) => tax.keywords.some((kw) => sp.includes(kw))) ||
      tax.keywords.some((kw) => m.company?.includes(kw) || m.role?.includes(kw))
    );
  });

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 헤더 섹션 */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            color: "#818cf8",
            fontSize: "0.75rem",
            fontWeight: 600,
            marginBottom: "0.75rem",
          }}
        >
          <Sparkles style={{ width: "0.875rem", height: "0.875rem" }} />
          Verified Industry Mentorship & Portfolio Review
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>
          현직자 ↔ 졸업생 1:1 포트폴리오 첨삭 멘토링
        </h1>
        <p style={{ fontSize: "1rem", color: "#94a3b8", maxWidth: "48rem", lineHeight: 1.6, margin: 0 }}>
          네이버, 라인, 디스트릭트, 현대차 등 공식 재직 및 경력 검증(Verified)된 탑티어 실무진에게 졸업전시 출품작의 실무 적합성을 1:1 화상으로 직접 검증받으십시오.
        </p>
      </div>

      {/* 공통 Taxonomy 산업군 필터 칩 바 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button
          type="button"
          onClick={() => setSelectedTaxonomy("all")}
          style={{
            padding: "0.45rem 0.85rem",
            borderRadius: "9999px",
            fontSize: "0.8125rem",
            fontWeight: selectedTaxonomy === "all" ? 700 : 500,
            backgroundColor: selectedTaxonomy === "all" ? "#6366f1" : "#1e293b",
            color: selectedTaxonomy === "all" ? "#ffffff" : "#94a3b8",
            border: selectedTaxonomy === "all" ? "1px solid #818cf8" : "1px solid #334155",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          🌐 전체 분야 ({mentors.length})
        </button>
        {taxonomy.map((tax) => {
          const isSelected = selectedTaxonomy === tax.id;
          const matchCount = mentors.filter(
            (m) =>
              m.specialties?.some((sp) => tax.keywords.some((kw) => sp.includes(kw))) ||
              tax.keywords.some((kw) => m.company?.includes(kw) || m.role?.includes(kw))
          ).length;
          return (
            <button
              key={tax.id}
              type="button"
              onClick={() => setSelectedTaxonomy(tax.id)}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "9999px",
                fontSize: "0.8125rem",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? tax.color : "#1e293b",
                color: isSelected ? "#ffffff" : "#cbd5e1",
                border: isSelected ? `1px solid ${tax.color}` : "1px solid #334155",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span>{tax.icon}</span>
              <span>{tax.name}</span>
              <span style={{ fontSize: "0.6875rem", opacity: 0.8 }}>({matchCount})</span>
            </button>
          );
        })}
      </div>

      {/* 전문 분야 필터 탭 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
        {specialties.map((spec) => {
          const isSelected = selectedSpecialty === spec;
          return (
            <button
              key={spec}
              type="button"
              onClick={() => setSelectedSpecialty(spec)}
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
                fontWeight: isSelected ? 700 : 500,
                backgroundColor: isSelected ? "#3b82f6" : "#0f172a",
                color: isSelected ? "#ffffff" : "#94a3b8",
                border: isSelected ? "1px solid #60a5fa" : "1px solid #1e293b",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {spec}
            </button>
          );
        })}
      </div>

      {/* 멘토 리스트 카드 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredMentors.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "5rem 1rem",
              textAlign: "center",
              borderRadius: "1rem",
              backgroundColor: "#0f172a",
              border: "1px dashed #334155",
              color: "#64748b",
            }}
          >
            <AlertCircle style={{ width: "2.5rem", height: "2.5rem", margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>현재 등록된 현직자 멘토링 카드 정보가 없습니다.</p>
          </div>
        ) : (
          filteredMentors.map((mentor) => {
            const isVerified = mentor.is_verified === true || mentor.verification_status === "VERIFIED";

          return (
            <div
              key={mentor.id}
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "1rem",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              }}
            >
              {/* 상단 검증 뱃지 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                {isVerified ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: "#10b981",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "9999px",
                    }}
                  >
                    <CheckCircle2 style={{ width: "0.75rem", height: "0.75rem" }} />
                    재직 및 경력 증빙 검증 (VERIFIED)
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "#f59e0b",
                      backgroundColor: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "9999px",
                    }}
                  >
                    <AlertCircle style={{ width: "0.75rem", height: "0.75rem" }} />
                    경력 서류 검토 중
                  </span>
                )}

                {mentor.career_evidence_url && (
                  <a
                    href={mentor.career_evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.6875rem",
                      color: "#64748b",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span>경력 증빙</span>
                    <ExternalLink style={{ width: "0.6875rem", height: "0.6875rem" }} />
                  </a>
                )}
              </div>

              {/* 멘토 프로필 정보 */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "9999px",
                    backgroundColor: "#1e293b",
                    border: isVerified ? "2px solid #10b981" : "2px solid #334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.75rem",
                    flexShrink: 0,
                  }}
                >
                  {mentor.company_logo || "💼"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                      {mentor.name} 멘토
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontSize: "0.875rem", fontWeight: 700 }}>
                      <Star style={{ width: "1rem", height: "1rem", fill: "#f59e0b" }} />
                      <span>{mentor.rating.toFixed(1)}</span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>({mentor.review_count})</span>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.8125rem", color: "#38bdf8", fontWeight: 600, marginTop: "0.15rem" }}>
                    {mentor.company} · {mentor.role}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    실무 {mentor.experience_years}년차
                  </div>
                </div>
              </div>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#cbd5e1",
                  lineHeight: 1.5,
                  margin: "0 0 1rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {mentor.bio}
              </p>

              {/* 전문 분야 태그 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
                {mentor.specialties?.map((spec) => (
                  <span
                    key={spec}
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      backgroundColor: "#1e293b",
                      color: "#94a3b8",
                    }}
                  >
                    #{spec}
                  </span>
                ))}
              </div>

              {/* 최근 리뷰 스니펫 (원문 검증 증거) */}
              {mentor.reviews && mentor.reviews.length > 0 && (
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid #1e293b",
                    marginBottom: "1.25rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <div style={{ color: "#94a3b8", fontStyle: "italic", marginBottom: "0.25rem" }}>
                    "{mentor.reviews[0].content}"
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.6875rem", textAlign: "right" }}>
                    - {mentor.reviews[0].author} ({mentor.reviews[0].university})
                  </div>
                </div>
              )}

              {/* 하단 가격 & 신청 버튼 */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: "1rem",
                  borderTop: "1px solid #1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>회당 코칭비</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                    {mentor.price_per_session.toLocaleString()}원
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingMentor(mentor)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#6366f1",
                    color: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  멘토링 신청
                  <ArrowRight style={{ width: "0.8rem", height: "0.8rem" }} />
                </button>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* 멘토링 예약 모달 */}
      {bookingMentor && (
        <MentoringBookingModal
          mentor={bookingMentor}
          isOpen={!!bookingMentor}
          onClose={() => setBookingMentor(null)}
        />
      )}
    </div>
  );
}
