'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Save, ArrowLeft, ArrowUpRight, Send, ShieldCheck } from 'lucide-react';
import { useArchiveSession } from '../archive/ArchiveSession';
import { industryClient, callIndustry, readableError, getRecommendations } from '@/lib/industry/client';
import type { Workspace, Recommendation, IndustryReview } from '@/lib/industry/types';
import { safeExternalUrl } from '@/lib/archive';
import { ArchiveImage } from '../archive/PosterCard';
import { STAGE_LIST_STUDENT } from '@/lib/project';
const initial: Workspace = { current_step: 0, tools: '', process: '', problem_solving: '', result: '', validation: '', contribution: '', ai_usage: '', visibility: 'private', stage: 'production', progress: 0, evidence: [] };
const labels: Record<string, string> = { tools: '사용 도구', process: '수행 과정', problem_solving: '문제 해결 기록', result: '결과물 설명', validation: '검증 결과', contribution: '본인의 기여도', ai_usage: 'AI 사용 범위 · 확인 과정' };
export default function ProjectWorkspace({ id }: {
    id: string;
}) {
    const { user, ready } = useArchiveSession();
    const [project, setProject] = useState<any>(null), [workspace, setWorkspace] = useState<Workspace>(initial), [reviews, setReviews] = useState<IndustryReview[]>([]), [source, setSource] = useState<any>(null), [recommendations, setRecommendations] = useState<Recommendation[]>([]), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [reviewer, setReviewer] = useState(''), [question, setQuestion] = useState(''), [request, setRequest] = useState<any>(null);
    useEffect(() => { let active = true; if (!ready)
        return; setLoading(true); const db = industryClient(); Promise.all([db.from('mentoring_projects').select('*').eq('id', id).maybeSingle(), db.from('project_workspaces').select('*').eq('project_id', id).maybeSingle(), db.from('portfolio_evidence').select('*').eq('project_id', id), db.from('industry_reviews').select('*').eq('project_id', id), db.from('project_external_sources').select('*').eq('project_id', id).maybeSingle(), db.from('industry_review_requests').select('*').eq('project_id', id).maybeSingle(), getRecommendations()]).then(([p, w, e, r, s, req, recs]) => { if (!active)
        return; if (p.error)
        throw p.error; setProject(p.data); if (w.error)
        throw w.error; setWorkspace({ ...initial, ...w.data, evidence: e.data || [], visibility: p.data?.visibility || 'public', stage: p.data?.stage || 'production', progress: p.data?.progress || 0 }); setReviews(r.data || []); setSource(s.data); setRequest(req.data); setRecommendations(recs); setReviewer(req.data?.reviewer_id || p.data?.source_snapshot?.author_id || ''); }).catch(e => { if (active)
        setMessage(readableError(e)); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [id, user?.id, ready]);
    function update<K extends keyof Workspace>(key: K, value: Workspace[K]) { setWorkspace(w => ({ ...w, [key]: value })); }
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); try {
        await callIndustry('save_project_workspace', { project: id, payload: workspace });
        setProject((p: any) => ({ ...p, visibility: workspace.visibility, stage: workspace.stage }));
        setMessage('진행 기록과 공개 범위를 저장했습니다.');
    }
    catch (err) {
        setMessage(readableError(err));
    }
    finally {
        setBusy(false);
    } }
    async function requestReview(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); try {
        const rid = await callIndustry<string>('request_industry_review', { project: id, reviewer, question });
        setRequest({ id: rid, status: 'requested', reviewer_id: reviewer });
        setMessage('현직자에게 검토를 요청했습니다.');
    }
    catch (err) {
        setMessage(readableError(err));
    }
    finally {
        setBusy(false);
    } }
    if (loading || !project)
        return <main className="grad-main"><Link href="/projects" className="grad-text-link"><ArrowLeft size={16}/>프로젝트 목록</Link><p className="grad-empty">{loading ? '프로젝트를 불러오는 중입니다.' : message || '접근 가능한 프로젝트를 찾을 수 없습니다. 비공개 프로젝트는 소유자 또는 지정된 검토자만 열 수 있습니다.'}</p>{!user && <Link href={'/my?returnTo=' + encodeURIComponent('/projects/' + id)} className="grad-button primary">로그인</Link>}</main>;
    const owner = project.owner_id === user?.id, snapshot = project.source_snapshot || {};
    const mentors = Array.from(new Map(recommendations.map(r => [r.author_id, r])).values());
    if (snapshot.author_id && !mentors.some(r => r.author_id === snapshot.author_id))
        mentors.push({ author_id: snapshot.author_id, profile: { display_name: '원본 도전 작성자' } } as Recommendation);
    return <main className="grad-main"><Link href="/projects" className="grad-text-link"><ArrowLeft size={16}/>프로젝트 목록</Link><div className="grad-page-title"><p className="grad-kicker">{project.source_type === 'company' ? '기업 프로젝트' : '학생 프로젝트'}{project.project_origin === 'recommended' ? ' · 현직자 추천 기반' : ''}</p><h1>{project.title}</h1><p>{project.summary || project.description}</p><div className="industry-tags"><span>{project.visibility === 'public' ? '공개' : project.visibility === 'limited' ? '소유자 · 지정 검토자' : '비공개 · 지정 검토자 접근 가능'}</span>{reviews.length > 0 && <span><ShieldCheck size={14}/>Industry Reviewed</span>}</div></div>{project.image_url && <div className="challenge-cover"><ArchiveImage src={project.image_url} alt={project.title}/></div>}{snapshot.id && <section className="industry-section"><h2>시작 당시의 추천</h2><p>{snapshot.title} · 버전 {snapshot.revision}</p><p className="grad-prose">{snapshot.body?.body?.problem}</p><ol className="industry-steps">{(snapshot.steps || []).map((s: any, i: number) => <li key={i}><h3>{s.title}</h3><p>{s.instructions}</p><p>결과물: {s.deliverable}</p></li>)}</ol><h3>시작 당시 도구</h3>{(snapshot.resources || []).map((r: any, i: number) => <p key={i}>{r.name} {r.version} · {r.usage}</p>)}<Link className="grad-text-link" href={'/challenges/' + snapshot.id}>현재 추천글 보기<ArrowUpRight size={15}/></Link></section>}{source && <section className="industry-section"><h2>연결한 원본</h2>{safeExternalUrl(source.source_url) && <a href={source.source_url} target="_blank" rel="noreferrer" className="grad-text-link">{source.provider}<ArrowUpRight size={16}/></a>}<p className="grad-caption">최근 동기화 {new Date(source.synced_at).toLocaleString('ko-KR')} · 계정 소유 인증 아님</p>{source.provider === 'behance' && /^https:\/\/www\.behance\.net\/embed\/project\/\d+\?ilo0=1$/.test(source.metadata?.embed || '') && <details><summary>Behance 미리보기</summary><iframe className="industry-embed" title="Behance 프로젝트" src={source.metadata.embed} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" referrerPolicy="no-referrer"/></details>}</section>}
 <form className="industry-form" onSubmit={save}><section className="industry-section"><h2>프로젝트 진행 기록</h2>{owner ? <><div className="industry-form-row"><label>진행 단계<select value={workspace.stage} onChange={e => update('stage', e.target.value)}>{STAGE_LIST_STUDENT.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>진행률<input type="number" min={0} max={100} value={workspace.progress} onChange={e => update('progress', Number(e.target.value))}/></label></div><label>추천 수행 단계<input type="number" min={0} value={workspace.current_step} onChange={e => update('current_step', Number(e.target.value))}/></label>{Object.entries(labels).map(([key, label]) => <label key={key}>{label}<textarea value={String(workspace[key as keyof Workspace] || '')} onChange={e => update(key as keyof Workspace, e.target.value)}/></label>)}</> : <>{Object.entries(labels).map(([key, label]) => <div key={key}><h3>{label}</h3><p className="grad-prose">{String(workspace[key as keyof Workspace] || '미등록')}</p></div>)}</>}</section><section className="industry-section"><div className="grad-section-head"><h2>검증 자료 · 포트폴리오</h2>{owner && <button type="button" className="grad-button" onClick={() => update('evidence', [...workspace.evidence, { title: '', url: '', notes: '' }])}><Plus size={16}/>자료 추가</button>}</div>{workspace.evidence.map((item, i) => owner ? <fieldset className="industry-resource" key={i}><legend>자료 {i + 1}</legend><button type="button" className="grad-icon" title="자료 삭제" aria-label={'자료 ' + (i + 1) + ' 삭제'} onClick={() => update('evidence', workspace.evidence.filter((_, n) => i !== n))}><Trash2 size={16}/></button>{(['title', 'url', 'notes'] as const).map(key => <label key={key}>{{ title: '자료 이름', url: '자료 URL', notes: '자료 설명' }[key]}<input type={key === 'url' ? 'url' : 'text'} pattern={key === 'url' ? 'https://.*' : undefined} required={key !== 'notes'} value={item[key]} onChange={e => update('evidence', workspace.evidence.map((v, n) => n === i ? { ...v, [key]: e.target.value } : v))}/></label>)}</fieldset> : <div className="industry-resource" key={i}>{safeExternalUrl(item.url) && <a href={item.url} target="_blank" rel="noreferrer" className="grad-text-link">{item.title}<ArrowUpRight size={15}/></a>}<p>{item.notes}</p></div>)}{!workspace.evidence.length && <p className="grad-caption">등록된 자료가 없습니다.</p>}</section>{owner && <><label>공개 범위<select value={workspace.visibility} onChange={e => update('visibility', e.target.value as Workspace['visibility'])}><option value="private">비공개</option><option value="limited">제한 공개</option><option value="public">전체 공개</option></select></label><p className="grad-caption">비공개·제한 공개 자료는 소유자, 운영자, 지정한 현직자 검토자만 열 수 있습니다.</p><button className="grad-button primary" disabled={busy}><Save size={16}/>진행 기록 저장</button></>}</form><p role="status" className="grad-message">{message}</p>{owner && <form className="industry-form industry-section" onSubmit={requestReview}><h2>현직자 검토 요청</h2>{request?.status === 'reviewed' ? <p>검토가 완료되었습니다.</p> : <><label>검토자<select required value={reviewer} onChange={e => setReviewer(e.target.value)}><option value="">검토자 선택</option>{mentors.filter(r => r.author_id !== user?.id).map(r => <option key={r.author_id} value={r.author_id}>{r.profile?.display_name || '현직자'} · {r.profile?.expertise || r.category}</option>)}</select></label><label>검토받고 싶은 내용<textarea required value={question} onChange={e => setQuestion(e.target.value)}/></label><p className="grad-caption">저장된 검증 자료를 포함해 지정한 검토자에게 프로젝트 접근을 허용합니다.</p><button className="grad-button" disabled={busy || !workspace.evidence.length}><Send size={16}/>{request ? '검토 요청 수정' : '검토 요청'}</button></>}</form>}<section className="industry-section"><h2>현직자 피드백</h2>{reviews.map(r => <article className="industry-review" key={r.id}><p><ShieldCheck size={15}/>Industry Reviewed · {new Date(r.reviewed_at).toLocaleDateString('ko-KR')}</p><h3>검토 기준</h3><p>{r.criteria}</p><h3>검토 근거</h3><p>{r.evidence_basis}</p><blockquote>{r.comment}</blockquote></article>)}{!reviews.length && <p>검토된 피드백이 없습니다.</p>}<p className="grad-caption">결과물 검토 기록이며 기업 인증이나 채용 보장이 아닙니다.</p></section></main>;
}
