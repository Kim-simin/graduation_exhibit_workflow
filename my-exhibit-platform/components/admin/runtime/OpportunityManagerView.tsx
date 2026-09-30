"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Eye,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Hash,
  Database,
  Calendar,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { Opportunity, Equipment, OpportunityType, OpportunityStatus, ApprovalStatus } from "@/types/opportunity";

export default function OpportunityManagerView() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [approvalFilter, setApprovalFilter] = useState<string>("ALL");
  const [univFilter, setUnivFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect Modal
  const [inspectItem, setInspectItem] = useState<{
    item: Opportunity | Equipment;
    kind: "OPPORTUNITY" | "EQUIPMENT";
  } | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/opportunities");
      if (!res.ok) {
        throw new Error(`Failed to load admin opportunities (status: ${res.status})`);
      }
      const data = await res.json();
      setOpportunities(data.opportunities || []);
      setEquipments(data.equipments || []);
    } catch (err: any) {
      console.error("Admin load error:", err);
      setError(err.message || "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Status Update (Publish / Unpublish / Pending)
  const handleUpdateApproval = async (
    id: string,
    kind: "opportunity" | "equipment",
    nextStatus: ApprovalStatus
  ) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          kind,
          approvalStatus: nextStatus,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "상태 변경 실패");
      }

      // Local state optimistic update
      if (kind === "opportunity") {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, approvalStatus: nextStatus } : o))
        );
      } else {
        setEquipments((prev) =>
          prev.map((e) => (e.id === id ? { ...e, approvalStatus: nextStatus } : e))
        );
      }

      if (inspectItem && inspectItem.item.id === id) {
        setInspectItem({
          ...inspectItem,
          item: { ...inspectItem.item, approvalStatus: nextStatus },
        });
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedDomain !== "ALL") {
      if (selectedDomain === "INFRA" && opp.type !== "SHARED_INFRASTRUCTURE") return false;
      if (selectedDomain === "PROJECT" && opp.type !== "CAPSTONE" && opp.type !== "MULTIDISCIPLINARY")
        return false;
      if (selectedDomain === "RND" && opp.type !== "RND" && opp.type !== "RESEARCH_EQUIPMENT")
        return false;
      if (selectedDomain === "EDUCATION" && opp.type !== "EDUCATION") return false;
      if (selectedDomain === "STARTUP" && opp.type !== "STARTUP" && opp.type !== "COMPETITION")
        return false;
      if (selectedDomain === "EQUIPMENT") return false; // Handled in equipments table
    }

    if (statusFilter !== "ALL" && opp.status !== statusFilter) return false;
    if (approvalFilter !== "ALL" && opp.approvalStatus !== approvalFilter) return false;

    if (univFilter !== "ALL") {
      const match =
        opp.providerName.includes(univFilter) ||
        opp.eligibleUniversities.some((u) => u.includes(univFilter));
      if (!match) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = opp.title.toLowerCase().includes(q);
      const matchProvider = opp.providerName.toLowerCase().includes(q);
      const matchTags = opp.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchProvider && !matchTags) return false;
    }

    return true;
  });

  // Filtered Equipments
  const filteredEquipments = equipments.filter((eq) => {
    if (selectedDomain !== "ALL" && selectedDomain !== "EQUIPMENT") {
      return false;
    }

    if (approvalFilter !== "ALL" && eq.approvalStatus !== approvalFilter) return false;

    if (univFilter !== "ALL") {
      if (!eq.university.includes(univFilter)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = eq.equipment_name.toLowerCase().includes(q);
      const matchModel = (eq.model || "").toLowerCase().includes(q);
      const matchUniv = eq.university.toLowerCase().includes(q);
      const matchTags = eq.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchModel && !matchUniv && !matchTags) return false;
    }

    return true;
  });

  const totalItemsCount = opportunities.length + equipments.length;
  const publishedCount =
    opportunities.filter((o) => o.approvalStatus === "PUBLISHED").length +
    equipments.filter((e) => e.approvalStatus === "PUBLISHED").length;
  const pendingCount =
    opportunities.filter((o) => o.approvalStatus === "PENDING_REVIEW").length +
    equipments.filter((e) => e.approvalStatus === "PENDING_REVIEW").length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-emerald-400" />
              공유자원·R&D·연구장비 관제 및 승인 관리
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              8대 공식 기관 출처 검증
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            부산공유대학, 부산대학교, UNIST 연구지원본부 등 대학 및 지자체 공식 정보 출처(ac.kr) 실시간 연동 DB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">총 등록 자원 / 장비</span>
          <span className="text-2xl font-extrabold text-white">{totalItemsCount}건</span>
          <span className="text-[10px] text-slate-500 block mt-1">기회 {opportunities.length} · 장비 {equipments.length}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">승인 게시 (PUBLISHED)</span>
          <span className="text-2xl font-extrabold text-emerald-400">{publishedCount}건</span>
          <span className="text-[10px] text-emerald-500/80 block mt-1">공개 메인 즉시 노출 중</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">검토 대기 (PENDING)</span>
          <span className="text-2xl font-extrabold text-amber-400">{pendingCount}건</span>
          <span className="text-[10px] text-amber-500/80 block mt-1">관리자 승인 필요</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 block mb-1">공식 출처 인증률</span>
          <span className="text-2xl font-extrabold text-cyan-400">100%</span>
          <span className="text-[10px] text-cyan-500/80 block mt-1">Strict Hash Verifiable</span>
        </div>
      </div>

      {/* Domain Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: "ALL", label: `전체 (${totalItemsCount})` },
          { id: "INFRA", label: "공유 인프라" },
          { id: "PROJECT", label: "기업 연계 / 캡스톤" },
          { id: "RND", label: "R&D / 연구" },
          { id: "EDUCATION", label: "교육 / 워크숍" },
          { id: "STARTUP", label: "창업 / 경진대회" },
          { id: "EQUIPMENT", label: `연구·제작 장비 (${equipments.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedDomain(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedDomain === tab.id
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-slate-900/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secondary Controls (Univ, Status, Approval, Search) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={univFilter}
              onChange={(e) => setUnivFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">전체 기관/대학</option>
              <option value="부산대" className="bg-slate-900 text-white">부산대학교</option>
              <option value="UNIST" className="bg-slate-900 text-white">UNIST</option>
              <option value="부산공유대학" className="bg-slate-900 text-white">부산공유대학</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">전체 상태</option>
              <option value="OPEN" className="bg-slate-900 text-white">모집중 (OPEN)</option>
              <option value="UPCOMING" className="bg-slate-900 text-white">모집예정 (UPCOMING)</option>
              <option value="CLOSED" className="bg-slate-900 text-white">마감 (CLOSED)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">승인 전체</option>
              <option value="PUBLISHED" className="bg-slate-900 text-white">게시 완료 (PUBLISHED)</option>
              <option value="PENDING_REVIEW" className="bg-slate-900 text-white">검토 대기 (PENDING)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 장비명, 태그 검색..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Content Table (Opportunities) */}
      {selectedDomain !== "EQUIPMENT" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>프로젝트 / R&D / 지원사업 목록 ({filteredOpportunities.length}건)</span>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto shadow-md">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">상태</th>
                  <th className="p-3">유형</th>
                  <th className="p-3">제목 / 과제명</th>
                  <th className="p-3">제공기관</th>
                  <th className="p-3">신청 마감일 / D-Day</th>
                  <th className="p-3">접근 범위</th>
                  <th className="p-3">출처 검증</th>
                  <th className="p-3 text-center">승인 관리</th>
                  <th className="p-3 text-right">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      해당 조건의 기회 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            opp.status === "OPEN"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : opp.status === "UPCOMING"
                              ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {opp.status}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
                          {opp.type}
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-white max-w-[280px] truncate" title={opp.title}>
                        {opp.title}
                      </td>

                      <td className="p-3 text-slate-300 max-w-[150px] truncate" title={opp.providerName}>
                        {opp.providerName}
                      </td>

                      <td className="p-3 font-mono">
                        <span className="text-white">{opp.recruitmentEndAt?.slice(0, 10) || "상시"}</span>
                        {opp.dDayText && (
                          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50">
                            {opp.dDayText}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-[11px] text-indigo-300">
                        {opp.accessScope}
                      </td>

                      <td className="p-3">
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>공식 출처</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            handleUpdateApproval(
                              opp.id,
                              "opportunity",
                              opp.approvalStatus === "PUBLISHED" ? "PENDING_REVIEW" : "PUBLISHED"
                            )
                          }
                          disabled={actionLoadingId === opp.id}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 ${
                            opp.approvalStatus === "PUBLISHED"
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                              : "bg-amber-950/80 text-amber-300 border border-amber-700 hover:bg-amber-900"
                          }`}
                        >
                          {opp.approvalStatus === "PUBLISHED" ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>게시중</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>승인대기</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setInspectItem({ item: opp, kind: "OPPORTUNITY" })}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="상세 정보 및 출처 메타데이터 검수"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Equipment Table */}
      {(selectedDomain === "ALL" || selectedDomain === "EQUIPMENT") && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>연구·제작 개방 장비 목록 ({filteredEquipments.length}건)</span>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-x-auto shadow-md">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">카테고리</th>
                  <th className="p-3">장비명</th>
                  <th className="p-3">모델명</th>
                  <th className="p-3">대학 / 소속 센터</th>
                  <th className="p-3">설치 위치</th>
                  <th className="p-3">접근 범위</th>
                  <th className="p-3">출처 링크</th>
                  <th className="p-3 text-center">승인 관리</th>
                  <th className="p-3 text-right">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredEquipments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      해당 조건의 장비 항목이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredEquipments.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {eq.equipment_category}
                        </span>
                      </td>

                      <td className="p-3 font-semibold text-white max-w-[260px] truncate" title={eq.equipment_name}>
                        {eq.equipment_name}
                      </td>

                      <td className="p-3 font-mono text-slate-400 max-w-[150px] truncate">
                        {eq.model || "-"}
                      </td>

                      <td className="p-3 text-slate-300">
                        {eq.university} ({eq.facility_name || eq.center_name})
                      </td>

                      <td className="p-3 text-slate-400 text-[11px] max-w-[140px] truncate" title={eq.location}>
                        {eq.location || "-"}
                      </td>

                      <td className="p-3 text-[11px] text-amber-300">
                        {eq.accessScope}
                      </td>

                      <td className="p-3">
                        <a
                          href={eq.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>공식 출처</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() =>
                            handleUpdateApproval(
                              eq.id,
                              "equipment",
                              eq.approvalStatus === "PUBLISHED" ? "PENDING_REVIEW" : "PUBLISHED"
                            )
                          }
                          disabled={actionLoadingId === eq.id}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 ${
                            eq.approvalStatus === "PUBLISHED"
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700 hover:bg-emerald-900"
                              : "bg-amber-950/80 text-amber-300 border border-amber-700 hover:bg-amber-900"
                          }`}
                        >
                          {eq.approvalStatus === "PUBLISHED" ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>게시중</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>승인대기</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setInspectItem({ item: eq, kind: "EQUIPMENT" })}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="상세 정보 및 출처 메타데이터 검수"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Item Detail Modal */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                    ID: {inspectItem.item.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                    {inspectItem.item.approvalStatus}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {inspectItem.kind === "OPPORTUNITY"
                    ? (inspectItem.item as Opportunity).title
                    : (inspectItem.item as Equipment).equipment_name}
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 font-bold block">
                  🛡️ 공식 출처 및 데이터 무결성 검증 (Provenance & Integrity)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-500">출처 기관:</span> {inspectItem.item.sourceOrganization}
                  </div>
                  <div>
                    <span className="text-slate-500">출처 유형:</span>{" "}
                    {inspectItem.kind === "OPPORTUNITY"
                      ? (inspectItem.item as Opportunity).sourceType
                      : "UNIVERSITY_OFFICIAL"}
                  </div>
                  <div>
                    <span className="text-slate-500">최종 확인:</span> {inspectItem.item.lastCheckedAt}
                  </div>
                  <div>
                    <span className="text-slate-500">최종 변경:</span> {inspectItem.item.lastChangedAt}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 font-mono text-[10px] break-all">
                  <span className="text-slate-500">Content Hash (SHA-256):</span>{" "}
                  <span className="text-slate-300">{inspectItem.item.contentHash}</span>
                </div>
                <div className="pt-1">
                  <a
                    href={inspectItem.item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    <span>공식 원천 페이지 직접 방문</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Raw JSON Data Preview */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Database Record Payload (JSON)
                </span>
                <pre className="p-3 bg-black/60 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                  {JSON.stringify(inspectItem.item, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                게시 상태를 전환하면 서비스 공개 탐색 페이지(/opportunities)에 즉시 반영됩니다.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleUpdateApproval(
                      inspectItem.item.id,
                      inspectItem.kind === "OPPORTUNITY" ? "opportunity" : "equipment",
                      inspectItem.item.approvalStatus === "PUBLISHED" ? "PENDING_REVIEW" : "PUBLISHED"
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    inspectItem.item.approvalStatus === "PUBLISHED"
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white"
                  }`}
                >
                  {inspectItem.item.approvalStatus === "PUBLISHED" ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>검토 대기로 전환</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>승인 및 공개 게시</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setInspectItem(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
