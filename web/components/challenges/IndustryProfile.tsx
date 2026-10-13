'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Save, RefreshCw, Plus, ArrowUpRight } from 'lucide-react';
import { useArchiveSession } from '../archive/ArchiveSession';
import { callIndustry, getIndustryProfile, industryClient, readableError } from '@/lib/industry/client';
import type { IndustryProfile as Profile } from '@/lib/industry/types';
import { useRecommendations, STATUS_LABELS } from './Challenges';
import { safeExternalUrl } from '@/lib/archive';
export default function IndustryProfile() {
    const { user } = useArchiveSession();
    const [profile, setProfile] = useState<Profile | null>(null), [role, setRole] = useState(''), [available, setAvailable] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    useEffect(() => { let active = true; if (!user)
        return; setProfile({ user_id: user.id, display_name: user.user_metadata?.display_name || '', requested_role: 'student', expertise: '', affiliation: '', bio: '', career_source: '', links: {}, is_public: false }); getIndustryProfile(user.id).then(r => { if (active) {
        if (r.profile)
            setProfile(r.profile);
        setRole(r.role || '');
        setAvailable(true);
    } }).catch(e => { if (active)
        setMessage(readableError(e)); }); return () => { active = false; }; }, [user?.id]);
    if (!profile || !user)
        return null;
    function update<K extends keyof Profile>(key: K, value: Profile[K]) { setProfile(p => p ? { ...p, [key]: value } : p); }
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); try {
        setProfile(await callIndustry<Profile>('save_industry_profile', { payload: profile }));
        setMessage('프로필을 저장했습니다.');
    }
    catch (err) {
        setMessage(readableError(err));
    }
    finally {
        setBusy(false);
    } }
    return <section className="industry-section"><h2>프로필 · 외부 계정</h2><form className="industry-form" onSubmit={save}><div className="industry-form-row"><label>이름<input required maxLength={100} value={profile.display_name} onChange={e => update('display_name', e.target.value)}/></label><label>계정 유형<select value={profile.requested_role} onChange={e => update('requested_role', e.target.value as Profile['requested_role'])}>{[['student', '학생'], ['mentor', '현직자'], ['company', '기업'], ['professor', '교수']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label></div><label>학교 · 소속<input value={profile.affiliation} onChange={e => update('affiliation', e.target.value)}/></label><label>전공 · 전문 분야<input value={profile.expertise} onChange={e => update('expertise', e.target.value)}/></label><label>소개<textarea value={profile.bio} onChange={e => update('bio', e.target.value)}/></label>{profile.requested_role !== 'student' && <><label>경력 확인 자료 URL<input type="url" pattern="https://.*" value={profile.career_source} onChange={e => update('career_source', e.target.value)}/></label><p className="grad-caption">{role === 'mentor' ? '현직자 확인 완료' : '현직자 제안·검토 권한은 운영자의 경력 확인 후 부여됩니다.'}</p></>}{['GitHub', 'Behance', '개인 웹사이트', 'SNS', 'YouTube', '강의 · 코칭'].map(label => <label key={label}>{label}<input type="url" pattern="https://.*" value={profile.links[label] || ''} onChange={e => update('links', { ...profile.links, [label]: e.target.value })}/></label>)}<label className="industry-check"><input type="checkbox" checked={profile.is_public} onChange={e => update('is_public', e.target.checked)}/>프로필과 등록한 링크 공개</label><button className="grad-button primary" disabled={busy || !available}><Save size={16}/>프로필 저장</button><p role="status" className="grad-message">{message}</p></form>{profile.requested_role === 'student' && <PortfolioSync available={available}/>} {role === 'mentor' && <><MyRecommendations userId={user.id}/><ReviewInbox userId={user.id}/></>}</section>;
}
function PortfolioSync({ available }: {
    available: boolean;
}) {
    const { user } = useArchiveSession();
    const [url, setUrl] = useState(''), [title, setTitle] = useState(''), [description, setDescription] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [project, setProject] = useState(''), [sources, setSources] = useState<any[]>([]);
    async function load() { if (!user)
        return; const { data } = await industryClient().from('project_external_sources').select('*').eq('owner_id', user.id).order('synced_at', { ascending: false }); setSources(data || []); }
    useEffect(() => { if (available)
        load().catch(() => { }); }, [available]);
    async function sync(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); setProject(''); try {
        const { data } = await industryClient().auth.getSession();
        const response = await fetch('/api/portfolio/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session?.access_token }, body: JSON.stringify({ url, title, description }) });
        const result = await response.json();
        if (!response.ok) {
            setMessage(result.error || '동기화하지 못했습니다.');
            return;
        }
        setProject(result.projectId);
        setMessage('비공개 프로젝트로 동기화했습니다.');
        await load();
    }
    catch {
        setMessage('연결하지 못했습니다. 다시 시도해 주세요.');
    }
    finally {
        setBusy(false);
    } }
    return <section className="industry-section"><h2>개인 프로젝트 동기화</h2><form className="industry-form" onSubmit={sync}><label>GitHub 저장소 · Behance 프로젝트 · 개인 프로젝트 URL<input required type="url" pattern="https://.*" value={url} onChange={e => setUrl(e.target.value)}/></label><label>프로젝트 이름 (GitHub는 자동 조회)<input required={!/^https:\/\/github\.com\//i.test(url)} maxLength={200} value={title} onChange={e => setTitle(e.target.value)}/></label><label>소개<textarea value={description} onChange={e => setDescription(e.target.value)}/></label><p className="grad-caption">GitHub 공개 저장소의 제목·소개를 조회합니다. Behance와 개인 프로젝트는 링크·입력 정보를 연결합니다. 같은 URL을 다시 동기화하면 기존 프로젝트가 갱신됩니다. 외부 계정 소유 인증은 포함하지 않습니다.</p><button className="grad-button primary" disabled={!available || busy}><RefreshCw size={16}/>프로젝트 동기화</button><p role="status" className="grad-message">{message}</p>{project && <Link href={'/projects/' + project} className="grad-text-link">연결한 프로젝트 열기<ArrowUpRight size={16}/></Link>}</form>{sources.map(s => <div className="industry-list-row" key={s.project_id}><Link href={'/projects/' + s.project_id}>{s.metadata?.title || s.provider}</Link><span>{new Date(s.synced_at).toLocaleDateString('ko-KR')}</span><button className="grad-icon" title="동기화 정보 불러오기" aria-label={(s.metadata?.title || s.provider) + ' 동기화 정보 불러오기'} onClick={() => { setUrl(s.source_url); setTitle(s.metadata?.title || ''); setDescription(s.metadata?.description || ''); }}><RefreshCw size={16}/></button></div>)}</section>;
}
function MyRecommendations({ userId }: {
    userId: string;
}) { const { items, error } = useRecommendations(userId); return <section className="industry-section"><div className="grad-section-head"><h2>내 도전 제안</h2><Link href="/challenges/new" className="grad-button"><Plus size={16}/>제안</Link></div>{error && <p>{error}</p>}{items.map(r => <div className="industry-list-row" key={r.id}><Link href={'/challenges/' + r.id}>{r.title}</Link><span>{STATUS_LABELS[r.status]}</span></div>)}{!items.length && <p className="grad-caption">등록한 제안이 없습니다.</p>}</section>; }
function ReviewInbox({ userId }: {
    userId: string;
}) {
    const [items, setItems] = useState<any[]>([]), [message, setMessage] = useState('');
    useEffect(() => { let active = true; industryClient().from('industry_review_requests').select('*').eq('reviewer_id', userId).eq('status', 'requested').then(({ data, error }) => { if (active) {
        if (error)
            setMessage(readableError(error));
        else
            setItems(data || []);
    } }); return () => { active = false; }; }, [userId]);
    return <section className="industry-section"><h2>도착한 검토 요청</h2>{message && <p>{message}</p>}{items.map(item => <ReviewForm key={item.id} item={item} onDone={() => setItems(rows => rows.filter(r => r.id !== item.id))}/>)}{!items.length && <p className="grad-caption">대기 중인 검토 요청이 없습니다.</p>}</section>;
}
function ReviewForm({ item, onDone }: {
    item: any;
    onDone: () => void;
}) {
    const [criteria, setCriteria] = useState(''), [basis, setBasis] = useState(''), [comment, setComment] = useState(''), [pub, setPub] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
    async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        await callIndustry('submit_industry_review', { request: item.id, criteria_text: criteria, basis, feedback: comment, make_public: pub });
        onDone();
    }
    catch (err) {
        setMessage(readableError(err));
    }
    finally {
        setBusy(false);
    } }
    return <form className="industry-form industry-resource" onSubmit={submit}><Link href={'/projects/' + item.project_id} className="grad-text-link">프로젝트와 근거 확인<ArrowUpRight size={16}/></Link><p className="grad-prose">{item.question}</p><label>검토 기준<textarea required minLength={3} value={criteria} onChange={e => setCriteria(e.target.value)}/></label><label>확인한 자료 · 검토 근거<textarea required minLength={5} value={basis} onChange={e => setBasis(e.target.value)}/></label><label>피드백<textarea required minLength={5} value={comment} onChange={e => setComment(e.target.value)}/></label><label className="industry-check"><input type="checkbox" checked={pub} onChange={e => setPub(e.target.checked)}/>학생이 프로젝트를 공개하면 피드백도 공개</label><button className="grad-button primary" disabled={busy}>검토 완료 · 피드백 등록</button><p role="status">{message}</p></form>;
}
