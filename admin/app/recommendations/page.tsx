'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Check, X, RefreshCw, ShieldCheck, LogOut } from 'lucide-react';
export default function RecommendationAdmin() {
    const [allowed, setAllowed] = useState(false), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [message, setMessage] = useState(''), [rows, setRows] = useState<any[]>([]), [profiles, setProfiles] = useState<any[]>([]), [resources, setResources] = useState<any[]>([]), [busy, setBusy] = useState(false);
    async function load() { if (!supabase)
        return; const { data } = await supabase.auth.getUser(); const admin = data.user?.app_metadata?.platform_role === 'admin'; setAllowed(admin); if (!admin) {
        setRows([]);
        setProfiles([]);
        setResources([]);
        return;
    } const [r, p, s] = await Promise.all([supabase.from('mentor_recommendations').select('*').eq('status', 'pending').order('updated_at'), supabase.from('platform_profiles').select('*').neq('requested_role', 'student'), supabase.from('project_resources').select('*').order('created_at', { ascending: false }).limit(100)]); if (r.error || p.error || s.error) {
        setMessage('DB 마이그레이션 적용 및 관리자 권한을 확인해 주세요.');
        return;
    } setRows(r.data || []); setProfiles(p.data || []); setResources(s.data || []); }
    useEffect(() => { load().catch(() => setMessage('연결 상태를 확인해 주세요.')); const subscription = supabase?.auth.onAuthStateChange(() => { setTimeout(() => load().catch(() => { }), 0); }); return () => subscription?.data.subscription.unsubscribe(); }, []);
    async function login(e: React.FormEvent) { e.preventDefault(); setBusy(true); if (!supabase) {
        setMessage('Supabase 연결을 확인해 주세요.');
        setBusy(false);
        return;
    } const { error } = await supabase.auth.signInWithPassword({ email, password }); setPassword(''); setMessage(error ? '로그인 정보를 확인해 주세요.' : '관리자 권한이 있는 계정만 접근할 수 있습니다.'); await load(); setBusy(false); }
    async function run(name: string, params: Record<string, unknown>) { if (!supabase)
        return; setBusy(true); setMessage(''); try {
        const { error } = await supabase.rpc(name, params);
        if (error)
            throw error;
        setMessage('적용했습니다.');
        await load();
    }
    catch {
        setMessage('처리하지 못했습니다. 권한, 입력 값, 현재 검토 상태를 확인해 주세요.');
    }
    finally {
        setBusy(false);
    } }
    const input = 'w-full border border-gray-300 rounded p-2 bg-white text-gray-900';
    return <main className="max-w-5xl mx-auto p-6 space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">현직자 추천 검토</h1>{allowed && <div className="flex gap-4"><button title="새로고침" aria-label="새로고침" onClick={() => load()}><RefreshCw size={20}/></button><button title="로그아웃" aria-label="로그아웃" onClick={() => supabase?.auth.signOut()}><LogOut size={20}/></button></div>}</div><p role="status">{message}</p>{!allowed ? <form className="space-y-4 max-w-sm" onSubmit={login}><label className="block">관리자 이메일<input className={input} type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label className="block">비밀번호<input className={input} type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label><button className="border rounded px-4 py-2" disabled={busy}>로그인</button></form> : <><section className="border-t pt-6 space-y-4"><h2 className="text-xl font-bold">검토 대기 {rows.length}</h2>{rows.map(row => <ReviewRow key={row.id} row={row} busy={busy} run={run}/>)}{!rows.length && <p>대기 중인 제안이 없습니다.</p>}</section><section className="border-t pt-6 space-y-4"><h2 className="text-xl font-bold">계정 역할 검증</h2>{profiles.map(p => <RoleRow key={p.user_id} profile={p} busy={busy} run={run}/>)}</section><section className="border-t pt-6 space-y-4"><h2 className="text-xl font-bold">리소스 검증 상태</h2>{resources.map(r => <div className="flex flex-wrap justify-between gap-3 border-b py-3" key={r.id}><div><strong>{r.name}</strong><p>{r.kind} · {r.version} · {r.verified_date || '확인일 없음'} · {r.status}</p></div><button disabled={busy || r.status === 'update_needed'} className="border rounded px-3 py-1" onClick={() => run('mark_resource_update_needed', { resource: r.id })}>업데이트 필요 표시</button></div>)}</section></>}</main>;
}
function ReviewRow({ row, busy, run }: {
    row: any;
    busy: boolean;
    run: (name: string, params: Record<string, unknown>) => Promise<void>;
}) {
    const [note, setNote] = useState('');
    return <article className="border rounded p-4 space-y-3"><h3 className="text-lg font-bold">{row.title}</h3><p>{row.summary}</p><p>{row.category} · {row.difficulty} · {row.duration}</p><dl className="space-y-2">{Object.entries(row.body?.body || {}).map(([k, v]) => <div key={k}><dt className="font-semibold">{({ purpose: '목적', problem: '문제', deliverables: '결과물', reason: '추천 근거', industry_tech: '산업 기술', curriculum_gap: '교육 연결', competencies: '역량', work_context: '실무 맥락' } as Record<string, string>)[k] || k}</dt><dd className="whitespace-pre-wrap break-words">{String(v)}</dd></div>)}</dl><h4 className="font-bold">수행 단계</h4>{row.body?.steps?.map((s: any, i: number) => <p key={i}>{i + 1}. {s.title} · {s.instructions} · {s.deliverable}</p>)}<h4 className="font-bold">도구와 권한</h4>{row.body?.resources?.map((r: any, i: number) => <div className="border-l pl-3" key={i}><strong>{r.name} · {r.kind}</strong><p>{r.version} · {r.pricing} · {r.verified_date}</p><p>{r.security_notes}</p><p>{r.prerequisites}</p><p>{r.reason} · {r.usage}</p>{/^https:\/\//.test(r.official_url) && <a className="underline break-all" href={r.official_url} target="_blank" rel="noreferrer">공식 자료 확인</a>}</div>)}<p>기준: {row.criteria?.join(' · ')}</p><label className="block">검토 근거 · 수정 요청<textarea required minLength={5} className="w-full border rounded p-2 bg-white text-gray-900" value={note} onChange={e => setNote(e.target.value)}/></label><div className="flex gap-4"><button className="flex items-center gap-2 border rounded px-3 py-2" disabled={busy || note.trim().length < 5} onClick={() => run('review_mentor_recommendation', { rec_id: row.id, approve: true, note })}><Check size={16}/>승인</button><button className="flex items-center gap-2 border rounded px-3 py-2" disabled={busy || note.trim().length < 5} onClick={() => run('review_mentor_recommendation', { rec_id: row.id, approve: false, note })}><X size={16}/>수정 요청</button></div></article>;
}
function RoleRow({ profile, busy, run }: {
    profile: any;
    busy: boolean;
    run: (name: string, params: Record<string, unknown>) => Promise<void>;
}) { const [evidence, setEvidence] = useState(profile.career_source || ''); return <form className="border-b py-4 space-y-3" onSubmit={e => { e.preventDefault(); run('verify_industry_role', { target_user: profile.user_id, wanted_role: profile.requested_role, evidence_url: evidence }); }}><h3 className="font-bold">{profile.display_name} · {profile.requested_role}</h3><p>{profile.affiliation} · {profile.expertise}</p><p>{profile.bio}</p>{/^https:\/\//.test(profile.career_source) && <a href={profile.career_source} target="_blank" rel="noreferrer" className="underline">신청한 경력 자료</a>}<label className="block">직접 확인한 근거 URL<input required type="url" pattern="https://.*" className="w-full border rounded p-2 bg-white text-gray-900" value={evidence} onChange={e => setEvidence(e.target.value)}/></label><button disabled={busy} className="flex items-center gap-2 border rounded px-3 py-2"><ShieldCheck size={16}/>역할 검증</button></form>; }
