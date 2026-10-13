'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus, Search, Play, ShieldCheck } from 'lucide-react';
import { ArchiveImage } from '../archive/PosterCard';
import { useArchiveSession } from '../archive/ArchiveSession';
import { callIndustry, getRecommendation, getRecommendations, getPublicReviews, readableError } from '@/lib/industry/client';
import { Recommendation, IndustryReview, RESOURCE_LABELS } from '@/lib/industry/types';
import { safeExternalUrl } from '@/lib/archive';
export const STATUS_LABELS = { draft: '임시저장', pending: '검토 중', approved: '승인 · 공개 전', published: '공개', rejected: '수정 요청' };
export function useRecommendations(ownId?: string) {
    const [items, setItems] = useState<Recommendation[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
    useEffect(() => { let active = true; setLoading(true); getRecommendations(ownId).then(data => { if (active) {
        setItems(data);
        setError('');
    } }).catch(e => { if (active)
        setError(readableError(e)); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [ownId]);
    return { items, error, loading };
}
export function summarizeResources(resources: import('@/lib/industry/types').ProjectResource[] = []) {
    const tools = resources.filter(r => r.kind === 'tool').map(r => r.name);
    const models = resources.filter(r => r.kind === 'model').map(r => r.name);
    const skills = resources.filter(r => r.kind === 'agent_skill' || r.kind === 'human_skill').map(r => r.name);
    const mcps = resources.filter(r => r.kind === 'mcp').map(r => r.name);
    const programs = resources.filter(r => r.kind === 'program').map(r => r.name);
    return { tools, models, skills, mcps, programs };
}

export function ChallengeCard({ item }: {
    item: Recommendation;
}) {
    const router = useRouter();
    const { user } = useArchiveSession();
    const [starting, setStarting] = useState(false);
    const [startMsg, setStartMsg] = useState('');
    const resList = item.resources || item.body?.resources || [];
    const summary = summarizeResources(resList);
    const lastReviewed = item.reviewed_at || item.updated_at || item.created_at;

    async function handleStart(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            router.push('/my?returnTo=' + encodeURIComponent('/challenges/' + item.id));
            return;
        }
        setStarting(true);
        setStartMsg('');
        try {
            const project = await callIndustry<string>('start_recommended_project', { rec_id: item.id });
            router.push('/projects/' + project);
        } catch (err) {
            setStartMsg(readableError(err));
        } finally {
            setStarting(false);
        }
    }

    return (
        <article className="grad-project-card challenge-card">
            <Link href={'/challenges/' + item.id} className="block">
                <div className="grad-project-image">
                    <ArchiveImage src={item.image_url} alt={item.title}/>
                </div>
                <div className="grad-card-eyebrow">
                    <span>현직자 추천</span>
                    <span>{item.difficulty}</span>
                    {item.duration && <span>{item.duration}</span>}
                </div>
                <h3 className="line-clamp-2">{item.title}</h3>
                <p className="grad-card-author text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {item.profile?.display_name || '현직자'}
                    {(item.profile?.expertise || item.profile?.affiliation) && ` · ${item.profile.expertise || item.profile.affiliation}`}
                </p>
                {(item.target_majors?.length > 0 || item.target_roles?.length > 0) && (
                    <p className="grad-card-targets text-[11px] text-slate-500 my-1">
                        {item.target_majors?.length > 0 && `전공: ${item.target_majors.slice(0, 2).join(', ')}`}
                        {item.target_roles?.length > 0 && ` · 직무: ${item.target_roles.slice(0, 2).join(', ')}`}
                    </p>
                )}
                <p className="grad-project-summary line-clamp-2">{item.summary}</p>

                {/* AI Tool / Model / Skill / MCP 요약 */}
                <div className="industry-tags my-2">
                    {summary.tools.slice(0, 2).map((name, i) => (
                        <span key={'tool-' + i} title="AI Tool">🛠️ {name}</span>
                    ))}
                    {summary.models.slice(0, 2).map((name, i) => (
                        <span key={'model-' + i} title="AI Model">🧠 {name}</span>
                    ))}
                    {summary.skills.slice(0, 2).map((name, i) => (
                        <span key={'skill-' + i} title="AI Skill">⚡ {name}</span>
                    ))}
                    {summary.mcps.slice(0, 1).map((name, i) => (
                        <span key={'mcp-' + i} title="MCP">🔌 {name}</span>
                    ))}
                    {summary.programs.slice(0, 1).map((name, i) => (
                        <span key={'prog-' + i} title="Software">💻 {name}</span>
                    ))}
                </div>
            </Link>

            <div className="grad-card-bottom flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 w-full">
                    <span>{item.category}</span>
                    <span>검토: {new Date(lastReviewed).toLocaleDateString('ko-KR')}</span>
                </div>
                {item.status === 'published' ? (
                    <button
                        className="grad-button primary w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold"
                        disabled={starting}
                        onClick={handleStart}
                    >
                        <Play size={14} />
                        {starting ? '시작하는 중...' : '내 프로젝트로 시작하기'}
                    </button>
                ) : (
                    <span className="text-xs text-center text-slate-400 py-1">
                        {STATUS_LABELS[item.status]}
                    </span>
                )}
                {startMsg && <p className="text-[11px] text-red-500 text-center m-0">{startMsg}</p>}
            </div>
        </article>
    );
}
export function ChallengePreview() { const { items, error, loading } = useRecommendations(); return <section className="about-home-band"><div className="grad-section-head"><div><p className="about-eyebrow">현직자가 제안하는 도전</p><h2>다음으로 이어지는 프로젝트</h2></div><Link href="/challenges" className="grad-icon" aria-label="도전 전체보기" title="도전 전체보기"><ArrowRight size={18}/></Link></div><div className="grad-project-grid">{items.slice(0, 3).map(item => <ChallengeCard key={item.id} item={item}/>)}</div>{!items.length && <p className="about-no-events">{loading ? '도전을 불러오는 중입니다.' : error || '공개된 현직자 도전이 아직 없습니다.'}</p>}</section>; }
export function FeedbackFeed() {
    const [items, setItems] = useState<IndustryReview[]>([]), [message, setMessage] = useState('피드백을 불러오는 중입니다.');
    useEffect(() => { let active = true; getPublicReviews().then(data => { if (active) {
        setItems(data);
        setMessage('공개된 현직자 피드백이 아직 없습니다.');
    } }).catch(e => { if (active)
        setMessage(readableError(e)); }); return () => { active = false; }; }, []);
    return <section className="about-home-band"><p className="about-eyebrow">프로젝트에 남겨진 시선</p><h2>현직자의 피드백</h2>{items.map(r => <article className="industry-review" key={r.id}><Link href={'/projects/' + r.project_id}><h3>{r.project_title || '프로젝트 피드백'}</h3></Link><blockquote>{r.comment}</blockquote><p><ShieldCheck size={15}/> Industry Reviewed · {r.reviewer_snapshot?.display_name || r.profile?.display_name || '검증된 현직자'} · {new Date(r.reviewed_at).toLocaleDateString('ko-KR')}</p><p>검토 기준: {r.criteria}</p><p>검토 근거: {r.evidence_basis}</p></article>)}{!items.length && <p className="about-no-events">{message}</p>}<p className="grad-caption">추천과 결과물 검토는 별개이며, 기업의 인증이나 채용을 보장하지 않습니다.</p></section>;
}
export default function Challenges() {
    const { items, error, loading } = useRecommendations();
    const [query, setQuery] = useState(''), [difficulty, setDifficulty] = useState(''), [major, setMajor] = useState('');
    const filtered = items.filter(r => (!difficulty || r.difficulty === difficulty) && (!major || r.target_majors.includes(major)) && [r.title, r.category, r.summary, ...(r.body?.resources || []).map(t => t.name)].join(' ').toLowerCase().includes(query.toLowerCase()));
    return <main className="grad-main"><div className="grad-page-title"><p className="grad-kicker">INDUSTRY RECOMMENDED</p><div className="grad-section-head"><h1>도전</h1><Link href="/challenges/new" className="grad-button primary"><Plus size={17}/>도전 제안</Link></div><p>현직자가 제안한 문제, 나의 프로젝트로.</p></div><div className="industry-filters"><label className="grad-search"><Search size={18}/><input aria-label="도전 검색" placeholder="프로젝트, 분야, 도구 검색" value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label="도전 난이도" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="">전체 난이도</option>{['입문', '중급', '고급'].map(d => <option key={d}>{d}</option>)}</select><select aria-label="도전 전공" value={major} onChange={e => setMajor(e.target.value)}><option value="">전체 전공</option>{Array.from(new Set(items.flatMap(r => r.target_majors))).map(m => <option key={m}>{m}</option>)}</select></div><p className="grad-caption">현직자 추천 {filtered.length}</p>{error && <p role="status" className="grad-error">{error}</p>}<div className="industry-challenge-grid">{filtered.map(item => <ChallengeCard key={item.id} item={item}/>)}</div>{!filtered.length && <p className="grad-empty">{loading ? '도전을 불러오는 중입니다.' : '조건에 맞는 공개 도전이 없습니다.'}</p>}</main>;
}
export function ChallengeDetail({ id }: {
    id: string;
}) {
    const { user } = useArchiveSession();
    const router = useRouter();
    const [item, setItem] = useState<Recommendation | null>(null), [message, setMessage] = useState(''), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
    useEffect(() => { let active = true; getRecommendation(id).then(r => { if (active)
        setItem(r); }).catch(e => { if (active)
        setMessage(readableError(e)); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; }; }, [id, user?.id]);
    async function action(publish = false) { if (!user) {
        router.push('/my?returnTo=' + encodeURIComponent('/challenges/' + id));
        return;
    } setBusy(true); setMessage(''); try {
        if (publish) {
            await callIndustry('publish_mentor_recommendation', { rec_id: id });
            setItem(await getRecommendation(id));
            setMessage('도전을 공개했습니다.');
        }
        else {
            const project = await callIndustry<string>('start_recommended_project', { rec_id: id });
            router.push('/projects/' + project);
        }
    }
    catch (e) {
        setMessage(readableError(e));
    }
    finally {
        setBusy(false);
    } }
    if (!item)
        return <main className="grad-main"><Link href="/challenges" className="grad-text-link"><ArrowLeft size={16}/>도전 목록</Link><p className="grad-empty">{loading ? '도전을 불러오는 중입니다.' : message || '공개되지 않았거나 접근할 수 없는 도전입니다.'}</p></main>;
    const body = item.body?.body;
    const labels = { purpose: '프로젝트 목적', problem: '해결할 문제', deliverables: '최종 결과물', reason: '추천 이유', industry_tech: '산업 기술과 활용', curriculum_gap: '교육과 현업의 연결', competencies: '핵심 역량', work_context: '실무 활용 맥락' };
    return <main className="grad-main"><Link href="/challenges" className="grad-text-link"><ArrowLeft size={16}/>도전 목록</Link><div className="grad-page-title"><p className="grad-kicker">INDUSTRY RECOMMENDED · {STATUS_LABELS[item.status]}</p><h1>{item.title}</h1><p>{item.summary}</p><div className="industry-tags"><span>{item.difficulty}</span><span>{item.duration}</span><span>{item.category}</span></div></div>{item.image_url && <div className="challenge-cover"><ArchiveImage src={item.image_url} alt={item.title}/></div>}<section className="industry-section"><h2>{item.profile?.display_name || '현직자'}의 제안</h2><p>{item.profile?.affiliation} · {item.profile?.expertise}</p><p className="grad-prose">{item.profile?.bio}</p><div className="grad-actions">{Object.entries(item.profile?.links || {}).filter(([, url]) => safeExternalUrl(url)).map(([label, url]) => <a className="grad-text-link" href={url} target="_blank" rel="noreferrer" key={label}>{label}<ArrowUpRight size={15}/></a>)}</div><p>대상 전공: {item.target_majors.join(', ') || '미등록'}</p><p>대상 직무: {item.target_roles.join(', ') || '미등록'}</p></section><section className="industry-section">{Object.entries(labels).map(([key, label]) => body?.[key as keyof typeof body] && <div key={key}><h2>{label}</h2><p className="grad-prose">{body[key as keyof typeof body]}</p></div>)}</section><section className="industry-section"><h2>사용 도구 · 역량</h2>{(item.resources || []).map((r, i) => <article className="industry-resource" key={r.id || i}><span className="grad-kicker">{RESOURCE_LABELS[r.kind]}</span><h3>{r.name} <small>{r.version}</small></h3><p>{r.reason}</p><p>{r.usage}</p><dl><dt>비용</dt><dd>{r.pricing || '확인 필요'}</dd><dt>선행 조건</dt><dd>{r.prerequisites || '미등록'}</dd><dt>보안 · 권한</dt><dd>{r.security_notes || '확인 필요'}</dd><dt>확인일</dt><dd>{r.verified_date || '미확인'}{(r.status === 'update_needed' || !r.verified_date || Date.now() - Date.parse(r.verified_date) > 180 * 86400000) && ' · 업데이트 확인 필요'}</dd></dl>{safeExternalUrl(r.official_url) && <a href={r.official_url} target="_blank" rel="noreferrer" className="grad-text-link">공식 정보<ArrowUpRight size={15}/></a>}</article>)}{!item.resources?.length && <p>등록된 도구가 없습니다.</p>}</section><section className="industry-section"><h2>수행 단계</h2><ol className="industry-steps">{item.steps?.map((s, i) => <li key={i}><h3>{s.title}</h3><p className="grad-prose">{s.instructions}</p><p>결과물: {s.deliverable || '미등록'}</p></li>)}</ol>{!!item.criteria?.length && <><h3>검토 기준</h3><ul>{item.criteria.map((c, i) => <li key={i}>{c}</li>)}</ul></>}</section>{item.review_note && user?.id === item.author_id && <p className="industry-notice">검토 의견: {item.review_note}</p>}<div className="grad-actions">{item.status === 'published' && <button className="grad-button primary" disabled={busy} onClick={() => action()}><Play size={17}/>내 프로젝트로 시작하기</button>}{user?.id === item.author_id && <><Link className="grad-button" href={'/challenges/new?edit=' + id}>수정</Link>{item.status === 'approved' && <button className="grad-button primary" disabled={busy} onClick={() => action(true)}>승인된 도전 공개</button>}</>}</div><p role="status" className="grad-message">{message}</p>    <div className="industry-notice rounded-lg my-6">
        <h4 className="font-bold text-xs text-amber-900 mb-1">🛡️ 프로젝트 검증 및 권리 분리 원칙</h4>
        <ul className="text-xs text-amber-800 space-y-0.5 list-disc pl-4 leading-relaxed">
            <li><strong>Industry Recommended</strong>: 현직자가 실무 기술과 문제를 추천한 상태이며, 학생의 역량을 검증한 상태가 아닙니다.</li>
            <li><strong>Industry Reviewed</strong>: 학생이 프로젝트를 수행한 후 산출물과 문제 해결 과정을 현직자가 검토한 상태입니다.</li>
            <li><strong>Employer Recognized</strong>: 채용 권한이 있는 기업에서 공식적으로 인정한 경우에만 별도 부여됩니다.</li>
        </ul>
        <p className="text-[11px] text-amber-700 mt-2 font-medium">
            ※ 현직자 추천 프로젝트는 자율적 학습 가이드이며, 특정 기업의 채용 가산점이나 공식 인정을 보장하지 않습니다.
        </p>
    </div>
    </main>;
}
