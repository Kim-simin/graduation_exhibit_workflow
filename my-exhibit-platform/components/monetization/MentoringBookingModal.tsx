"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, CreditCard, CheckCircle2, ShieldCheck, Link2 } from "lucide-react";
import { Mentor } from "@/types";

interface MentoringBookingModalProps {
  mentor: Mentor;
  isOpen: boolean;
  onClose: () => void;
  prefilledLink?: string;
}

export default function MentoringBookingModal({
  mentor,
  isOpen,
  onClose,
  prefilledLink = "",
}: MentoringBookingModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>(
    mentor.available_slots.find((s) => !s.booked)
      ? `${mentor.available_slots.find((s) => !s.booked)?.date} ${mentor.available_slots.find((s) => !s.booked)?.time}`
      : ""
  );
  const [menteeName, setMenteeName] = useState("");
  const [menteeEmail, setMenteeEmail] = useState("");
  const [portfolioLink, setPortfolioLink] = useState(prefilledLink);
  const [focusArea, setFocusArea] = useState(mentor.specialties[0] || "포트폴리오 정밀 첨삭");
  const [step, setStep] = useState<"form" | "payment" | "confirmed">("form");

  if (!isOpen) return null;

  const sessionPrice = mentor.price_per_session;
  const platformFee = Math.round(sessionPrice * 0.1); // C2C 플랫폼 수수료 10%
  const totalPrice = sessionPrice + platformFee;

  const handleGoToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("payment");
  };

  const handlePayComplete = () => {
    setStep("confirmed");
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

        {/* 1단계: 신청 정보 및 슬롯 선택 */}
        {step === "form" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div
                style={{
                  padding: "0.625rem",
                  borderRadius: "0.625rem",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                }}
              >
                <Calendar style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  1:1 포트폴리오 첨삭 멘토링 예약
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
                  멘토 <strong style={{ color: "#ffffff" }}>{mentor.name}</strong> ({mentor.company} · {mentor.role})
                </p>
              </div>
            </div>

            <form onSubmit={handleGoToPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* 예약 가능 타임슬롯 선택 */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                  희망 세션 일정 선택 (30분 집중 코칭)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {mentor.available_slots.map((slot, idx) => {
                    const slotKey = `${slot.date} ${slot.time}`;
                    const isSelected = selectedSlot === slotKey;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={slot.booked}
                        onClick={() => setSelectedSlot(slotKey)}
                        style={{
                          padding: "0.625rem",
                          borderRadius: "0.5rem",
                          border: isSelected
                            ? "2px solid #6366f1"
                            : "1px solid #334155",
                          backgroundColor: slot.booked
                            ? "rgba(30, 41, 59, 0.3)"
                            : isSelected
                            ? "rgba(99, 102, 241, 0.2)"
                            : "#1e293b",
                          color: slot.booked ? "#64748b" : isSelected ? "#ffffff" : "#cbd5e1",
                          fontSize: "0.8125rem",
                          cursor: slot.booked ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Clock style={{ width: "0.875rem", height: "0.875rem", color: isSelected ? "#818cf8" : "#94a3b8" }} />
                          {slot.date.slice(5)} {slot.time}
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: slot.booked ? "#ef4444" : "#10b981" }}>
                          {slot.booked ? "마감" : "가능"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    신청자 성함
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="홍길동"
                    value={menteeName}
                    onChange={(e) => setMenteeName(e.target.value)}
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
                    연락받을 이메일
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@university.ac.kr"
                    value={menteeEmail}
                    onChange={(e) => setMenteeEmail(e.target.value)}
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

              {/* 졸업전시 작품 / 포트폴리오 링크 첨부 */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  피드백 받을 졸업전시 작품 링크 또는 노션/비핸스 URL
                </label>
                <div style={{ position: "relative" }}>
                  <Link2
                    style={{
                      position: "absolute",
                      left: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "1rem",
                      height: "1rem",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://behance.net/gallery/... 또는 졸업전시 페이지 URL"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem 0.5rem 2.25rem",
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
                  중점 코칭 분야
                </label>
                <select
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
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
                  {mentor.specialties.map((spec, i) => (
                    <option key={i} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              {/* 금액 요약 */}
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid #334155",
                  fontSize: "0.8125rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ color: "#94a3b8" }}>멘토링 1회 비용 (30분)</span>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>{sessionPrice.toLocaleString()}원</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "#94a3b8" }}>플랫폼 매칭 수수료 (10%)</span>
                  <span style={{ color: "#cbd5e1" }}>{platformFee.toLocaleString()}원</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid #334155",
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: "#ffffff" }}>최종 결제 금액</span>
                  <span style={{ color: "#818cf8" }}>{totalPrice.toLocaleString()}원</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedSlot}
                style={{
                  padding: "0.75rem",
                  backgroundColor: selectedSlot ? "#6366f1" : "#475569",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: selectedSlot ? "pointer" : "not-allowed",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
                  marginTop: "0.25rem",
                }}
              >
                결제 화면으로 이동 ({totalPrice.toLocaleString()}원)
              </button>
            </form>
          </div>
        )}

        {/* 2단계: 가상 결제 화면 */}
        {step === "payment" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div
                style={{
                  padding: "0.625rem",
                  borderRadius: "0.625rem",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                }}
              >
                <CreditCard style={{ width: "1.5rem", height: "1.5rem" }} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                  안전 결제 진행 (테스트 모드)
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
                  예약 일시: <span style={{ color: "#34d399", fontWeight: 600 }}>{selectedSlot}</span>
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.5rem" }}>결제 수단 선택</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <button
                  type="button"
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "2px solid #6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    color: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  간편 결제 (토스/카카오페이)
                </button>
                <button
                  type="button"
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #334155",
                    backgroundColor: "#0f172a",
                    color: "#94a3b8",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  신용/체크카드
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                  fontSize: "0.75rem",
                  color: "#6ee7b7",
                }}
              >
                <ShieldCheck style={{ width: "1rem", height: "1rem" }} />
                <span>세션 24시간 전까지 100% 전액 환불 보장</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setStep("form")}
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
                이전 단계
              </button>
              <button
                type="button"
                onClick={handlePayComplete}
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
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                }}
              >
                {totalPrice.toLocaleString()}원 결제 승인하기
              </button>
            </div>
          </div>
        )}

        {/* 3단계: 예약 및 결제 완료 안내 */}
        {step === "confirmed" && (
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
              1:1 멘토링 예약이 확정되었습니다!
            </h3>
            <div
              style={{
                textAlign: "left",
                backgroundColor: "#1e293b",
                padding: "1rem",
                borderRadius: "0.5rem",
                border: "1px solid #334155",
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                color: "#cbd5e1",
                marginBottom: "1.5rem",
              }}
            >
              <div>• <strong>멘토:</strong> {mentor.name} ({mentor.company} · {mentor.role})</div>
              <div>• <strong>확정 일시:</strong> {selectedSlot} (30분간 Zoom 화상 미팅)</div>
              <div>• <strong>화상 미팅 링크:</strong> {menteeEmail}로 회의 참여 URL이 전송되었습니다.</div>
              <div>• <strong>피드백 대상:</strong> {portfolioLink}</div>
            </div>
            <button
              onClick={() => {
                setStep("form");
                onClose();
              }}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: "#6366f1",
                border: "none",
                borderRadius: "0.5rem",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              예약 확인 완료
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
