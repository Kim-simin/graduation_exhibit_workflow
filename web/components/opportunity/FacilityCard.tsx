"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FacilityItem } from "@/types/opportunity";
import {
  Wrench,
  Building2,
  MapPin,
  GraduationCap,
  Users,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Cpu,
  Microscope,
  DoorOpen,
  Info,
} from "lucide-react";

interface FacilityCardProps {
  facility: FacilityItem;
  onOpenDetail: (facility: FacilityItem) => void;
}

export default function FacilityCard({ facility, onOpenDetail }: FacilityCardProps) {
  const isEquipment = facility.subType === "EQUIPMENT";
  const [imgError, setImgError] = useState(false);

  // 사용 가능 전공 포맷팅
  const majorText =
    facility.eligibleMajors.length === 0 ||
    facility.eligibleMajors.includes("ALL") ||
    facility.eligibleMajors.includes("전공무관")
      ? "전공 무관 (모든 학과 이용 가능)"
      : facility.eligibleMajors.slice(0, 3).join(", ") +
        (facility.eligibleMajors.length > 3 ? ` 외 ${facility.eligibleMajors.length - 3}개` : "");

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between group">
      <div>
        {/* 상단 뱃지 영역: 공유공간 vs 전문 연구장비 구분 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {isEquipment ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
                <Microscope className="w-3 h-3 text-cyan-400" />
                [전문 연구장비]
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                <DoorOpen className="w-3 h-3 text-indigo-400" />
                [공유 공간]
              </span>
            )}

            {isEquipment ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border bg-blue-950/70 text-blue-300 border-blue-700/50">
                {facility.usageType === "ANALYSIS_REQUEST"
                  ? "분석의뢰방식"
                  : facility.usageType === "DIRECT_USE"
                  ? "직접이용(자격/교육)"
                  : facility.usageMethodRaw || "이용안내 참조"}
              </span>
            ) : (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  facility.reservationRequired
                    ? "bg-amber-950/70 text-amber-300 border-amber-700/50"
                    : "bg-emerald-950/70 text-emerald-300 border-emerald-700/50"
                }`}
              >
                <CalendarCheck className="w-3 h-3 mr-1" />
                {facility.reservationRequired ? "예약 필수" : "상시 자율 이용"}
              </span>
            )}

            {isEquipment && facility.urgentAvailable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-700/50">
                긴급분석 가능
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
              isEquipment
                ? "bg-purple-950/70 text-purple-300 border-purple-700/50"
                : facility.externalUserAccess
                ? "bg-purple-950/70 text-purple-300 border-purple-700/50"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {isEquipment ? "외부기관·연구자 개방" : facility.externalUserAccess ? "타 대학 개방" : "교내 재학생 전용"}
          </span>
        </div>

        {/* 썸네일 이미지 (연구장비 공식 사진이 있는 경우) */}
        {isEquipment && facility.imageUrl && !imgError && (
          <div className="relative w-full h-36 mb-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
            <Image
              src={facility.imageUrl}
              alt={facility.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              unoptimized
            />
          </div>
        )}

        {/* 장비/시설명 */}
        <h3
          onClick={() => onOpenDetail(facility)}
          className="text-base md:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug cursor-pointer mb-1"
        >
          {facility.name}
        </h3>

        {/* 영문명 또는 모델명 */}
        {(facility.nameEn || facility.model) && (
          <p className="text-xs text-slate-400 font-mono line-clamp-1 mb-2.5">
            {facility.model ? `[${facility.model}] ` : ""}
            {facility.nameEn || ""}
          </p>
        )}

        {/* 보유 대학 & 운영기관 */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
          <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-200 font-semibold truncate">{facility.university}</span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-300/90 truncate">{facility.labCategory || facility.managingOrg}</span>
        </div>

        {/* 핵심 스펙 및 사용 조건 요약 */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-3.5">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">위치:</span>
            <span className="text-slate-200 truncate">{facility.location}</span>
          </div>

          <div className="flex items-start gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">이용 대상:</span>
            <span className="text-cyan-300 font-medium truncate">
              {isEquipment
                ? "부산대 교내 및 교외 대학·연구기관·산업체"
                : "부산공유대학 14개 참여대학 학생 및 교직원"}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span className="text-slate-400 shrink-0">이용 비용:</span>
            <span className="text-slate-200 font-medium truncate">
              {isEquipment ? "기관별 수가 차등 적용 (교내 60% / 교외 100%)" : facility.cost}
            </span>
          </div>

          {isEquipment ? (
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" />
              <span className="text-slate-400 shrink-0">신청 조건:</span>
              <span className="text-amber-300/90 font-medium truncate">
                {facility.usageType === "DIRECT_USE"
                  ? "회원가입 · 장비별 안전/자격교육 이수 조건"
                  : "회원가입 · 시료 접수 및 분석의뢰 절차"}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Users className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="text-slate-400 shrink-0">신청 방식:</span>
              <span className="text-slate-300 truncate">
                {facility.reservationMethod || "포털 온라인 공간대여 신청"}
              </span>
            </div>
          )}
        </div>

        {/* 장비 특징 / 공간 설명 요약 */}
        <p className="text-xs text-slate-300/80 line-clamp-2 mb-4 leading-relaxed bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/30">
          {facility.features || facility.performance || facility.usageCondition}
        </p>
      </div>

      <div>
        {/* 원천 출처 정보 바 */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{facility.sourceOrg}</span>
          </div>

          <a
            href={facility.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-400 font-medium shrink-0 transition-colors"
          >
            <span>공식 원문</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onOpenDetail(facility)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/60 hover:border-cyan-500/40 transition-all"
          >
            <span>상세정보 확인</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isEquipment ? (
            <a
              href="https://labcenter.pusan.ac.kr/kor/CMS/PnuMember/login.do?mCode=MN001"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center py-2 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all shrink-0"
            >
              <span>공식 예약시스템</span>
            </a>
          ) : (
            facility.reservationUrl && (
              <a
                href={facility.reservationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all shrink-0"
              >
                <span>공간 대여 신청</span>
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}
