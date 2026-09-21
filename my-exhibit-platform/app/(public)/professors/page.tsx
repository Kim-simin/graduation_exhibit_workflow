"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getProfessors, getTaxonomy } from "@/lib/data";
import {
  GraduationCap,
  ArrowRight,
  BookOpen,
  Users,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function ProfessorsPage() {
  const professors = getProfessors();
  const taxonomy = getTaxonomy();
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>("all");

  const filteredProfessors = professors.filter((prof) => {
    if (selectedTaxonomy === "all") return true;
    const tax = taxonomy.find((t) => t.id === selectedTaxonomy);
    if (!tax) return true;
    return (
      prof.research_areas?.some((ra) => tax.keywords.some((kw) => ra.includes(kw))) ||
      tax.related_majors.some((rm) => prof.department?.includes(rm))
    );
  });

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 헤더 */}
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
          <GraduationCap style={{ width: "0.875rem", height: "0.875rem" }} />
          Verified Academic Faculty & Research Lab Archive
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>
          전국 주요 디자인 학과 교수진 및 학기 과제 아카이브
        </h1>
        <p style={{ fontSize: "1rem", color: "#94a3b8", maxWidth: "48rem", lineHeight: 1.6, margin: 0 }}>
          각 대학 연구실의 공식 교원 정보, 공식 출처 검증(Verified)된 지도교수 핵심 탐구 과제 및 학생 우수 제출물을 열람하십시오.
        </p>
      </div>

      {/* 공통 Taxonomy 산업군/전공 필터 칩 바 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2rem" }}>
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
          🌐 전체 분야 ({professors.length})
        </button>
        {taxonomy.map((tax) => {
          const isSelected = selectedTaxonomy === tax.id;
          const matchCount = professors.filter(
            (p) =>
              p.research_areas?.some((ra) => tax.keywords.some((kw) => ra.includes(kw))) ||
              tax.related_majors.some((rm) => p.department?.includes(rm))
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
                backgroundColor: isSelected ? tax.color || "#6366f1" : "#1e293b",
                color: isSelected ? "#ffffff" : "#cbd5e1",
                border: isSelected ? `1px solid ${tax.color || "#818cf8"}` : "1px solid #334155",
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

      {/* 교수 리스트 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredProfessors.length === 0 ? (
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
            <GraduationCap style={{ width: "2.5rem", height: "2.5rem", margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>현재 등록된 교수진 및 학기 과제 카드 정보가 없습니다.</p>
          </div>
        ) : (
          filteredProfessors.map((prof) => {
          const isVerified = prof.is_verified === true || prof.verification_status === "VERIFIED";

          return (
            <div
              key={prof.id}
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
              {/* 상단 검증 뱃지 및 출처 링크 */}
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
                    공식 학술 출처 인증 (VERIFIED)
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
                    공식 교원 정보 확인 중
                  </span>
                )}

                {prof.source_url && (
                  <a
                    href={prof.source_url}
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
                    <span>출처 확인</span>
                    <ExternalLink style={{ width: "0.6875rem", height: "0.6875rem" }} />
                  </a>
                )}
              </div>

              {/* 교수 프로필 요약 */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <img
                  src={prof.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                  alt={prof.name}
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    border: isVerified ? "2px solid #10b981" : "2px solid #6366f1",
                  }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                      {prof.name} 교수
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>{prof.title}</span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0.2rem 0 0" }}>
                    {prof.university} {prof.department}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.6875rem",
                      color: "#22d3ee",
                      backgroundColor: "rgba(6, 182, 212, 0.1)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "0.25rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {prof.lab_name}
                  </span>
                </div>
              </div>

              {/* 핵심 학기 과제 1줄 설명 박스 */}
              <div
                style={{
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid #334155",
                  borderRadius: "0.625rem",
                  padding: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: "#f59e0b",
                    textTransform: "uppercase",
                    marginBottom: "0.35rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <BookOpen style={{ width: "0.75rem", height: "0.75rem" }} />
                  학기 핵심 탐구 과제 (1줄 요약)
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#f1f5f9",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  "{prof.assignment_one_liner}"
                </p>
              </div>

              {/* 연구 분야 태그 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.5rem" }}>
                {prof.research_areas?.map((area) => (
                  <span
                    key={area}
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      backgroundColor: "#1e293b",
                      color: "#94a3b8",
                    }}
                  >
                    #{area}
                  </span>
                ))}
              </div>

              {/* 하단 상세 링크 및 우수 제출물 개수 */}
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "1rem",
                  borderTop: "1px solid #1e293b",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  등록된 학생 제출물: <strong style={{ color: "#ffffff" }}>{prof.student_submissions?.length || 0}건</strong>
                </span>

                <Link
                  href={`/professors/${prof.id}`}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: "0.375rem",
                    backgroundColor: "#6366f1",
                    color: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  과제 & 쇼케이스 보기
                  <ArrowRight style={{ width: "0.8rem", height: "0.8rem" }} />
                </Link>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
