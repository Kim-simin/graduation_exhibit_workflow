'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Save, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { useArchiveSession } from '../archive/ArchiveSession';
import { callIndustry, getIndustryProfile, getRecommendation, industryClient, readableError } from '@/lib/industry/client';
import { emptyDraft, RecommendationDraft, ProjectResource, RESOURCE_LABELS, ResourceKind } from '@/lib/industry/types';
const bodyLabels: Record<keyof RecommendationDraft['body'], string> = { purpose: '프로젝트 목적', problem: '해결할 문제', deliverables: '최종 결과물', reason: '추천 이유', industry_tech: '현업 기술', curriculum_gap: '교육과 현업의 연결', competencies: '핵심 역량', work_context: '실무 활용 맥락' };
const blankResource: ProjectResource = { name: '', kind: 'tool', official_url: '', version: '', pricing: '확인 필요', prerequisites: '', security_notes: '', verified_date: '', reason: '', usage: '' };
export default function RecommendationForm() {
    const { user, ready } = useArchiveSession();
    const params = useSearchParams(), router = useRouter(), id = params.get('edit');
    const [draft, setDraft] = useState<RecommendationDraft>(emptyDraft), [role, setRole] = useState(''), [loaded, setLoaded] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [library, setLibrary] = useState<ProjectResource[]>([]);
    useEffect(() => { let active = true; if (!user) {
        setLoaded(true);
        return;
    } setLoaded(false); Promise.all([getIndustryProfile(user.id), id ? getRecommendation(id) : Promise.resolve(null), industryClient().from('project_resources').select('*').in('status', ['approved', 'update_needed']).order('name')]).then(([profile, rec, resources]) => { if (!active)
        return; setRole(profile.role || ''); if (id && (!rec || rec.author_id !== user.id)) {
        setMessage('수정 권한이 없는 도전입니다.');
        setRole('');
        return;
    } if (rec)
        setDraft({ ...emptyDraft, ...rec.body, id: rec.id, resources: (rec.body.resources||[]).map(r=>({...r,...rec.resources?.find(saved=>r.id?saved.id===r.id:saved.name===r.name&&saved.kind===r.kind&&saved.official_url===r.official_url)})), steps: rec.steps || [] }); setLibrary(resources.data || []); }).catch(e => { if (active)
        setMessage(readableError(e)); }).finally(() => { if (active)
        setLoaded(true); }); return () => { active = false; }; }, [user?.id, id]);
    function field<K extends keyof RecommendationDraft>(key: K, value: RecommendationDraft[K]) { setDraft(d => ({ ...d, [key]: value })); }
    function resource(i: number, key: keyof ProjectResource, value: string) { field('resources', draft.resources.map((r, n) => n === i ? { ...r, [key]: value } : r)); }
    async function save(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const submit = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'submit'; setBusy(true); setMessage(''); try {
        const saved = await callIndustry<string>('save_mentor_recommendation', { payload: draft, submit_for_review: submit });
        router.push('/challenges/' + saved);
    }
    catch (e) {
        setMessage(readableError(e));
    }
    finally {
        setBusy(false);
    } }
    if (!ready || !loaded)
        return <main className="grad-main"><p className="grad-empty">계정 권한을 확인하는 중입니다.</p></main>;
    if (!user || role !== 'mentor')
        return <main className="grad-main"><h1>도전 제안</h1><p className="grad-empty">{message || '검증된 현직자 계정에서 도전을 제안할 수 있습니다.'}</p><Link className="grad-button primary" href="/my?returnTo=%2Fchallenges%2Fnew">내정보 · 현직자 확인</Link></main>;
    function applyDefaultSteps() {
        field('steps', [
            { title: 'STEP 1 — 문제 정의', instructions: '해결하고자 하는 산업 현장의 실제 문제 상황을 조사하고 명확한 요구사항을 정의합니다.', deliverable: '문제 정의서 및 배경 분석 문서' },
            { title: 'STEP 2 — 관련 기술 학습', instructions: '해당 문제를 해결하는 데 필요한 핵심 라이브러리, AI Model, 소프트웨어를 학습합니다.', deliverable: '핵심 기술 스택 선정 및 사전 조사 리포트' },
            { title: 'STEP 3 — 환경 및 도구 구성', instructions: '개발 환경을 셋업하고 API 키, AI Tool, MCP 연동 등 실행 인프라를 구성합니다.', deliverable: '실행 환경 구성 및 연동 체크리스트' },
            { title: 'STEP 4 — 프로젝트 제작', instructions: '핵심 로직과 사용자 인터페이스를 단계적으로 구현하고 반복 빌드합니다.', deliverable: '프로토타입 / 소스코드' },
            { title: 'STEP 5 — 성능·사용성 검증', instructions: '정의한 문제 해결 요건에 맞춰 실제 테스트를 진행하고 한계점을 분석합니다.', deliverable: '검증 데이터 및 테스트 로그' },
            { title: 'STEP 6 — 최종 결과물 제작', instructions: '테스트 피드백을 반영하여 완성도 높은 산출물을 패키징합니다.', deliverable: '최종 동작 결과물 및 데모 링크' },
            { title: 'STEP 7 — 포트폴리오 정리', instructions: '문제 정의부터 도구 활용, 문제 해결 과정, 검증 근거를 구조화하여 포트폴리오로 정리합니다.', deliverable: '포트폴리오 요약서 및 증빙 링크' },
        ]);
    }

    function addCriteria(item: string) {
        if (!draft.criteria.includes(item)) {
            field('criteria', [...draft.criteria, item]);
        }
    }

    return <main className="grad-main"><div className="grad-page-title"><p className="grad-kicker">NEW CHALLENGE</p><h1>{id ? '도전 수정' : '도전 제안'}</h1></div><form className="industry-form" onSubmit={save}><section className="industry-section"><h2>기본 정보</h2><label>프로젝트 이름<input required maxLength={200} value={draft.title} onChange={e => field('title', e.target.value)}/></label><label>요약<textarea required value={draft.summary} onChange={e => field('summary', e.target.value)}/></label><div className="industry-form-row"><label>산업 · 전공 분야<input required value={draft.category} onChange={e => field('category', e.target.value)}/></label><label>난이도<select value={draft.difficulty} onChange={e => field('difficulty', e.target.value as RecommendationDraft['difficulty'])}>{['입문', '중급', '고급'].map(v => <option key={v}>{v}</option>)}</select></label></div><label>예상 기간<input required value={draft.duration} onChange={e => field('duration', e.target.value)}/></label><label>대표 이미지 URL<input type="url" pattern="https://.*" value={draft.image_url} onChange={e => field('image_url', e.target.value)}/></label><label>대상 전공 (쉼표로 구분)<input value={draft.target_majors.join(',')} onChange={e => field('target_majors', e.target.value.split(','))}/></label><label>대상 직무 (쉼표로 구분)<input value={draft.target_roles.join(',')} onChange={e => field('target_roles', e.target.value.split(','))}/></label></section><section className="industry-section"><h2>문제와 산업 맥락</h2><p className="text-xs text-slate-500 mb-2">※ 현직자가 설명하지 않은 산업 동향을 AI가 사실처럼 자동 작성하지 않도록 실제 경험을 바탕으로 기술해 주세요.</p>{Object.entries(bodyLabels).map(([key, label]) => <label key={key}>{label}<textarea required minLength={key === 'problem' ? 5 : 1} value={draft.body[key as keyof typeof draft.body]} onChange={e => field('body', { ...draft.body, [key]: e.target.value })}/></label>)}</section><section className="industry-section"><div className="grad-section-head"><h2>도구 · 역량</h2><button type="button" className="grad-button" disabled={draft.resources.length >= 30} onClick={() => field('resources', [...draft.resources, { ...blankResource }])}><Plus size={16}/>추가</button></div><p className="text-xs text-slate-500 mb-2">※ 추천 리소스를 등록해도 사용자 PC에 소프트웨어가 자동 설치되거나 MCP 서버가 실행되지 않습니다.</p><label>등록된 리소스<select value="" onChange={e => { const item = library.find(r => r.id === e.target.value); if (item && !draft.resources.some(r => r.id === item.id))
        field('resources', [...draft.resources, { ...item, reason: '', usage: '' }]); }}><option value="">라이브러리에서 선택</option>{library.filter(r => !draft.resources.some(d => d.id === r.id)).map(r => <option key={r.id} value={r.id}>{r.name} · {RESOURCE_LABELS[r.kind]}</option>)}</select></label>{draft.resources.map((r, i) => <fieldset className="industry-resource" key={i}><legend>리소스 {i + 1}</legend><div className="grad-section-head"><strong>{r.id ? '등록된 리소스' : '새 리소스'}</strong><button type="button" className="grad-icon" aria-label={'리소스 ' + (i + 1) + ' 삭제'} title="리소스 삭제" onClick={() => field('resources', draft.resources.filter((_, n) => n !== i))}><Trash2 size={16}/></button></div><label>분류<select disabled={!!r.id} value={r.kind} onChange={e => resource(i, 'kind', e.target.value)}>{Object.entries(RESOURCE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>{([['name', '이름'], ['official_url', '공식 URL'], ['version', '버전'], ['pricing', '가격 · 요금'], ['prerequisites', '선행 조건'], ['security_notes', '보안 · 권한 · 데이터 처리'], ['verified_date', '확인일']] as const).map(([key, label]) => <label key={key}>{label}<input disabled={!!r.id} required={key === 'name' || key === 'official_url'} type={key === 'official_url' ? 'url' : key === 'verified_date' ? 'date' : 'text'} pattern={key === 'official_url' ? 'https://.*' : undefined} value={r[key] || ''} onChange={e => resource(i, key, e.target.value)}/></label>)}<label>선정 이유<textarea required value={r.reason} onChange={e => resource(i, 'reason', e.target.value)}/></label><label>사용 방법<textarea required value={r.usage} onChange={e => resource(i, 'usage', e.target.value)}/></label></fieldset>)}</section><section className="industry-section"><div className="grad-section-head"><h2>수행 단계</h2><div className="flex gap-2"><button type="button" className="grad-button" onClick={applyDefaultSteps}>기본 7단계 템플릿</button><button type="button" className="grad-button" disabled={draft.steps.length >= 30} onClick={() => field('steps', [...draft.steps, { title: '', instructions: '', deliverable: '' }])}><Plus size={16}/>단계 추가</button></div></div>{draft.steps.map((s, i) => <fieldset className="industry-resource" key={i}><legend>{i + 1}단계</legend><div className="grad-actions">{[-1, 1].map(dir => <button key={dir} type="button" className="grad-icon" disabled={i + dir < 0 || i + dir >= draft.steps.length} aria-label={dir < 0 ? '단계 위로' : '단계 아래로'} title={dir < 0 ? '단계 위로' : '단계 아래로'} onClick={() => { const steps = [...draft.steps]; [steps[i], steps[i + dir]] = [steps[i + dir], steps[i]]; field('steps', steps); }}>{dir < 0 ? <ArrowUp size={15}/> : <ArrowDown size={15}/>}</button>)}<button type="button" className="grad-icon" title="단계 삭제" aria-label={'단계 ' + (i + 1) + ' 삭제'} onClick={() => field('steps', draft.steps.filter((_, n) => i !== n))}><Trash2 size={16}/></button></div>{([['title', '단계 이름'], ['instructions', '수행 내용'], ['deliverable', '결과물']] as const).map(([key, label]) => <label key={key}>{label}<textarea required value={s[key]} onChange={e => field('steps', draft.steps.map((step, n) => n === i ? { ...step, [key]: e.target.value } : step))}/></label>)}</fieldset>)}</section><section className="industry-section"><h2>평가 기준 (선택)</h2><div className="flex flex-wrap gap-1.5 mb-2">{['문제 이해도', '기술 활용 적절성', '결과물 완성도', '검증 방법', '문제 해결 과정', '포트폴리오 필수 증빙'].map(item => <button key={item} type="button" className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2 py-1 rounded" onClick={() => addCriteria(item)}>+ {item}</button>)}</div><label>작성된 검토 기준 (한 줄에 하나)<textarea value={draft.criteria.join('\n')} onChange={e => field('criteria', e.target.value.split('\n'))}/></label></section><p className="grad-caption">공개된 제안을 수정하면 다시 검토를 받아야 합니다. 이미 시작한 학생의 원본 기록은 유지됩니다.</p><p role="status" className="grad-message">{message}</p><div className="grad-actions"><button className="grad-button" value="draft" formNoValidate disabled={busy || !draft.title.trim()}><Save size={16}/>임시저장</button><button className="grad-button primary" value="submit" disabled={busy || !draft.steps.length}><Send size={16}/>검토 요청</button></div></form></main>;
}
