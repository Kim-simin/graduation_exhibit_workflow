import { notFound } from 'next/navigation';
import ExhibitionDetail from '@/components/archive/ExhibitionDetail';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
import { koreaToday } from '@/lib/archive';
export const dynamic='force-dynamic';
export default function Page({params,searchParams}: {params:{id:string};searchParams:{work?:string}}){
  const item=getInitialExhibitions().find(e=>e.id===params.id);
  if(!item)notFound();
  return <main className="grad-main"><ExhibitionDetail item={item} today={koreaToday()} standalone initialWork={searchParams.work}/></main>;
}
