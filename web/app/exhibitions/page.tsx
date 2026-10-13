import { Suspense } from 'react';
import ArchiveBrowser from '@/components/archive/ArchiveBrowser';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
import { koreaToday } from '@/lib/archive';
export const dynamic='force-dynamic';
export default function Page(){return <Suspense fallback={<p className="grad-empty">전시회를 불러오는 중입니다.</p>}><ArchiveBrowser exhibitions={getInitialExhibitions()} today={koreaToday()}/></Suspense>;}
