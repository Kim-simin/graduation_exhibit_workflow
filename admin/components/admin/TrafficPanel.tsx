"use client";
import { useEffect, useState } from "react";
import type { aggregateTraffic } from "@/lib/traffic";
type Summary = ReturnType<typeof aggregateTraffic>;

export default function TrafficPanel() {
  const [days, setDays] = useState(1);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [revision, refresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false);
    async function load() {
      try {
        const response = await fetch(`/api/traffic?days=${days}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (!controller.signal.aborted) { setData(result); setError(false); }
      } catch { if (!controller.signal.aborted) setError(true); }
    }
    void load();
    const timer = setInterval(load, 60000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [days, revision]);
  const peak = Math.max(1, ...(data?.buckets.map(b => b.views) || []));
  const date = (at: number) => new Date(at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  return <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-slate-200" aria-label="방문 트래픽">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-bold text-white">방문 트래픽</h2><p className="mt-1 text-xs text-slate-400">로컬 사이트 조회 기록 · 관리자 화면 제외 · 1분마다 갱신</p></div>
      <div className="flex gap-2">{([[1, "1일"], [7, "1주"], [30, "1달"]] as const).map(([value, label]) => <button key={value} aria-pressed={days === value} onClick={() => setDays(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${days === value ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}>{label}</button>)}<button onClick={() => refresh(v => v + 1)} className="rounded-lg border border-slate-700 px-3 text-xs">새로고침</button></div>
    </div>
    <div aria-live="polite">
      {error ? <p role="alert" className="mt-5 text-amber-300">방문 기록을 불러오지 못했습니다. 새로고침해 주세요.</p> : !data ? <p className="mt-5 text-slate-400">기록을 불러오는 중…</p> : <>
        <div className="mt-4 flex flex-wrap items-end gap-4"><div><p className="text-xs text-slate-400">페이지 조회수</p><p className="text-3xl font-bold text-cyan-400">{data.views.toLocaleString()}<span className="ml-1 text-sm">회</span></p></div><p className="text-xs text-slate-400">{date(data.start)} ~ {date(data.end)} (한국 시간)<br/>최근 {days === 1 ? "24시간" : `${days}일`} · 같은 방문자의 반복 조회 포함</p></div>
        {data.views === 0 ? <p className="py-6 text-sm text-slate-400">이 기간에 수집된 조회 기록이 없습니다. 기능 적용 이후의 방문부터 집계됩니다.</p> : <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div><p className="mb-3 text-xs text-slate-400">{days === 1 ? "시간" : "24시간"} 단위 조회 추이 · 막대에 마우스를 올리면 상세 표시</p><div className="flex h-24 items-end gap-1" role="img" aria-label={`기간 내 페이지 조회수 ${data.views}회`} >{data.buckets.map(b => <div key={b.at} title={`${date(b.at)}부터: ${b.views}회`} className="flex-1 rounded-t bg-cyan-500" style={{ height: `${b.views / peak * 100}%`, minHeight: b.views ? 3 : 0 }} />)}</div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{date(data.start)}</span><span>{date(data.end)}</span></div></div>
          <div><p className="mb-2 text-xs text-slate-400">많이 본 페이지</p>{data.pages.map(page => <div key={page.path} className="flex justify-between gap-3 border-b border-slate-800 py-1.5 text-xs"><span className="break-all">{page.path}</span><span className="shrink-0">{page.views}회</span></div>)}</div>
        </div>}
      </>}
    </div>
    <p className="mt-4 text-xs text-slate-500">배포 사이트 통계는 연결되지 않았습니다. IP·쿠키·개인정보를 저장하지 않으며 방문자 수가 아닌 페이지 조회수를 집계합니다.</p>
  </section>;
}
