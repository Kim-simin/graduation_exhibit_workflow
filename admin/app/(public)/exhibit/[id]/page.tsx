import { redirect, notFound } from 'next/navigation';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
export default function Page({params}: {params:{id:string}}) {
  const item=getInitialExhibitions().find(e=>e.id===params.id||e.id===decodeURIComponent(params.id));
  if(!item)notFound();
  if(item.targetUrl && /^https?:\/\//i.test(item.targetUrl))redirect(item.targetUrl);
  return <main className="p-8"><h1>{item.title}</h1><p>전시 홈페이지 링크 확인 중입니다.</p></main>;
}
