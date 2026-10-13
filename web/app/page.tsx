import { getInitialExhibitions, type Exhibition } from "@/lib/get-exhibitions";
import { Suspense } from 'react';
import ArchiveBrowser from '@/components/archive/ArchiveBrowser';
import { koreaToday } from '@/lib/archive';

export type { Exhibition };

export const dynamic = "force-dynamic";

export default function PublicHomePage() {
  const exhibitions = getInitialExhibitions();

  return <Suspense fallback={<p className="grad-empty">전시회를 불러오는 중입니다.</p>}><ArchiveBrowser exhibitions={exhibitions} today={koreaToday()} home /></Suspense>;
}
