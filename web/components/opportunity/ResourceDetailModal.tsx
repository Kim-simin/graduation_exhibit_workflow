"use client";

import React from "react";
import { Opportunity, Equipment, FacilityItem, CoreCategory } from "@/types/opportunity";
import { getProjectBadge, getRecruitmentStatusInfo } from "@/lib/opportunity";
import {
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  FileText,
  Wrench,
  Award,
  Gift,
  Trophy,
  Cpu,
  MapPin,
  CreditCard,
  School,
  GraduationCap,
  CalendarCheck,
  Layers,
} from "lucide-react";

interface ResourceDetailModalProps {
  item: Opportunity | Equipment | FacilityItem | null;
  category?: CoreCategory | null;
  onClose: () => void;
}

export default function ResourceDetailModal({ item, category, onClose }: ResourceDetailModalProps) {
  if (!item) return null;

  // Determine item kind
  const isFacilityItem = "managingOrg" in item;
  const isEquipment = !isFacilityItem && "equipment_name" in item;
  const isOpportunity = !isFacilityItem && !isEquipment;

  const opp = isOpportunity ? (item as Opportunity) : null;
  const eq = isEquipment ? (item as Equipment) : null;
  const fac = isFacilityItem ? (item as FacilityItem) : null;

  // Effective Category
  const activeCategory: CoreCategory =
    category ||
    (fac || isEquipment
      ? "FACILITY"
      : opp?.type === "COMPETITION" || (opp?.title && /경진대회|공모전|해커톤|아이디어톤/.test(opp.title))
      ? "COMPETITION"
      : "PROJECT");

  // Title & Provider Info
  const title = fac?.name || eq?.equipment_name || opp?.title || "";
  const provider = fac?.managingOrg || `${eq?.university} (${eq?.facility_name || eq?.center_name})` || opp?.providerName || "";
  const university = fac?.university || eq?.university || opp?.region || "";

  // Category-specific details
  const projectBadge = opp ? getProjectBadge(opp) : null;
  const statusInfo = opp
    ? getRecruitmentStatusInfo(opp.status, opp.recruitmentEndAt, opp.recruitmentEvidence?.rollingAdmission)
    : fac
    ? { label: "상시 이용", badgeClass: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60", dotClass: "bg-emerald-400" }
    : { label: "가동중", badgeClass: "bg-emerald-950/70 text-emerald-300 border-emerald-700/60", dotClass: "bg-emerald-400" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111422] border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-indigo-950/40">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between gap-4 bg-slate-900/50">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {activeCategory === "PROJECT" && projectBadge && (
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${projectBadge.badgeClass}`}>
                  [{projectBadge.label}]
                </span>
              )}
              {activeCategory === "COMPETITION" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  [공모전·경진대회]
                </span>
              )}
              {activeCategory === "FACILITY" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  [장비·시설 이용]
                </span>
              )}

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>

              {opp?.dDayText && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
                  {opp.dDayText}
                </span>
              )}
            </div>

            <h2 className="text-xl font-extrabold text-white leading-tight mt-1">
              {title}
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{provider}</span>
              {university && university !== provider && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{university}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* 1. 기본 정보 및 상세 설명 */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>상세 설명</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 text-slate-200 leading-relaxed whitespace-pre-line">
              {fac?.usageCondition || eq?.specification || eq?.supported_work || opp?.description || "상세 정보는 원문 공고를 참조하세요."}
            </div>
          </div>

          {/* 2. 대상 조건 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>대상 학생 / 자격 요건</span>
              </div>
              <div className="text-slate-200 font-medium">
                {opp?.targetStudents || fac?.accessScope || eq?.eligible_users || "전체 학생 지원 가능"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span>요구 전공 / 대상 전공</span>
              </div>
              <div className="text-slate-200 font-medium">
                {activeCategory === "FACILITY"
                  ? fac?.eligibleMajors.length
                    ? fac.eligibleMajors.join(", ")
                    : "전공 무관"
                  : opp?.majorRestriction
                  ? opp.eligibleMajors.join(", ")
                  : "전공 무관 (모든 학과 참여 가능)"}
              </div>
            </div>
          </div>

          {/* 3. 공모전 전용 섹션: 상금 및 팀구성 */}
          {activeCategory === "COMPETITION" && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-700/30 space-y-2">
              <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" />
                <span>상금 및 혜택</span>
              </div>
              <p className="text-white font-bold text-sm">
                {opp?.prizeOrReward || opp?.benefits?.[0] || "공식 공고 확인"}
              </p>
              {opp?.teamComposition && (
                <p className="text-xs text-slate-400">참가 구성: {opp.teamComposition}</p>
              )}
            </div>
          )}

          {/* 4. 시설/장비 전용 섹션: 위치, 비용, 예약방식 */}
          {activeCategory === "FACILITY" && (
            <div className="space-y-4">
              {/* 전문 연구장비 공식 사진 */}
              {fac?.subType === "EQUIPMENT" && fac.imageUrl && (
                <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={fac.imageUrl}
                    alt={fac.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>{fac?.subType === "EQUIPMENT" ? "전문 연구장비 사양 및 이용 규격" : "공간 이용 안내"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">설치 장소: </span>
                    <span className="text-white font-medium">{fac?.location || eq?.location || "캠퍼스 내"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">운영 주체: </span>
                    <span className="text-white font-medium">{fac?.managingOrg || eq?.facility_name || "공동실험실습관"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">이용 방식: </span>
                    <span className="text-cyan-300 font-medium">
                      {fac?.usageMethodRaw || fac?.reservationMethod || "공식 안내 참조"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">이용 대상: </span>
                    <span className="text-cyan-300 font-medium">
                      {fac?.subType === "EQUIPMENT"
                        ? "교내외 대학·연구소·기업 연구자 (회원가입 필요)"
                        : "부산공유대학 14개 참여대학 학생/교직원"}
                    </span>
                  </div>
                  {fac?.subType === "EQUIPMENT" && fac.operator && (
                    <div>
                      <span className="text-slate-400">담당 오퍼레이터: </span>
                      <span className="text-white font-medium">{fac.operator}</span>
                    </div>
                  )}
                  {fac?.subType === "EQUIPMENT" && fac.contact && (
                    <div>
                      <span className="text-slate-400">문의처: </span>
                      <span className="text-slate-200 font-medium">{fac.contact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 이용 수가 및 비용 안내 */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>이용 요금 / 수가 기준</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {fac?.cost || "공식 요금표 참조"}
                </p>
              </div>

              {/* 성능 및 주요 구성 */}
              {fac?.performance && (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
                  <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>주요 구성 및 성능 (Specification)</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {fac.performance}
                  </p>
                </div>
              )}

              {/* 이용 절차 및 공식 가이드 링크 모음 (연구장비 전용) */}
              {fac?.subType === "EQUIPMENT" && (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-700/30 space-y-3">
                  <div className="text-xs text-indigo-300 font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>부산대 공동실험실습관 공식 이용절차 안내</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    본 장비는 부산대학교 공동실험실습관의 정식 연구장비로서, 신분별 이용 절차(회원가입, 자격 요건, 안전교육 및 오퍼레이터 승인)를 거쳐 이용하실 수 있습니다.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <a
                      href="https://labcenter.pusan.ac.kr/kor/CMS/Contents/Contents.do?mCode=MN107"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-[11px] text-slate-200 border border-slate-800 hover:border-indigo-500/50 transition-colors"
                    >
                      <span>부산대 교내 이용절차</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>
                    <a
                      href="https://labcenter.pusan.ac.kr/kor/CMS/Contents/Contents.do?mCode=MN108"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-[11px] text-slate-200 border border-slate-800 hover:border-indigo-500/50 transition-colors"
                    >
                      <span>일반(교외) 이용절차</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>
                    <a
                      href="https://labcenter.pusan.ac.kr/kor/CMS/Contents/Contents.do?mCode=MN109"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-[11px] text-slate-200 border border-slate-800 hover:border-indigo-500/50 transition-colors"
                    >
                      <span>직접 사용자 이용절차</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. 기간 및 일정 (PROJECT & COMPETITION) */}
          {activeCategory !== "FACILITY" && opp && (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
              <div className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>기간 및 일정</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">모집 기간: </span>
                  <span className="text-white font-medium">
                    {opp.recruitmentEndAt
                      ? `${opp.recruitmentStartAt?.split("T")[0] || "시작일"} ~ ${opp.recruitmentEndAt.split("T")[0]}`
                      : opp.recruitmentEvidence?.rollingAdmission
                      ? "상시 모집"
                      : "상세 공고 참조"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">활동/행사 기간: </span>
                  <span className="text-white font-medium">
                    {opp.programStartAt
                      ? `${opp.programStartAt.split("T")[0]} ~ ${opp.programEndAt?.split("T")[0] || "상시"}`
                      : "별도 공지"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. 참여 혜택 (PROJECT) */}
          {activeCategory === "PROJECT" && opp?.benefits && opp.benefits.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>참여 혜택 및 지원 내용</span>
              </h4>
              <ul className="space-y-1.5">
                {opp.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. 원천 정보 검증 박스 */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">원천 정보 검증 (Source Provenance)</span>
              </div>
              <span className="text-[11px] text-emerald-400/80">
                {fac?.verifiedAt?.split("T")[0] || eq?.verified_at?.split("T")[0] || opp?.sourceVerifiedAt?.split("T")[0]} 확인
              </span>
            </div>

            <div className="text-xs text-slate-300">
              <span className="text-slate-400">발행/출처 기관: </span>
              <span className="font-semibold text-white">
                {fac?.sourceOrg || eq?.source_organization || opp?.sourceOrganization}
              </span>
            </div>

            {opp?.studentEligibilityVerified && opp?.eligibilityEvidence && (
              <div className="text-xs text-slate-300 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-300 font-bold block mb-1">🎓 학생 참여 자격 공식 검증:</span>
                <span className="text-slate-200 leading-relaxed">{opp.eligibilityEvidence}</span>
              </div>
            )}

            {opp?.exclusionReason && (
              <div className="text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20">
                <span className="font-bold block mb-1">⚠️ 참가 자격 상태 ({opp.eligibilityStatus === "needs_review" ? "확인 필요" : "제외"}):</span>
                <span>{opp.exclusionReason}</span>
              </div>
            )}

            <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">공식 대학/기관 공식 사이트 직접 등록 원문</span>
              <a
                href={fac?.sourceUrl || eq?.source_url || opp?.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-colors"
              >
                <span>공식 원문 보기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            닫기
          </button>

          {fac?.subType === "EQUIPMENT" ? (
            <a
              href="https://labcenter.pusan.ac.kr/kor/CMS/PnuMember/login.do?mCode=MN001"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all"
            >
              <span>공동실험실습관 로그인 및 예약신청</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            (fac?.reservationUrl || eq?.reservation_url || opp?.applicationUrl || opp?.sourceUrl) && (
              <a
                href={(fac?.reservationUrl || eq?.reservation_url || opp?.applicationUrl || opp?.sourceUrl) as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>
                  {activeCategory === "FACILITY"
                    ? "공간 대여 신청 바로가기"
                    : activeCategory === "COMPETITION"
                    ? "공모전 접수처 이동"
                    : "공식 신청 페이지 이동"}
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
