"use client";

import React, { useState } from "react";
import { X, Palette, CheckCircle2, Shield, Calculator } from "lucide-react";
import { Student } from "@/types";

interface FreelanceProjectModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

export default function FreelanceProjectModal({ student, isOpen, onClose }: FreelanceProjectModalProps) {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectType, setProjectType] = useState("UX/UI 앱/웹 디자인");
  const [budget, setBudget] = useState(2500000); // 250만원
  const [deadline, setDeadline] = useState("2026-05-30");
  const [scope, setScope] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  // 플랫폼 에스크로 수수료 12%
  const feeRate = 0.12;
  const platformFee = Math.round(budget * feeRate);
  const studentReceive = budget - platformFee;

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
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                }}
              >
                <Palette style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  안전 에스크로 외주/프로젝트 의뢰
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
                  창작자 <span style={{ color: "#34d399", fontWeight: 600 }}>{student.name}</span>님에게 1:1 프로젝트 견적 문의
                </p>
              </div>
            </div>

            {/* 에스크로 안전장치 안내 배너 */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#6ee7b7",
                fontSize: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <Shield style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0, marginTop: "0.1rem" }} />
              <div style={{ lineHeight: 1.5 }}>
                <strong>플랫폼 100% 안심 결제(에스크로) 보장:</strong> 의뢰 대금은 결과물이 최종 검수 및 승인될 때까지 플랫폼에서 안전하게 예치·보호되며, 작업 미이행 시 100% 환불됩니다.
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  프로젝트 명칭
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 신규 브랜드 론칭 패키지 & 모션 비디오 제작"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
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
                    의뢰 분야
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
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
                    <option value="UX/UI 앱/웹 디자인">UX/UI 앱/웹 디자인</option>
                    <option value="브랜드 아이덴티티 / 로고">브랜드 아이덴티티 / 로고</option>
                    <option value="3D 그래픽 & 모션 영상">3D 그래픽 & 모션 영상</option>
                    <option value="제품 디자인 & 프로토타입">제품 디자인 & 프로토타입</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    희망 마감일
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
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

              {/* 예산 및 에스크로 수수료 계산기 */}
              <div
                style={{
                  padding: "0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid #334155",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Calculator style={{ width: "0.875rem", height: "0.875rem" }} />
                    총 제안 예산 (VAT 포함)
                  </label>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "#ffffff" }}>
                    {budget.toLocaleString()} 원
                  </span>
                </div>
                <input
                  type="range"
                  min={500000}
                  max={10000000}
                  step={100000}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10b981", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                  <span>50만원</span>
                  <span>500만원</span>
                  <span>1,000만원</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px dashed #334155",
                    fontSize: "0.75rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#94a3b8" }}>플랫폼 에스크로 수수료 (12%):</span>{" "}
                    <span style={{ color: "#f87171", fontWeight: 600 }}>{platformFee.toLocaleString()}원</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#94a3b8" }}>창작자 실 수령액:</span>{" "}
                    <span style={{ color: "#34d399", fontWeight: 700 }}>{studentReceive.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  요구사항 및 프로젝트 개요
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="결과물의 형태, 페이지 수, 레퍼런스 스타일 등을 자유롭게 기재해주세요."
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
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
                    backgroundColor: "#10b981",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
                  }}
                >
                  에스크로 견적 요청서 전송
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
              에스크로 프로젝트 의뢰서가 전송되었습니다!
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              창작자 확인 후 24시간 내 수락 여부 및 최종 조율 견적이 전달됩니다. 작업 확정 시 에스크로 가상계좌가 발급됩니다.
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
