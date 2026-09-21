"use client";

import React, { useState } from "react";
import { X, Building2, Award, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { RFPSubmission } from "@/types";

interface CorporateOfferModalProps {
  submission: RFPSubmission;
  rfpTitle: string;
  companyName: string;
  type: "internship" | "contract";
  isOpen: boolean;
  onClose: () => void;
}

export default function CorporateOfferModal({
  submission,
  rfpTitle,
  companyName,
  type,
  isOpen,
  onClose,
}: CorporateOfferModalProps) {
  const [offerSalary, setOfferSalary] = useState(
    type === "internship" ? "월 280만원 (정규직 전환 평가형)" : "프로젝트 계약금 800만원"
  );
  const [managerContact, setManagerContact] = useState("");
  const [offerNote, setOfferNote] = useState(
    type === "internship"
      ? `${submission.student_name}님의 RFP 솔루션('${submission.summary_title}')을 당사 실무진이 높게 평가하여, ${companyName} 디자인팀 인턴십 및 정규 채용 면접을 제안합니다.`
      : `${submission.student_name}님이 제안해주신 '${submission.summary_title}' 프로토타입을 실제 상용 프로젝트로 발전시키기 위한 정식 산학 외주 계약을 체결하고자 합니다.`
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const isIntern = type === "internship";

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
                  backgroundColor: isIntern ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  color: isIntern ? "#818cf8" : "#10b981",
                }}
              >
                {isIntern ? <Award style={{ width: "1.5rem", height: "1.5rem" }} /> : <FileText style={{ width: "1.5rem", height: "1.5rem" }} />}
              </div>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  {isIntern ? "우수 제출자 인턴/채용 오퍼 발송" : "정식 외주/산학 계약 전환 제안"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
                  수신자: {submission.university} {submission.student_name} 창작자
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(30, 41, 59, 0.6)",
                border: "1px solid #334155",
                fontSize: "0.8125rem",
                color: "#cbd5e1",
                marginBottom: "1.25rem",
                lineHeight: 1.5,
              }}
            >
              <div><strong>과제 공고:</strong> {rfpTitle}</div>
              <div><strong>평가 솔루션:</strong> {submission.summary_title}</div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  담당 기업명 및 부서
                </label>
                <input
                  type="text"
                  disabled
                  value={companyName}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "0.375rem",
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    담당자 연락처 / 이메일
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="hr@company.com / 02-1234-5678"
                    value={managerContact}
                    onChange={(e) => setManagerContact(e.target.value)}
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
                    {isIntern ? "예상 급여/처우" : "계약 금액"}
                  </label>
                  <input
                    type="text"
                    required
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
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
                  상세 제안 내용
                </label>
                <textarea
                  rows={4}
                  required
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
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
                    backgroundColor: isIntern ? "#6366f1" : "#10b981",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    boxShadow: isIntern
                      ? "0 4px 12px rgba(99, 102, 241, 0.4)"
                      : "0 4px 12px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  {isIntern ? "인턴/채용 오퍼 전송" : "에스크로 계약 전환 요청"}
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
              {isIntern ? "채용 오퍼가 성공적으로 전송되었습니다!" : "계약 전환 요청이 접수되었습니다!"}
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              제출 학생({submission.student_name})에게 오퍼 알림과 전문이 전달되었으며, 플랫폼 산학협력팀이 일정 및 에스크로 계약 체결을 1:1로 지원합니다.
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
