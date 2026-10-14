'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Search, Palette, Code2, Cog, Film, Paintbrush, Building2, Shirt, Gamepad2, BarChart3, Layers3, RotateCcw } from 'lucide-react';
import type { Exhibition } from '@/lib/get-exhibitions';
import { MAJORS, INDUSTRIES, BrowseMode, inField, exhibitionDates, exhibitionStatus } from '@/lib/archive';
import PosterCard, { ArchiveImage } from './PosterCard';
import Dialog from './Dialog';
import ExhibitionDetail from './ExhibitionDetail';
import { exhibitionLink } from '@/lib/exhibition-link';
import { HomeBanner, HomeSections } from './HomeContent';
import { useArchiveQuery, navigateArchiveQuery } from './useArchiveQuery';

const icons=[Code2,Cog,Palette,Film,Paintbrush,Building2,Shirt,Gamepad2,BarChart3];
export default function ArchiveBrowser({exhibitions,today,home=false}: {exhibitions:Exhibition[];today:string;home?:boolean}) {
  const router=useRouter();const pathname=usePathname();const params=useArchiveQuery();
  const mode:BrowseMode=params.get('mode')==='industry'?'industry':'major';
  const field=params.get('field')||'all';const query=params.get('q')||'';
  const overview=params.get('overview')==='1';const selected=params.get('exhibition');
  const [limit,setLimit]=useState(24);const [panelLimit,setPanelLimit]=useState<Record<string,number>>({});
  const opened=useRef<Record<string,boolean>>({});
  const fields=mode==='major'?MAJORS:INDUSTRIES;
  function update(values:Record<string,string|null>,push=false){
    const next=new URLSearchParams(params.toString());Object.entries(values).forEach(([key,value])=>value?next.set(key,value):next.delete(key));
    const url=pathname+(next.size?'?'+next:'');
    if(push)Object.keys(values).forEach(key=>opened.current[key]=true);
    navigateArchiveQuery(url,push);
  }
  function close(key:string){
    if(opened.current[key])router.back();else update({[key]:null});
  }
  const open=(item:Exhibition)=>{const url=exhibitionLink(item.targetUrl);if(url)window.open(url,'_blank','noopener,noreferrer');};
  useEffect(()=>setLimit(24),[params.toString()]);
  const matchesSearch=(item:Exhibition)=>[item.title,item.university,item.department,item.venue,...(item.tags||[])].join(' ').toLowerCase().includes(query.trim().toLowerCase());
  const year=params.get('year')||'';const school=params.get('school')||'';const status=params.get('status')||'';const location=params.get('location')||'';
  const sorted=[...exhibitions].sort((a,b)=>Number(b.year)-Number(a.year)||a.title.localeCompare(b.title,'ko'));
  const filtered=sorted.filter(item=>matchesSearch(item)&&inField(item,mode,field)&&(!year||String(item.year)===year)&&(!school||item.university===school)&&(!location||item.venue?.includes(location))&&(!status||exhibitionStatus(item,today)===status));
  if(params.get('sort')==='title')filtered.sort((a,b)=>a.title.localeCompare(b.title,'ko'));
  if(params.get('sort')==='date')filtered.sort((a,b)=>(exhibitionDates(b.period||b.schedule||'')?.start||'').localeCompare(exhibitionDates(a.period||a.schedule||'')?.start||''));
  const active=sorted.filter(item=>['예정','진행 중'].includes(exhibitionStatus(item,today)));
  const current=exhibitions.find(item=>item.id===selected);
  const changeMode=(value:BrowseMode)=>update({mode:value,field:null});
  const modeControl=<div className="grad-segment" aria-label="분류 기준">{([['major','전공 분야'],['industry','산업군']] as const).map(([value,label])=><button key={value} aria-pressed={mode===value} onClick={()=>changeMode(value)}>{label}</button>)}</div>;
  return <main className={'grad-main'+(home?' about-home':'')}>
    {home?<HomeBanner items={sorted} onOpen={open}/>:<div className="grad-page-title"><p className="grad-kicker">EXHIBITIONS</p><h1>전시회</h1><p>포스터에서 시작하는 새로운 발견.</p></div>}
    <section className="grad-fields"><div className="grad-section-head"><h2>산업군 / 전공 분야</h2><button className="grad-text-link" onClick={()=>update({overview:'1'},true)}>한눈에 보기 <ArrowRight size={17}/></button></div>{modeControl}
      <div className="grad-category-row">{fields.map((item,index)=>{const Icon=mode==='major'?icons[index]:[Code2,Cog,Building2,Film,Shirt,BarChart3][index];return <Link key={item.id} href={'/exhibitions?mode='+mode+'&field='+item.id} className={field===item.id?'is-active':''}><span className={'grad-category-icon color-'+index%5}><Icon size={25}/></span><span>{item.name}</span></Link>;})}</div>
      {mode==='industry'&&<p className="grad-caption">관련 전공을 기준으로 분류했습니다. 하나의 전시회가 여러 산업군에 포함될 수 있습니다.</p>}
    </section>
    {home?<HomeSections items={sorted} today={today} onOpen={open}/>:<section className="grad-band">
      <div className="grad-filters"><label className="grad-search"><Search size={18}/><input aria-label="전시회 검색" autoFocus={params.get('search')==='1'} value={query} onChange={e=>update({q:e.target.value})} placeholder="전시명, 학교, 학과 검색"/></label>
        <label>분야<select aria-label="분야" value={field} onChange={e=>update({field:e.target.value})}><option value="all">전체 분야</option>{fields.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>연도<select aria-label="연도" value={year} onChange={e=>update({year:e.target.value})}><option value="">전체 연도</option>{Array.from(new Set(exhibitions.map(x=>String(x.year)))).sort().reverse().map(x=><option key={x}>{x}</option>)}</select></label>
        <label>학교<select aria-label="학교" value={school} onChange={e=>update({school:e.target.value})}><option value="">전체 학교</option>{Array.from(new Set(exhibitions.map(x=>x.university))).sort().map(x=><option key={x}>{x}</option>)}</select></label>
        <label>전시 상태<select aria-label="전시 상태" value={status} onChange={e=>update({status:e.target.value})}><option value="">전체 상태</option>{['예정','진행 중','종료','일정 미정'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>지역·장소<input aria-label="지역·장소" value={location} placeholder="지역 또는 장소명" onChange={e=>update({location:e.target.value})}/></label>
      </div><div className="grad-result-bar"><span aria-live="polite">전시회 <b>{filtered.length}</b></span><div><button className="grad-icon" title="필터 초기화" aria-label="필터 초기화" onClick={()=>router.replace('/exhibitions',{scroll:false})}><RotateCcw size={17}/></button><select aria-label="정렬" value={params.get('sort')||'year'} onChange={e=>update({sort:e.target.value})}><option value="year">최근 연도순</option><option value="date">전시 일정순</option><option value="title">전시명순</option></select></div></div>
      <div className="grad-poster-grid">{filtered.slice(0,limit).map(item=><PosterCard key={item.id} item={item} today={today} onOpen={open}/>)}</div>{!filtered.length&&<div className="grad-empty"><Search size={28}/><h3>검색 결과가 없습니다</h3><p>다른 검색어 또는 분야를 선택해 주세요.</p></div>}{limit<filtered.length&&<button className="grad-button grad-more" onClick={()=>setLimit(n=>n+24)}>전시회 더보기</button>}
    </section>}
    {overview&&<Dialog title="졸업전시 한눈에 보기" onClose={()=>close('overview')}><div className="grad-panel-summary"><h3>새로운 시선을 담은 전시 <strong>{exhibitions.length}개</strong></h3><p>분야별 졸업전시를 만나보세요.</p></div>{modeControl}<label className="grad-search grad-panel-search"><Search size={18}/><input aria-label="패널 전시회 검색" value={query} onChange={e=>update({q:e.target.value})} placeholder="전시명, 학교, 학과 검색"/></label><label className="grad-jump">분야 바로가기<select aria-label="분야 바로가기" defaultValue="" onChange={e=>document.getElementById('field-'+e.target.value)?.scrollIntoView({behavior:'smooth',block:'start'})}><option value="" disabled>분야 선택</option>{fields.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>{mode==='industry'&&<p className="grad-caption">관련 전공 기준 분류 · 분야 간 중복 전시 포함</p>}
      {fields.map(f=>{const group=sorted.filter(item=>matchesSearch(item)&&inField(item,mode,f.id));const count=panelLimit[f.id]||12;return <section className="grad-panel-group" key={f.id} id={'field-'+f.id}><h3>{f.name} <span>{group.length}</span></h3>{group.length?<><div className="grad-panel-grid">{group.slice(0,count).map(item=><PosterCard key={item.id} item={item} today={today} compact onOpen={open}/>)}</div>{group.length>count&&<button className="grad-button grad-more" onClick={()=>setPanelLimit(p=>({...p,[f.id]:count+12}))}>더보기 ({group.length-count})</button>}</>:<p className="grad-small-empty">{query?'검색 조건에 맞는 전시가 없습니다.':'아직 등록된 전시가 없습니다.'}</p>}</section>;})}
    </Dialog>}
  </main>;
}
function CalendarEmpty(){return <Layers3 size={30} strokeWidth={1.5}/>;}
