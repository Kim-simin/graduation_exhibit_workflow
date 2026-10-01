"use client";

import React, { useState } from "react";
import { X, GraduationCap, CheckCircle2, Phone, BookOpen, Gift } from "lucide-react";
import { PartnerAcademyBanner } from "@/types";

interface AcademyConsultModalProps {
  banner: PartnerAcademyBanner;
  university: string;
  department: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AcademyConsultModal({
  banner,
  university,
  department,
  isOpen,
  onClose,
}: AcademyConsultModalProps) {
  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("고3 수험생");
  const [targetMajor, setTargetMajor] = useState(`${university} ${department}`);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(2, 6, 23, 0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "32rem",
          backgroundColor: "#0f172a",
          borderRadius: "1rem",
          border: "1px solid #334155",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#f1f5f9",
          padding: "1.75rem",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "1.25rem",
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "0.25rem",
          }}
        >
          <X style={{ width: "1.25rem", height: "1.25rem" }} />
        </button>

        {!isSubmitted ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  padding: "0.625rem",
                  borderRadius: "0.625rem",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  color: "#f59e0b",
                }}
              >
                <GraduationCap style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    color: "#f59e0b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  제휴 입시 교육 기관 B2B 매칭
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0.15rem 0 0", color: "#ffffff" }}>
                  {banner.guide_title}
                </h3>
              </div>
            </div>

            {/* 혜택 배너 */}
            <div
              style={{
                padding: "0.85rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                fontSize: "0.8125rem",
                color: "#fde68a",
                lineHeight: 1.5,
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              <Gift style={{ width: "1.2rem", height: "1.2rem", flexShrink: 0, marginTop: "0.1rem", color: "#f59e0b" }} />
              <div>
                <strong>{banner.academy_name} 제휴 특별 혜택:</strong> 지금 신청 시 2026 수시/정시 역대 합격작 분석 리포트(PDF) 및 1:1 모의 실기 1회 진단권을 무료로 보내드립니다.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  학생 성함 (또는 학부모 성함)
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김민서"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.375rem",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    휴대전화 번호
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "0.375rem",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    구분
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "0.375rem",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="고3 수험생">고3 수험생</option>
                    <option value="N수생">N수생</option>
                    <option value="고1·고2 예비반">고1·고2 예비반</option>
                    <option value="학부모">학부모</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  목표 대학 및 학과
                </label>
                <input
                  type="text"
                  required
                  value={targetMajor}
                  onChange={(e) => setTargetMajor(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.375rem",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.5rem",
                    color: "#cbd5e1",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "0.75rem",
                    backgroundColor: "#f59e0b",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "#0f172a",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  <BookOpen style={{ width: "1rem", height: "1rem" }} />
                  합격 가이드북 무료 신청
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "9999px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <CheckCircle2 style={{ width: "2.25rem", height: "2.25rem" }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem" }}>
              합격 전략 가이드북 신청이 완료되었습니다!
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              입력하신 휴대전화 번호({phone})로 <strong style={{ color: "#ffffff" }}>{banner.academy_name}</strong> 전담 입시 컨설턴트의 2026 합격 가이드 PDF 다운로드 링크와 안내 문자가 발송됩니다.
            </p>
            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              확인 닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
