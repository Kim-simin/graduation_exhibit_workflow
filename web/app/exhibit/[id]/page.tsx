import { notFound, redirect } from 'next/navigation';
import { exhibitionLink } from '@/lib/exhibition-link';
import ExhibitionDetail from '@/components/archive/ExhibitionDetail';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
import { koreaToday } from '@/lib/archive';
export const dynamic='force-dynamic';
export default function Page({params,searchParams}: {params:{id:string};searchParams:{work?:string}}){
  const targetId = decodeURIComponent(params.id);
  const item = getInitialExhibitions().find(e => e.id === params.id || e.id === targetId);
  if(!item)notFound();
  const url = exhibitionLink(item.targetUrl);
  if (url) redirect(url);
  return <main className="grad-main"><h1>{item.title}</h1><p>전시 홈페이지 링크를 확인 중입니다.</p></main>;
}
