"use client";

import { useEffect, useState } from "react";
import { getOpportunities, getRecruitmentStatusInfo } from "@/lib/opportunity";

export default function OfficialIndustryNotices() {
  const [referenceTime, setReferenceTime] = useState<string | undefined>();
  useEffect(() => {
    const update = () => setReferenceTime(new Date().toISOString());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const notices = getOpportunities(referenceTime).filter(item =>
    item.approvalStatus === "PUBLISHED" && item.officialSourceVerified && item.tags.includes("official-industry-notice")
  );
  if (!notices.length) return null;
  return (
    <section className="mb-8 space-y-4" aria-labelledby="official-notices-title">
      <div>
        <h2 id="official-notices-title" className="text-lg font-bold text-white">공식 산학협력 공고 <span className="text-indigo-300">{notices.length}건</span></h2>
        <p className="mt-1 text-sm text-slate-400">학생 신청과 기업 과제 제안을 구분했습니다. 지원은 각 기관의 공식 절차를 따릅니다.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map(item => {
          const status = getRecruitmentStatusInfo(item.status, item.recruitmentEndAt, item.recruitmentEvidence?.rollingAdmission);
          const company = item.applicantType === "company";
          return (
            <article key={item.id} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="rounded bg-indigo-950 px-2 py-1 text-indigo-200">{company ? "기업·기관 신청" : item.studentEligibilityVerified ? "학생 신청" : "교과목 안내 · 자격 확인 필요"}</span>
                <span className={`rounded border px-2 py-1 ${status.badgeClass}`}>{status.label}</span>
              </div>
              <h3 className="font-bold text-slate-100">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-400">{item.providerName}</p>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{item.description}</p>
              <p className="mt-3 text-xs text-slate-400">대상: {item.targetStudents}</p>
              <p className="mt-2 text-xs text-slate-400">접수: {item.recruitmentEvidence?.rollingAdmission ? "상시 접수 (원문 조건 확인)" : `${item.recruitmentStartAt?.split("T")[0] || "시작일 확인 필요"} ~ ${item.recruitmentEndAt?.split("T")[0] || "마감일 확인 필요"}`}</p>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-indigo-300 hover:underline">공식 공고 보기 ↗</a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
