import { notFound } from 'next/navigation';
import ExhibitionDetail from '@/components/archive/ExhibitionDetail';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
import { koreaToday } from '@/lib/archive';
export const dynamic='force-dynamic';
export default function Page({params,searchParams}: {params:{id:string};searchParams:{work?:string}}){
  const targetId = decodeURIComponent(params.id);
  const item = getInitialExhibitions().find(e => e.id === params.id || e.id === targetId);
  if(!item)notFound();
  return <main className="grad-main"><ExhibitionDetail item={item} today={koreaToday()} standalone initialWork={searchParams.work}/></main>;
}
