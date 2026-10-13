import {Suspense} from 'react';
import RecommendationForm from '@/components/challenges/RecommendationForm';
export default function Page(){return <Suspense fallback={<p>불러오는 중입니다.</p>}><RecommendationForm/></Suspense>;}
