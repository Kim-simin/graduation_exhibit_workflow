"use client";

import React from "react";
import { Equipment } from "@/types/opportunity";
import {
  Wrench,
  Building2,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Info,
} from "lucide-react";

interface EquipmentCardProps {
  equipment: Equipment;
  onOpenDetail: (eq: Equipment) => void;
}

export default function EquipmentCard({ equipment, onOpenDetail }: EquipmentCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "3D Printer":
        return "🖨️";
      case "CNC":
      case "CNC Router":
        return "⚙️";
      case "Laser Cutter":
        return "⚡";
      case "TEM":
      case "Microscope":
        return "🔬";
      case "NMR":
        return "🧪";
      case "4K Camera":
      case "Lighting Equipment":
        return "🎥";
      default:
        return "🛠️";
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "EXTERNAL_RESEARCHER":
        return { label: "외부 연구자/학생 개방", color: "bg-amber-950/70 text-amber-300 border-amber-700/50" };
      case "REGIONAL_STUDENT":
        return { label: "지역 대학생 개방", color: "bg-teal-950/70 text-teal-300 border-teal-700/50" };
      case "SHARED_UNIVERSITY":
        return { label: "공유대학 참여학생", color: "bg-purple-950/70 text-purple-300 border-purple-700/50" };
      case "PUBLIC":
        return { label: "전국 대학생", color: "bg-blue-950/70 text-blue-300 border-blue-700/50" };
      default:
        return { label: "교내 전용", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const scopeInfo = getScopeBadge(equipment.accessScope);

  return (
    <div className="bg-[#121626]/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-5 md:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between group">
      <div>
        {/* 상단 뱃지 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base mr-0.5">{getCategoryIcon(equipment.equipment_category)}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
              {equipment.equipment_category}
            </span>
            {equipment.quantity && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {equipment.quantity}
              </span>
            )}
          </div>

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${scopeInfo.color}`}
          >
            {scopeInfo.label}
          </span>
        </div>

        {/* 장비명 */}
        <h3
          onClick={() => onOpenDetail(equipment)}
          className="text-base md:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug cursor-pointer mb-1"
        >
          {equipment.equipment_name}
        </h3>

        {/* 모델 & 소속 기관 */}
        <div className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{equipment.university}</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">{equipment.facility_name || equipment.center_name}</span>
          </div>

          {equipment.model && (
            <div className="text-[11px] text-slate-500 truncate">
              모델: <span className="text-slate-400">{equipment.model}</span>
            </div>
          )}
        </div>

        {/* 지원 작업 / 연구 */}
        <p className="text-xs text-slate-300/90 line-clamp-2 mb-3 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/40">
          {equipment.supported_work || equipment.supported_research || equipment.specification}
        </p>

        {/* 관련 전공 칩 */}
        <div className="mb-4">
          <div className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1">
            <span>관련 전공:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {equipment.related_majors.slice(0, 4).map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-slate-800/70 text-slate-300 border border-slate-700/60"
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        {/* 원천 정보 검증 영역 */}
        <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{equipment.source_organization}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] text-slate-500">
              {equipment.verified_at.split("T")[0]} 확인
            </span>
          </div>

          <a
            href={equipment.source_url}
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
            onClick={() => onOpenDetail(equipment)}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/60 hover:border-cyan-500/40 transition-all"
          >
            <span>장비정보</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {equipment.reservation_url && (
            <a
              href={equipment.reservation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all"
            >
              <span>이용방법</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
