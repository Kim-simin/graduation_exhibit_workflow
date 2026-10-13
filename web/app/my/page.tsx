import { Suspense } from 'react';
import MyArchive from '@/components/archive/MyArchive';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
import { koreaToday } from '@/lib/archive';
export const dynamic='force-dynamic';
export default function Page(){return <Suspense fallback={<p className="grad-empty">내정보를 불러오는 중입니다.</p>}><MyArchive exhibitions={getInitialExhibitions()} today={koreaToday()}/></Suspense>;}
