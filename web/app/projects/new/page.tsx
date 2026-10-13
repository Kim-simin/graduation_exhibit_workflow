'use client';
import { Suspense } from 'react';
import ExistingRegistration from '@/app/mentoring/projects/new/page';
import { AccountGate } from '@/components/archive/MyArchive';
export default function Page(){return <Suspense fallback={<p className="grad-empty">등록 화면을 불러오는 중입니다.</p>}><AccountGate><ExistingRegistration/></AccountGate></Suspense>;}
