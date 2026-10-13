import {ChallengeDetail} from '@/components/challenges/Challenges';
export default function Page({params}:{params:{id:string}}){return <ChallengeDetail id={params.id}/>;}
