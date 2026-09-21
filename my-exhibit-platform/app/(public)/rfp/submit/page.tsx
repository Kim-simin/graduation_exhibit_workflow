"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getRfps } from "@/lib/data";
import {
  FileText,
  Lightbulb,
  Layers,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Send,
  Upload,
} from "lucide-react";

function RFPSubmitContent() {
  const searchParams = useSearchParams();
  const initialRfpId = searchParams.get("rfp_id") || "";
  const rfps = getRfps();

  const [selectedRfpId, setSelectedRfpId] = useState(initialRfpId || (rfps[0]?.id ?? ""));
  const [studentName, setStudentName] = useState("");
  const [university, setUniversity] = useState("홍익대학교");
  const [department, setDepartment] = useState("시각디자인과");
  const [email, setEmail] = useState("");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [problemRecognition, setProblemRecognition] = useState("");
  const [solution, setSolution] = useState("");
  const [outcomeImage, setOutcomeImage] = useState(
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (initialRfpId) {
      setSelectedRfpId(initialRfpId);
    }
  }, [initialRfpId]);

  const selectedRfp = rfps.find((r) => r.id === selectedRfpId) || rfps[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      <Link
        href={selectedRfp ? `/rfp/${selectedRfp.id}` : "/rfp"}
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
        과제 공고로 돌아가기
      </Link>

      {!isSubmitted ? (
        <div
          style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "1rem",
            padding: "2.25rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ marginBottom: "1.75rem" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              대학생 전용 3단계 표준 포맷
            </span>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#ffffff", margin: "0.25rem 0 0.5rem" }}>
              산학 과제(RFP) 해결 제안서 제출
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>
              기업 평가단이 직관적으로 검토할 수 있도록 3단계 표준 규격으로 구조화하여 제출합니다.
            </p>
          </div>

          {/* 에스크로 저작권 보호 안내 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.85rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.25)",
              color: "#22d3ee",
              fontSize: "0.8125rem",
              marginBottom: "1.75rem",
            }}
          >
            <ShieldCheck style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} />
            <div>
              <strong>대학생 아이디어 저작권 보호:</strong> 제출된 모든 제안서의 지식재산권은 학생에게 귀속되며, 기업이 채용/계약 전환 없이 무단 도용하는 것을 플랫폼 약관으로 엄격히 방지합니다.
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* 0. 타겟 RFP 공고 선택 */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
                제출할 과제 공고 선택
              </label>
              <select
                value={selectedRfpId}
                onChange={(e) => setSelectedRfpId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              >
                {rfps.length === 0 ? (
                  <option value="">등록된 산학 과제 공고가 없습니다</option>
                ) : (
                  rfps.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.company_name}] {r.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 기본 인적 사항 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "0.75rem",
                padding: "1rem",
                borderRadius: "0.5rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                  학생 성함
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김민우"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#0f172a",
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
                  대학교 및 학과
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍익대학교 시각디자인과"
                  value={`${university} ${department}`}
                  onChange={(e) => {
                    const parts = e.target.value.split(" ");
                    setUniversity(parts[0] || "");
                    setDepartment(parts.slice(1).join(" ") || "");
                  }}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#0f172a",
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
                  연락 이메일
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@univ.ac.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "0.375rem",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* 솔루션 대표 타이틀 */}
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.35rem" }}>
                제안 솔루션 프로젝트 명칭
              </label>
              <input
                type="text"
                required
                placeholder="예: Omni-Touch: 자율주행 햅틱 인터랙션 시스템"
                value={summaryTitle}
                onChange={(e) => setSummaryTitle(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.375rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 1단계: 문제점 인지 */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#f43f5e",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.5rem",
                }}
              >
                <FileText style={{ width: "1rem", height: "1rem" }} />
                [1단계] 문제점 인지 (Problem Recognition)
              </div>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 0.5rem" }}>
                기업이 제시한 상황에서 사용자가 겪는 핵심 페인포인트(Pain Point)나 기존 시장의 한계를 명확히 서술하십시오.
              </p>
              <textarea
                rows={3}
                required
                placeholder="예: 탑승자는 로봇의 급격한 동작과 경로 불확실성으로 인해 심리적 불안을 느낍니다..."
                value={problemRecognition}
                onChange={(e) => setProblemRecognition(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.375rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* 2단계: 창의적 해결방안 */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Lightbulb style={{ width: "1rem", height: "1rem" }} />
                [2단계] 창의적 해결방안 (Creative Solution)
              </div>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 0.5rem" }}>
                인지된 문제점을 풀기 위한 본인만의 독창적인 디자인 콘셉트, 인터랙션 메커니즘, UX 플로우를 설명하십시오.
              </p>
              <textarea
                rows={3}
                required
                placeholder="예: 소프트 패브릭 소재와 이동 궤적 사전 프로젝션을 결합하여 로봇의 동작을 사전 예측 가능하도록 설계..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.375rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* 3단계: 핵심 결과물 / 프로토타입 */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(30, 41, 59, 0.5)",
                border: "1px solid rgba(52, 211, 153, 0.3)",
              }}
            >
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Layers style={{ width: "1rem", height: "1rem" }} />
                [3단계] 핵심 결과물 / 프로토타입 이미지 URL
              </div>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0 0 0.5rem" }}>
                3D 렌더링, 피그마 목업, 시제품 사진 등의 공개 웹 이미지 URL을 입력하거나 기본 샘플을 활용하십시오.
              </p>
              <input
                type="url"
                required
                value={outcomeImage}
                onChange={(e) => setOutcomeImage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "0.375rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: "0.85rem",
                backgroundColor: "#6366f1",
                border: "none",
                borderRadius: "0.5rem",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9375rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              <Send style={{ width: "1.1rem", height: "1.1rem" }} />
              <span>과제 제안서 최종 등록 완료</span>
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "1rem",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "4.5rem",
              height: "4.5rem",
              borderRadius: "9999px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <CheckCircle2 style={{ width: "2.5rem", height: "2.5rem" }} />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", marginBottom: "0.5rem" }}>
            과제 제안서가 정상 등록되었습니다!
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#94a3b8", lineHeight: 1.6, maxWidth: "36rem", margin: "0 auto 1.75rem" }}>
            제출하신 3단계 솔루션이 <strong style={{ color: "#ffffff" }}>[{selectedRfp?.company_name ?? "산학협력기업"}]</strong> 산학 평가 피드에 게재되었습니다. 기업 실무 심사단 검토 후 인턴십 또는 정식 계약 제안이 등록하신 이메일로 안내됩니다.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Link
              href={selectedRfp?.id ? `/rfp/${selectedRfp.id}` : "/rfp"}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6366f1",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "0.5rem",
                textDecoration: "none",
              }}
            >
              과제 피드에서 내 제출물 확인
            </Link>
            <button
              onClick={() => setIsSubmitted(false)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                color: "#cbd5e1",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              추가 제안서 작성
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RFPSubmitPage() {
  return (
    <Suspense fallback={<div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>제출 폼 불러오는 중...</div>}>
      <RFPSubmitContent />
    </Suspense>
  );
}
