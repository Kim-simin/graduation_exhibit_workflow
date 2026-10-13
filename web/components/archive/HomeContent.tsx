'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Images } from 'lucide-react';
import type { Exhibition } from '@/lib/get-exhibitions';
import { exhibitionStatus, exhibitionDates, koreaToday } from '@/lib/archive';
import { ArchiveImage } from './PosterCard';
import { ProjectCard, useProjects } from './ProjectBrowser';
import {ChallengePreview,FeedbackFeed} from '../challenges/Challenges';

export function HomeBanner({items,onOpen}: {items:Exhibition[];onOpen:(e:Exhibition)=>void}){
  const [index,setIndex]=useState(0);const today=koreaToday();const featured=[...items].sort((a,b)=>{const aLive=['진행 중','예정'].includes(exhibitionStatus(a,today)),bLive=['진행 중','예정'].includes(exhibitionStatus(b,today));if(aLive!==bLive)return aLive?-1:1;return (exhibitionDates(b.period||b.schedule||'')?.start||'').localeCompare(exhibitionDates(a.period||a.schedule||'')?.start||'');}).slice(0,5);const current=featured[index];
  if(!current)return <div className="grad-empty">공개된 전시회를 준비하고 있습니다.</div>;
  return <section className="about-banner" aria-label="일정으로 만나는 졸업전시"><h1 className="sr-only">GRAD EXHIBIT 졸업전시 아카이브</h1><button className="about-banner-image" onClick={()=>onOpen(current)} aria-label={current.title+' 상세 보기'}><ArchiveImage key={current.id} src={current.posterPath} alt={current.title+' 포스터'} eager/></button><div className="about-banner-caption"><span>일정으로 만나는 졸업전시 · {exhibitionStatus(current,today)}</span><button onClick={()=>onOpen(current)}>{current.title}<ChevronRight size={16}/></button><span>{current.period||current.schedule||'일정 미정'} · {current.university}</span></div><div className="about-banner-controls"><button className="grad-icon" aria-label="이전 전시 배너" title="이전 전시 배너" onClick={()=>setIndex((index+featured.length-1)%featured.length)}><ChevronLeft size={17}/></button><div>{featured.map((item,i)=><button key={item.id} aria-label={'전시 배너 '+(i+1)} aria-pressed={i===index} onClick={()=>setIndex(i)}><span/></button>)}</div><button className="grad-icon" aria-label="다음 전시 배너" title="다음 전시 배너" onClick={()=>setIndex((index+1)%featured.length)}><ChevronRight size={17}/></button></div></section>;
}
function ExhibitionRow({item,today,onOpen}: {item:Exhibition;today:string;onOpen:(e:Exhibition)=>void}){
  return <button className="about-exhibition-row" onClick={()=>onOpen(item)}><div className="about-row-image"><ArchiveImage src={item.posterPath} alt={item.title}/></div><div className="about-row-body"><div className="about-row-meta"><span>{item.category}</span><span className="grad-status">{exhibitionStatus(item,today)}</span></div><h3>{item.title}</h3><p>{item.university} · {item.department}</p><p>{item.period||item.schedule||'일정 미정'}</p><span className="about-work-count"><Images size={12}/>{(item.artworks||[]).length}개 작품</span></div></button>;
}
export function HomeSections({items,today,onOpen}: {items:Exhibition[];today:string;onOpen:(e:Exhibition)=>void}){
  const {projects}=useProjects();const student=projects.filter(p=>p.origin==='student');
  const works=items.flatMap(e=>(e.artworks||[]).slice(0,2).map((art,index)=>({art,e,index}))).slice(0,6);
  const workRow=({art,e,index}:typeof works[number])=><Link key={e.id+':'+index} className="about-exhibition-row" href={'/exhibit/'+e.id+'?work='+index}><div className="about-row-image"><ArchiveImage src={art.imagePath} alt={art.title}/></div><div className="about-row-body"><div className="about-row-meta"><span>{art.department||e.department}</span></div><h3>{art.title}</h3><p>{art.author||'작가 미등록'} · {e.university}</p></div></Link>;
  const firstCount=Math.max(0,3-student.slice(0,3).length);
  return <><section className="about-home-band"><div className="grad-section-head"><div><p className="about-eyebrow">학생들의 프로젝트</p><h2>전공으로 만나는 새로운 시선</h2></div><Link href="/projects?source=student" className="grad-icon" title="학생 프로젝트 전체보기" aria-label="학생 프로젝트 전체보기"><ArrowRight size={18}/></Link></div><div className="about-deck-row industry-student-decks"><section className="about-deck"><h3>학생 프로젝트</h3>{student.slice(0,3).map(p=><ProjectCard key={p.id} project={p} today={today}/>)}{works.slice(0,firstCount).map(workRow)}<Link className="grad-button about-more" href="/projects?source=student">더보기</Link></section>{works.length>firstCount&&<section className="about-deck"><h3>졸업전시 출품 프로젝트</h3>{works.slice(firstCount,firstCount+3).map(workRow)}<Link className="grad-button about-more" href="/projects?source=student&states=완료작품">더보기</Link></section>}</div>{!student.length&&!works.length&&<p className="about-no-events">공개된 학생 프로젝트가 없습니다.</p>}</section><ChallengePreview/><FeedbackFeed/></>;
}
