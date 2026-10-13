import type { MentoringProject } from '@/types/project';

export type ProjectState='모집중'|'진행중'|'완료작품'|'모집 종료'|'취소'|'결과물 미등록';
export type ArchiveProject=MentoringProject & { recruitmentStatus?:string; recruitmentDeadline?:string; ownerId?:string;projectOrigin?:string };
export function projectState(project:ArchiveProject,today:string):ProjectState {
  if(project.recruitmentStatus==='cancelled')return '취소';
  if(project.progressStage==='completed'){
    const evidence=project.milestones?.some(m=>m.evidence?.some(e=>e.url||e.thumbnail)||m.images?.length||m.externalLinks?.length);
    return evidence||Object.values(project.links||{}).some(Boolean)?'완료작품':'결과물 미등록';
  }
  if(project.recruitmentStatus==='closed'||(project.recruitmentDeadline&&project.recruitmentDeadline<today))return '모집 종료';
  if(project.recruitmentStatus==='open'||project.recruitmentStatus==='recruiting'||(project.origin==='company'&&project.progressStage==='solution'))return '모집중';
  return '진행중';
}
export function isPublicProject(project:ArchiveProject){return !project.isDemo && (!project.visibility||project.visibility==='public');}
