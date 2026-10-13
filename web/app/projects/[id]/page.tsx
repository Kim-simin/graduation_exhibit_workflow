import ProjectDetail from '@/components/archive/ProjectDetail';
import { koreaToday } from '@/lib/archive';
export default function Page({params}: {params:{id:string}}){return <ProjectDetail id={params.id} today={koreaToday()}/>;}
