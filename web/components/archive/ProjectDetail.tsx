'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useProjects } from './ProjectBrowser';
import { ArchiveImage } from './PosterCard';
import { SaveButton } from './ArchiveSession';
import { projectState } from '@/lib/archive-projects';
import { safeExternalUrl } from '@/lib/archive';
import ProjectWorkspace from '../challenges/ProjectWorkspace';

export default function ProjectDetail({id,today}: {id:string;today:string}){
  if(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))return <ProjectWorkspace id={id}/>;
  return <ArchivedProjectDetail id={id} today={today}/>;
}
function ArchivedProjectDetail({id,today}: {id:string;today:string}){
  const {projects,loading,error}=useProjects();const project=projects.find(p=>p.id===id);
  if(!project)return <main className="grad-main"><Link href="/projects" className="grad-text-link"><ArrowLeft size={17}/>프로젝트 목록</Link><div className="grad-empty">{loading?'프로젝트를 불러오는 중입니다.':error||'공개된 프로젝트를 찾을 수 없습니다.'}</div></main>;
  return <main className="grad-main grad-detail"><Link href="/projects" className="grad-text-link"><ArrowLeft size={17}/>프로젝트 목록</Link><div className="grad-detail-top"><div className="grad-detail-poster"><ArchiveImage src={project.coverImage||project.thumbnail} alt={project.title} eager/></div><div className="grad-detail-intro"><p className="grad-kicker">{project.origin==='company'?'기업 프로젝트 공고':'학생 제공'} · {project.category}</p><h1>{project.title}</h1><p>{project.company||project.university} · {project.department}</p><span className="grad-status">{projectState(project,today)}</span><p className="grad-prose">{project.summary||project.description}</p><div className="grad-actions"><SaveButton itemKey={'project:'+project.id}/><Link href={'/mentoring/projects/'+encodeURIComponent(project.id)} className="grad-button">진행 기록 · 피드백 <ArrowUpRight size={17}/></Link></div></div></div>
    <section className="grad-detail-section"><h2>프로젝트 소개</h2><p className="grad-prose">{project.description}</p>{project.problem&&<><h3>해결하려는 문제</h3><p className="grad-prose">{project.problem}</p></>}{project.solution&&<><h3>접근 방법</h3><p className="grad-prose">{project.solution}</p></>}</section>
    <section className="grad-detail-section"><h2>{project.origin==='company'?'모집·협업 정보':'참여 팀'}</h2><div className="grad-team">{project.teamMembers?.map((m,i)=><div key={i}><strong>{m.name}</strong><span>{m.role} {m.department}</span></div>)}</div><p>{project.collaborationNeedLabels?.join(' · ')||'추가 협업 조건 미등록'}</p>{project.origin==='company'&&<p>지원 방법과 조건은 공고의 공식 링크 또는 담당자 안내를 확인해 주세요.</p>}</section>
    <section className="grad-detail-section"><h2>프로젝트 링크</h2><div className="grad-actions">{Object.entries(project.links||{}).filter(([,url])=>safeExternalUrl(url)).map(([label,url])=><a className="grad-button" key={label} href={url} target="_blank" rel="noreferrer">{({live:'서비스',github:'GitHub',figma:'Figma',demo:'데모',portfolio:'포트폴리오',official:'공식 페이지'} as Record<string,string>)[label]||label}<ArrowUpRight size={17}/></a>)}</div>{!Object.values(project.links||{}).some(Boolean)&&<p>등록된 외부 링크가 없습니다.</p>}</section>
  </main>;
}
