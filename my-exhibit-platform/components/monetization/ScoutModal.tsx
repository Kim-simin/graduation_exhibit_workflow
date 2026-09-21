"use client";

import React, { useState } from "react";
import { X, Briefcase, CheckCircle2, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { Student } from "@/types";

interface ScoutModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoutModal({ student, isOpen, onClose }: ScoutModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [position, setPosition] = useState(student.role);
  const [expectedSalary, setExpectedSalary] = useState("초봉 4,000 ~ 4,800만원");
  const [message, setMessage] = useState(
    `안녕하세요 ${student.name}님, 졸업작품 포트폴리오를 매우 인상 깊게 보았습니다. 당사 디자인팀 ${student.role} 포지션으로 채용 인터뷰를 제안드립니다.`
  );
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
          maxWidth: "34rem",
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
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                }}
              >
                <Briefcase style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  인재 스카우트 제안서 발송
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
                  {student.university} {student.department} · <span style={{ color: "#a5b4fc" }}>{student.name}</span> 예비 창작자
                </p>
              </div>
            </div>

            {/* B2B 기업 채용 구독 플랜 배지 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(6, 182, 212, 0.1)",
                border: "1px solid rgba(6, 182, 212, 0.25)",
                color: "#22d3ee",
                fontSize: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <ShieldCheck style={{ width: "1.1rem", height: "1.1rem", flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 700 }}>기업 HR 프리미엄 채용 패스 회원 전용:</span> 열람권 1회가 차감되며, 제안 수락 시 학생의 미공개 연락처가 실시간 공개됩니다.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    회사명
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 토스, 네이버, 스튜디오"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
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
                    채용 담당자 성함 / 직함
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 김인사 팀장"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
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
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    제안 포지션
                  </label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
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
                    예상 보수/처우
                  </label>
                  <input
                    type="text"
                    required
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
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
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  오퍼 상세 메시지
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.375rem",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                    resize: "vertical",
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
                    backgroundColor: "#6366f1",
                    border: "none",
                    borderRadius: "0.5rem",
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
                  <Sparkles style={{ width: "1rem", height: "1rem" }} />
                  스카우트 제안서 발송하기
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
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <CheckCircle2 style={{ width: "2.25rem", height: "2.25rem" }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", marginBottom: "0.5rem" }}>
              스카우트 제안이 성공적으로 전달되었습니다!
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>{student.name}</span> 학생에게 기업 오퍼 알림톡과 이메일이 발송되었습니다. 학생이 수락 시 기업 대시보드에서 포트폴리오 원본과 연락처를 즉시 확인하실 수 있습니다.
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
