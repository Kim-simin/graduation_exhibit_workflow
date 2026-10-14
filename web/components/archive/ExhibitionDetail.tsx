'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CalendarDays, MapPin, Share2, Expand } from 'lucide-react';
import type { Exhibition } from '@/lib/get-exhibitions';
import { exhibitionStatus, safeExternalUrl } from '@/lib/archive';
import { isArtworkZoomDisabled } from '@/src/utils/categoryMapper';
import { ArchiveImage } from './PosterCard';
import { SaveButton } from './ArchiveSession';
import Dialog from './Dialog';

export default function ExhibitionDetail({item,today,standalone=false,initialWork}: {item:Exhibition;today:string;standalone?:boolean;initialWork?:string}) {
  const [zoom,setZoom]=useState<number|null>(null);
  const [message,setMessage]=useState('');
  const [limit,setLimit]=useState(24);
  const artworks=item.artworks||[];
  const noZoom=isArtworkZoomDisabled(item);
  useEffect(()=>{if(initialWork!==undefined){const index=Number(initialWork);if(Number.isInteger(index)&&index>=0&&index<artworks.length){setLimit(n=>Math.max(n,index+1));if(!noZoom)setZoom(index);else requestAnimationFrame(()=>document.getElementById('artwork-'+index)?.scrollIntoView());}}},[initialWork,noZoom,artworks.length]);
  const external=safeExternalUrl(item.targetUrl);
  async function share() {
    const url=window.location.origin+'/exhibit/'+encodeURIComponent(item.id);
    try {await navigator.clipboard.writeText(url);setMessage('전시회 링크를 복사했습니다.');}
    catch {setMessage('링크를 복사하지 못했습니다. 주소창의 전시회 주소를 이용해 주세요.');}
  }
  return <div className="grad-detail">
    {standalone&&<Link href="/exhibitions" className="grad-text-link"><ArrowLeft size={17}/>전시회 목록</Link>}
    <div className="grad-detail-top"><button className="grad-detail-poster" onClick={()=>setZoom(-1)} aria-label="포스터 확대"><ArchiveImage src={item.posterPath} alt={item.title+' 포스터'} eager/><span className="grad-expand"><Expand size={18}/></span></button>
      <div className="grad-detail-intro"><div className="grad-kicker">{item.year} · {item.category}</div><h1>{item.title}</h1><p className="grad-detail-school">{item.university}<br/>{item.department}</p><span className="grad-status">{exhibitionStatus(item,today)}</span>
        <dl className="grad-facts"><div><dt><CalendarDays size={17}/>기간</dt><dd>{item.period||item.schedule||'일정 미정'}</dd></div><div><dt><MapPin size={17}/>장소</dt><dd>{item.venue||'장소 미등록'}</dd></div></dl>
        <div className="grad-actions">{external&&<a className="grad-button primary" href={external} target="_blank" rel="noreferrer">공식 전시 <ArrowUpRight size={17}/></a>}<SaveButton itemKey={'exhibition:'+item.id}/><button className="grad-icon" aria-label="전시회 공유" title="전시회 공유" onClick={share}><Share2 size={19}/></button></div><p role="status" className="grad-message">{message}</p>
      </div>
    </div>
    {(item.curationIntro||item.description||item.headline)&&<section className="grad-detail-section"><h2>전시 소개</h2><p className="grad-prose">{item.curationIntro||item.description||item.headline}</p></section>}
    <section className="grad-detail-section"><div className="grad-section-head"><h2>출품 작품 <span>{artworks.length}</span></h2></div><div className="grad-artwork-grid">{artworks.slice(0,limit).map((art,index)=><article key={index} id={'artwork-'+index}>
      {noZoom?<div className="grad-artwork-image"><ArchiveImage src={art.thumbnail || art.thumbnail_url || art.imagePath} alt={art.title}/></div>:<button className="grad-artwork-image" onClick={()=>setZoom(index)} aria-label={art.title+' 확대'}><ArchiveImage src={art.thumbnail || art.thumbnail_url || art.imagePath} alt={art.title}/></button>}
      <p className="grad-kicker">{art.department||item.department}</p><h3>{art.title}</h3><p>{art.author||'작가 미등록'}</p>{art.description&&<details><summary>작품 소개</summary><p className="grad-prose">{art.description}</p></details>}
    </article>)}</div>{!artworks.length&&<p className="grad-empty">등록된 출품 작품이 없습니다.</p>}{limit<artworks.length&&<button className="grad-button grad-more" onClick={()=>setLimit(n=>n+24)}>작품 더보기 ({artworks.length-limit})</button>}</section>
    {zoom!==null&&<Dialog title={zoom===-1?'전시 포스터':artworks[zoom].title} onClose={()=>setZoom(null)} wide><div className="grad-lightbox"><ArchiveImage src={zoom===-1?item.posterPath:(artworks[zoom].original_image_url || artworks[zoom].imagePath)} alt={zoom===-1?item.title:artworks[zoom].title} eager/></div></Dialog>}
  </div>;
}
