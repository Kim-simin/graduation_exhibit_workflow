"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getStudents } from "@/lib/data";
import { Student } from "@/types";
import { Users, Search, Sparkles, Briefcase, Eye, Heart, ArrowRight } from "lucide-react";
import ScoutModal from "@/components/monetization/ScoutModal";

const UNIVERSITY_OPTIONS = [
  "건국대학교",
  "경희대학교",
  "고려대학교",
  "국민대학교",
  "단국대학교",
  "동국대학교",
  "명지대학교",
  "상명대학교",
  "서강대학교",
  "서울과학기술대학교",
  "서울대학교",
  "서울시립대학교",
  "성균관대학교",
  "세종대학교",
  "숙명여자대학교",
  "연세대학교",
  "이화여자대학교",
  "인하대학교",
  "중앙대학교",
  "한국예술종합학교",
  "한양대학교",
  "홍익대학교",
];

const DEPARTMENT_OPTIONS = [
  { id: "all", label: "🌐 전체 학과 (선택 안 함)" },
  { id: "시각디자인", label: "🎨 시각디자인학과 / 시각디자인전공" },
  { id: "산업정보디자인", label: "📐 산업정보디자인전공 / 융합디자인" },
  { id: "산업디자인", label: "🚗 산업디자인학과 / 공업디자인" },
  { id: "디자인조형", label: "🏛️ 디자인조형학부 / 조형예술" },
  { id: "컴퓨터공학", label: "💻 컴퓨터공학과 / 소프트웨어학부" },
  { id: "인공지능", label: "🤖 인공지능학과 / 데이터사이언스" },
  { id: "디지털미디어", label: "📱 디지털미디어학과 / 인터랙션디자인" },
  { id: "미디어커뮤니케이션", label: "🎬 미디어커뮤니케이션 / 영상디자인 / 광고홍보" },
  { id: "경영학", label: "📊 경영학과 / 경제학과 / 패션비즈니스" },
  { id: "건축학", label: "🏗️ 건축학과 / 실내건축디자인" },
  { id: "전자공학", label: "⚡ 전자공학과 / 신소재공학과" },
  { id: "지식재산", label: "⚖️ 지식재산 / 기술경영 / 법학" },
];

export default function StudentsPage() {
  const students = getStudents();
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scoutTargetStudent, setScoutTargetStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((stu) => {
    const univQuery = selectedUniversity === "all" ? "" : selectedUniversity.replace(/대학교|학교|대$/, "");
    const matchesUniv = selectedUniversity === "all" || (stu.university && stu.university.includes(univQuery));
    const matchesDept =
      selectedDepartment === "all" ||
      (stu.department && stu.department.toLowerCase().includes(selectedDepartment.toLowerCase())) ||
      (stu.role && stu.role.toLowerCase().includes(selectedDepartment.toLowerCase()));
    const matchesSearch =
      searchQuery === "" ||
      (stu.name && stu.name.includes(searchQuery)) ||
      (stu.university && stu.university.includes(searchQuery)) ||
      (stu.department && stu.department.includes(searchQuery)) ||
      (stu.skills && stu.skills.some((sk) => sk.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesUniv && matchesDept && matchesSearch;
  });

  return (
    <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1.25rem" }}>
      {/* 헤더 섹션 */}
      <div style={{ marginBottom: "2.5rem" }}>
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
          Verified Graduate Talents Pool
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem" }}>
          전국 학과 및 인재풀
        </h1>
        <p style={{ fontSize: "1rem", color: "#94a3b8", maxWidth: "48rem", lineHeight: 1.6, margin: 0 }}>
          시각·산업·공간 디자인부터 컴퓨터공학, 인공지능, 미디어, 경영 등 전국 주요 대학 다양한 학과의 졸업전시 및 프로젝트 출품자 중 실무 역량이 검증된 대학생 인재풀을 탐색하고 즉시 스카우트 또는 협업 프로젝트를 의뢰하십시오.
        </p>
      </div>

      {/* 필터 및 검색 컨트롤 (대학교 드롭다운 + 오른쪽에 학과/전공 드롭다운 + 검색창) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 p-4 bg-slate-900/90 rounded-xl border border-slate-800 items-end">
        {/* 1. 소속 대학교 드롭다운 메뉴 */}
        <div className="col-span-1 md:col-span-4 relative">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            소속 대학교 선택
          </label>
          <div className="relative">
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-indigo-500 focus:border-indigo-500 focus:outline-none text-xs text-white font-medium transition cursor-pointer pr-9"
            >
              <option value="all">🏛️ 전체 대학교 (선택 안 함)</option>
              {UNIVERSITY_OPTIONS.map((univ) => (
                <option key={univ} value={univ} className="bg-slate-900 text-white py-1">
                  {univ}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* 2. 학과/전공 드롭다운 메뉴 (대학교 드롭다운 오른쪽에 배치) */}
        <div className="col-span-1 md:col-span-4 relative">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            학과 / 전공 분야 선택
          </label>
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-blue-500 focus:border-blue-500 focus:outline-none text-xs text-white font-medium transition cursor-pointer pr-9"
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept.id} value={dept.id} className="bg-slate-900 text-white py-1">
                  {dept.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* 3. 검색창 */}
        <div className="col-span-1 md:col-span-4 relative">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            인재 통합 검색
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="학생 이름, 학교, 전공 학과, 스킬 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:outline-none text-xs text-white placeholder:text-slate-500 transition"
            />
          </div>
        </div>

        {/* 필터 활성화 상태 표시 및 초기화 */}
        {(selectedUniversity !== "all" || selectedDepartment !== "all") && (
          <div className="col-span-1 md:col-span-12 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span>필터 적용 중:</span>
              {selectedUniversity !== "all" && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30">
                  {selectedUniversity}
                </span>
              )}
              {selectedDepartment !== "all" && (
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30">
                  {DEPARTMENT_OPTIONS.find((d) => d.id === selectedDepartment)?.label}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedUniversity("all");
                setSelectedDepartment("all");
              }}
              className="text-slate-400 hover:text-white underline text-[11px] transition"
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* 인재 카드 리스트 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredStudents.length === 0 ? (
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
            <Users style={{ width: "2.5rem", height: "2.5rem", margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>현재 등록된 대학생 인재 카드 정보가 없습니다.</p>
          </div>
        ) : (
          filteredStudents.map((stu) => (
          <div
            key={stu.id}
            style={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "1rem",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              transition: "transform 0.2s ease, border-color 0.2s ease",
            }}
          >
            {/* 대표 졸업작품 썸네일 */}
            <div style={{ position: "relative", height: "12rem", backgroundColor: "#1e293b", overflow: "hidden" }}>
              <img
                src={stu.portfolio_items[0]?.thumbnail || "https://images.unsplash.com/photo-1551288049-bebda4e38f71"}
                alt={stu.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, transparent 60%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.75rem",
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#ef4444",
                  fontSize: "0.6875rem",
                  fontWeight: 800,
                  padding: "0.2rem 0.5rem",
                  borderRadius: "0.25rem",
                  backdropFilter: "blur(4px)",
                }}
              >
                UI용 테스트/시드
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "0.75rem",
                  left: "1rem",
                  right: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.6875rem",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "0.25rem",
                    backgroundColor: "rgba(99, 102, 241, 0.95)",
                    color: "#ffffff",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <span style={{ color: "#e0e7ff", fontWeight: 600 }}>희망직무:</span>
                  <span>{stu.role}</span>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.75rem", color: "#cbd5e1" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Eye style={{ width: "0.875rem", height: "0.875rem" }} /> {stu.views || 890}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Heart style={{ width: "0.875rem", height: "0.875rem", color: "#f43f5e" }} /> {stu.likes || 120}
                  </span>
                </div>
              </div>
            </div>

            {/* 학생 인적사항 및 소개 (프로필사진 완전 제거) */}
            <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                      {stu.name}
                    </h3>
                    <span
                      style={{
                        color: "#ef4444",
                        fontWeight: 800,
                        fontSize: "0.75rem",
                      }}
                    >
                      [UI용 테스트/시드]
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "#94a3b8",
                      backgroundColor: "#1e293b",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "0.25rem",
                      border: "1px solid #334155",
                      fontWeight: 600,
                    }}
                  >
                    {stu.year}학년
                  </span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#818cf8", margin: "0 0 0.5rem", fontWeight: 600 }}>
                  {stu.university} · {stu.department}
                </p>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.6875rem",
                    color: "#ef4444",
                    fontWeight: 700,
                    backgroundColor: "rgba(239, 68, 68, 0.08)",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "0.25rem",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  검증 증거: <span style={{ color: "#ef4444", fontWeight: 800 }}>UI용 테스트/시드</span>
                </div>
              </div>

              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#cbd5e1",
                  lineHeight: 1.5,
                  margin: "0 0 1rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {stu.bio}
              </p>

              {/* 스킬 태그 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "1.25rem" }}>
                {stu.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.375rem",
                      backgroundColor: "#1e293b",
                      color: "#94a3b8",
                      border: "1px solid #334155",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* 하단 액션 버튼 (상세보기 + 스카우트 CTA) */}
              <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <Link
                  href={`/students/${stu.id}`}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    color: "#ffffff",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textAlign: "center",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                  }}
                >
                  포트폴리오
                  <ArrowRight style={{ width: "0.75rem", height: "0.75rem" }} />
                </Link>

                <button
                  type="button"
                  onClick={() => setScoutTargetStudent(stu)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    color: "#a5b4fc",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                  }}
                >
                  <Briefcase style={{ width: "0.75rem", height: "0.75rem" }} />
                  스카우트 제안
                </button>
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      {/* 스카우트 제안 모달 */}
      {scoutTargetStudent && (
        <ScoutModal
          student={scoutTargetStudent}
          isOpen={!!scoutTargetStudent}
          onClose={() => setScoutTargetStudent(null)}
        />
      )}
    </div>
  );
}
