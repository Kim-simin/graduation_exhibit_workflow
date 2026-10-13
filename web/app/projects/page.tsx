import { Suspense } from 'react';
import ProjectBrowser from '@/components/archive/ProjectBrowser';
import { getInitialExhibitions } from '@/lib/get-exhibitions';
import { koreaToday } from '@/lib/archive';
export const dynamic='force-dynamic';
export default function Page(){return <Suspense fallback={<p className="grad-empty">프로젝트를 불러오는 중입니다.</p>}><ProjectBrowser exhibitions={getInitialExhibitions()} today={koreaToday()}/></Suspense>;}
