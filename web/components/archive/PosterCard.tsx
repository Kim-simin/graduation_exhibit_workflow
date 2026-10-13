'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import type { Exhibition } from '@/lib/get-exhibitions';
import { exhibitionStatus, mediaUrl } from '@/lib/archive';
import { SaveButton } from './ArchiveSession';

export function ArchiveImage({src,alt,eager=false}: {src?:string|null;alt:string;eager?:boolean}) {
  const [failed,setFailed]=useState(false);
  return !src || failed ? <span className="grad-image-empty"><ImageOff size={28}/><span>이미지 준비 중</span></span> : <img src={mediaUrl(src)} alt={alt} loading={eager?'eager':'lazy'} decoding="async" onError={()=>setFailed(true)}/>;
}
export default function PosterCard({item,today,onOpen,compact=false}: {item:Exhibition;today:string;onOpen?:(item:Exhibition)=>void;compact?:boolean}) {
  const status=exhibitionStatus(item,today);
  return <article className={'grad-poster-card'+(compact?' is-compact':'')}>
    <Link href={'/exhibit/'+encodeURIComponent(item.id)} onClick={e=>{if(onOpen && !e.ctrlKey && !e.metaKey){e.preventDefault();onOpen(item);}}} className="grad-poster-link">
      <div className="grad-poster"><ArchiveImage src={item.posterPath} alt={item.title+' 포스터'}/></div>
      <div className="grad-card-eyebrow"><span>{item.year}</span><span className={'grad-status status-'+(status==='진행 중'?'live':status==='예정'?'soon':'archive')}>{status}</span></div>
      <h3>{item.title}</h3><p>{item.university} · {item.department}</p><p className="grad-card-date">{item.period||item.schedule||'일정 미정'}</p>
    </Link>
    {!compact&&<div className="grad-card-bottom"><span>{item.venue||'장소 미등록'}</span><SaveButton itemKey={'exhibition:'+item.id}/></div>}
  </article>;
}
