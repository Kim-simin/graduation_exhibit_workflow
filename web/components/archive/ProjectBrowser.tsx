'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Sparkles, ArrowRight, ArrowUpRight, Building2, GraduationCap, RotateCcw } from 'lucide-react';
import { getProjects, adaptSupabaseProject } from '@/lib/project';
import { getLiveMentoringProjects } from '@/lib/supabase';
import { ArchiveProject, isPublicProject, projectState } from '@/lib/archive-projects';
import { koreaToday } from '@/lib/archive';
import type { Exhibition } from '@/lib/get-exhibitions';
import { ArchiveImage } from './PosterCard';
import { SaveButton } from './ArchiveSession';
import { useArchiveQuery, navigateArchiveQuery } from './useArchiveQuery';
import {ChallengeCard,useRecommendations} from '../challenges/Challenges';

export function useProjects(){
  const [projects,setProjects]=useState<ArchiveProject[]>(()=>getProjects().filter(isPublicProject));
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let active=true;getLiveMentoringProjects().then(records=>{
    if(!active)return;
    const live=records.map(record=>{
      const fields=record as typeof record & { visibility?:'public'|'private'|'limited'; is_demo?:boolean; recruitment_status?:string; recruitment_deadline?:string; owner_id?:string;project_origin?:string };
      return {...adaptSupabaseProject(record),thumbnail:record.image_url||'',visibility:fields.visibility,isDemo:fields.is_demo,recruitmentStatus:fields.recruitment_status,recruitmentDeadline:fields.recruitment_deadline,ownerId:fields.owner_id,projectOrigin:fields.project_origin};
    });
    setProjects(Array.from(new Map([...getProjects(),...live].map(p=>[p.id,p])).values()).filter(isPublicProject));
  }).catch(()=>{if(active)setError('추가 프로젝트를 불러오지 못했습니다. 공개 아카이브만 표시합니다.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  return {projects,loading,error};
}
export function ProjectCard({project,today}: {project:ArchiveProject;today:string}){
  const company=project.origin==='company';const Icon=company?Building2:GraduationCap;
  return <article className="grad-project-card"><Link href={'/projects/'+encodeURIComponent(project.id)}><div className="grad-project-image"><ArchiveImage src={project.thumbnail} alt={project.title}/></div><div className="grad-card-eyebrow"><span><Icon size={14}/>{company?'기업 프로젝트 공고':'학생 제공'}</span><span className="grad-status">{projectState(project,today)}</span></div><h3>{project.title}</h3><p>{company?project.company:project.university} {project.department&&'· '+project.department}</p><p className="grad-project-summary">{project.summary||project.description}</p></Link><div className="grad-card-bottom"><span>{project.category}</span><SaveButton itemKey={'project:'+project.id}/></div></article>;
}
export function ProjectPreview(){
  const {projects}=useProjects();
  return <section className="grad-band"><div className="grad-section-head"><div><p className="grad-kicker">BEYOND GRADUATION</p><h2>다음으로 이어지는 프로젝트</h2></div><Link href="/projects" className="grad-text-link">전체보기 <ArrowRight size={17}/></Link></div><div className="grad-project-grid">{projects.slice(0,3).map(p=><ProjectCard key={p.id} project={p} today={koreaToday()}/>)}</div>{!projects.length&&<p className="grad-empty">공개된 프로젝트가 아직 없습니다.</p>}</section>;
}
export default function ProjectBrowser({exhibitions,today}: {exhibitions:Exhibition[];today:string}){
  const {items:recommendations,error:recommendationError}=useRecommendations();
  const {projects,loading,error}=useProjects();const router=useRouter();const path=usePathname();const params=useArchiveQuery();
  const source=params.get('source')||'all';const states=(params.get('states')||'').split(',').filter(Boolean);const query=params.get('q')||'';const field=params.get('category')||'';
  const [limit,setLimit]=useState(24);
  function update(values:Record<string,string>){const next=new URLSearchParams(params.toString());Object.entries(values).forEach(([key,value])=>value?next.set(key,value):next.delete(key));navigateArchiveQuery(path+'?'+next);setLimit(24);}
  const q=query.trim().toLowerCase();
  const filtered=projects.filter(p=>(source==='all'||p.origin===source||(source==='recommended'&&p.projectOrigin==='recommended')||(source==='pbl'&&p.projectTypes?.includes('PBL')))&&(!states.length||states.includes(projectState(p,today)))&&(!field||p.category===field)&&[p.title,p.summary,p.university,p.company,p.department,...(p.skills||[])].join(' ').toLowerCase().includes(q));
  const recommended=(source==='all'||source==='recommended')&&!states.length?recommendations.filter(r=>(!field||r.category===field)&&[r.title,r.summary,r.category].join(' ').toLowerCase().includes(q)):[];
  filtered.sort((a,b)=>params.get('sort')==='title'?a.title.localeCompare(b.title,'ko'):(b.updatedAt||'').localeCompare(a.updatedAt||''));
  const works=(source==='all'||source==='student')&&(!states.length||states.includes('완료작품'))?exhibitions.flatMap(e=>(e.artworks||[]).map((art,index)=>({art,exhibition:e,index}))).filter(({art,exhibition})=>(!field||exhibition.category===field)&&[art.title,art.author,art.department,exhibition.university].join(' ').toLowerCase().includes(q)):[];
  const categories=Array.from(new Set([...projects.map(p=>p.category),...exhibitions.map(e=>e.category),...recommendations.map(r=>r.category)])).sort();
  return <main className="grad-main">
    <div className="grad-page-title">
      <p className="grad-kicker">PROJECTS</p>
      <div className="grad-section-head">
        <h1>프로젝트</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/challenges/new" className="grad-button">
            <Sparkles size={16}/>
            개인 프로젝트 추천하기
          </Link>
          <Link href="/projects/new" className="grad-button primary">
            <Plus size={16}/>
            프로젝트 등록
          </Link>
        </div>
      </div>
      <p>학생의 아이디어와 기업의 기회가 만나는 곳.</p>
    </div>

    <div className="grad-source-tabs" aria-label="프로젝트 출처">
      {[['all','전체 프로젝트'],['student','학생 프로젝트'],['company','기업 프로젝트'],['recommended','현직자 추천'],['pbl','대학 PBL']].map(([value,label])=><button key={value} aria-pressed={source===value} onClick={()=>update({source:value})}>{label}</button>)}
    </div>

    {source === 'recommended' && (
      <div className="industry-notice rounded-lg my-4">
        <strong>💡 현직자 추천 개인 프로젝트</strong>
        <p className="mt-1 text-xs text-amber-900 leading-relaxed">
          산업 현장 전문가가 최신 기술, AI Tool, MCP를 바탕으로 제안한 실무 학습 프로젝트입니다.
          학생은 추천 프로젝트를 선택해 독립적인 개인 프로젝트로 수행할 수 있습니다.
          <br />
          <span className="text-amber-800 font-medium">
            ※ 본 프로젝트는 실무 역량 강화를 위한 학습 가이드이며, 특정 기업의 채용 가산점이나 공식 인정을 보장하지 않습니다.
          </span>
        </p>
      </div>
    )}

    <div className="grad-project-filter"><fieldset><legend>진행 상태</legend>{['모집중','진행중','완료작품'].map(state=><label key={state}><input type="checkbox" checked={states.includes(state)} onChange={()=>update({states:(states.includes(state)?states.filter(s=>s!==state):[...states,state]).join(',')})}/>{state}</label>)}</fieldset><label className="grad-search"><Search size={18}/><input aria-label="프로젝트 검색" placeholder="프로젝트, 학교, 기업 검색" value={query} onChange={e=>update({q:e.target.value})}/></label><select aria-label="프로젝트 분야" value={field} onChange={e=>update({category:e.target.value})}><option value="">전체 분야</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="grad-result-bar"><span aria-live="polite">프로젝트·작품·도전 <b>{filtered.length+works.length+recommended.length}</b>{loading?' · 불러오는 중':''}</span><div><button className="grad-icon" aria-label="프로젝트 필터 초기화" title="필터 초기화" onClick={()=>router.replace('/projects',{scroll:false})}><RotateCcw size={17}/></button><select aria-label="프로젝트 정렬" value={params.get('sort')||'recent'} onChange={e=>update({sort:e.target.value})}><option value="recent">최근 업데이트순</option><option value="title">이름순</option></select></div></div>{error&&<p role="alert" className="grad-error">{error}</p>}

    {/* 현직자 추천 전용 뷰 */}
    {source === 'recommended' && (
      <>
        {recommendationError && <p role="status" className="grad-error">{recommendationError}</p>}
        {!!recommended.length && (
          <div className="industry-challenge-grid my-4">
            {recommended.map(item => <ChallengeCard key={item.id} item={item} />)}
          </div>
        )}
        {!!filtered.length && (
          <section className="industry-section mt-8">
            <h2>학생이 진행 중인 추천 기반 프로젝트 ({filtered.length})</h2>
            <div className="grad-project-grid">{filtered.map(p => <ProjectCard key={p.id} project={p} today={today} />)}</div>
          </section>
        )}
      </>
    )}

    {/* 일반 프로젝트 그리드 (source !== 'recommended') */}
    {source !== 'recommended' && !!filtered.length && <div className="grad-project-grid">{filtered.map(p=><ProjectCard key={p.id} project={p} today={today}/>)}</div>}

    {/* 전체 탭에서 현직자 추천 섹션 함께 노출 */}
    {source === 'all' && !!recommended.length && (
      <section className="industry-section">
        <div className="grad-section-head">
          <div>
            <p className="grad-kicker">INDUSTRY RECOMMENDED</p>
            <h2>현직자가 제안하는 추천 프로젝트 ({recommended.length})</h2>
          </div>
          <Link href="/projects?source=recommended" className="grad-text-link">추천 전체보기 <ArrowRight size={17}/></Link>
        </div>
        <div className="industry-challenge-grid">{recommended.map(item=><ChallengeCard key={item.id} item={item}/>)}</div>
      </section>
    )}

    {!!works.length&&<section className="grad-band"><div className="grad-section-head"><h2>전시에 소개된 완료작품 <span>{works.length}</span></h2></div><div className="grad-project-grid">{(params.get('sort')==='title'?[...works].sort((a,b)=>a.art.title.localeCompare(b.art.title,'ko')):works).slice(0,limit).map(({art,exhibition,index})=><article className="grad-project-card" key={exhibition.id+':'+index}><Link href={'/exhibit/'+encodeURIComponent(exhibition.id)+'?work='+index}><div className="grad-project-image"><ArchiveImage src={art.thumbnail || art.thumbnail_url || art.imagePath} alt={art.title}/></div><div className="grad-card-eyebrow"><span>학생 제공 · 전시 출품작</span><span className="grad-status">완료작품</span></div><h3>{art.title}</h3><p>{art.author||'작가 미등록'}</p><p>{art.department||exhibition.department} · {exhibition.university}</p></Link></article>)}</div>{limit<works.length&&<button className="grad-button grad-more" onClick={()=>setLimit(n=>n+24)}>완료작품 더보기 ({works.length-limit})</button>}</section>}
    {!filtered.length&&!works.length&&!recommended.length&&!loading&&<div className="grad-empty"><Building2 size={32}/><h2>{source==='company'?'공개된 기업 프로젝트 공고가 없습니다':source==='recommended'?'공개된 현직자 추천 프로젝트가 없습니다':'조건에 맞는 프로젝트가 없습니다'}</h2><p>다른 출처나 진행 상태를 선택해 주세요.</p><button className="grad-text-link" onClick={()=>router.replace('/projects',{scroll:false})}>전체 프로젝트 보기 <ArrowUpRight size={17}/></button></div>}
  </main>;
}
