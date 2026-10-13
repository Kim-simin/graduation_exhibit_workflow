'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, LogOut, UserRound, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useArchiveSession } from './ArchiveSession';
import PosterCard from './PosterCard';
import { ProjectCard, useProjects } from './ProjectBrowser';
import type { Exhibition } from '@/lib/get-exhibitions';
import IndustryProfile from '../challenges/IndustryProfile';
import {useOwnedProjects} from '../challenges/useOwnedProjects';

export function AccountGate({children}: {children:React.ReactNode}){
  const {user,ready}=useArchiveSession();
  if(!ready)return <p className="grad-empty">로그인 상태를 확인하는 중입니다.</p>;
  if(!user)return <main className="grad-main"><div className="grad-empty"><UserRound size={32}/><h1>로그인이 필요합니다</h1><p>프로젝트를 등록하려면 먼저 로그인해 주세요.</p><Link href="/my?returnTo=%2Fprojects%2Fnew" className="grad-button primary">로그인</Link></div></main>;
  return <>{children}</>;
}
export default function MyArchive({exhibitions,today}: {exhibitions:Exhibition[];today:string}){
  const {user,ready,saved,error:storageError}=useArchiveSession();const {projects}=useProjects();const {projects:ownedProjects,error:ownedError}=useOwnedProjects(user?.id);
  const router=useRouter();const params=useSearchParams();
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [signup,setSignup]=useState(false);const [tab,setTab]=useState('profile');
  async function submit(event:React.FormEvent){
    event.preventDefault();if(!supabase)return;setBusy(true);setMessage('');
    try{
      const result=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});
      if(result.error){setMessage(signup?'가입을 완료하지 못했습니다. 이메일과 비밀번호 조건을 확인해 주세요.':'로그인하지 못했습니다. 이메일과 비밀번호를 확인해 주세요.');return;}
      if(signup&&!result.data.session){setMessage('이메일로 전송된 가입 확인 링크를 확인해 주세요.');return;}
      const target=params.get('returnTo');if(target&&/^\/(?!\/)/.test(target)&&!target.includes('\\'))router.replace(target);
    }catch{setMessage('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');}finally{setBusy(false);}
  }
  async function signOut(){setBusy(true);try{const result=await supabase?.auth.signOut();if(result?.error)setMessage('로그아웃하지 못했습니다. 다시 시도해 주세요.');}finally{setBusy(false);}}
  if(!ready)return <main className="grad-main"><p className="grad-empty">내정보를 불러오는 중입니다.</p></main>;
  return <main className="grad-main"><div className="grad-page-title"><p className="grad-kicker">MY ARCHIVE</p><h1>내정보</h1><p>관심 있는 전시와 프로젝트를 한곳에.</p></div>{!user?<div className="grad-account-layout"><div className="grad-account-intro"><UserRound size={40} strokeWidth={1.4}/><h2>나의 다음 발견을<br/>기록하세요.</h2><p>전시회와 프로젝트 탐색은 로그인 없이도 가능합니다.</p><Link href="/exhibitions" className="grad-text-link">전시회 둘러보기</Link></div><form className="grad-login" onSubmit={submit}><h2>{signup?'회원가입':'로그인'}</h2><label>이메일<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>비밀번호<input type="password" required minLength={6} autoComplete={signup?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="grad-button primary" disabled={busy||!supabase}>{busy?'처리 중…':signup?'회원가입':'로그인'}</button><button className="grad-text-link" type="button" onClick={()=>{setSignup(!signup);setMessage('');}}>{signup?'기존 계정으로 로그인':'새 계정 만들기'}</button>{!supabase&&<p className="grad-error">현재 계정 서비스가 연결되지 않았습니다.</p>}<p role="status" className="grad-message">{message}</p></form></div>:<>
    <div className="grad-profile"><span className="grad-avatar"><UserRound size={30}/></span><div><h2>{user.user_metadata?.display_name||user.user_metadata?.name||'나의 아카이브'}</h2><p>{user.email}</p></div><button className="grad-button" disabled={busy} onClick={signOut}><LogOut size={17}/>로그아웃</button></div>
    <div className="grad-source-tabs">{[['profile','프로필 · 연결'],['saved','저장한 항목'],['mine','내 프로젝트'],['applications','지원·참여 내역']].map(([value,label])=><button key={value} aria-pressed={tab===value} onClick={()=>setTab(value)}>{label}</button>)}</div>
    {tab==='profile'&&<IndustryProfile/>}
    {(message||storageError)&&<p role="alert" className="grad-error">{message||storageError}</p>}
    {tab==='saved'&&<section className="grad-band"><p className="grad-caption">저장 목록은 로그인한 계정별로 이 브라우저에 보관됩니다.</p><h2>저장한 전시회</h2><div className="grad-poster-grid">{exhibitions.filter(e=>saved.includes('exhibition:'+e.id)).map(e=><PosterCard key={e.id} item={e} today={today}/>)}</div><h2 className="grad-spaced">저장한 프로젝트</h2><div className="grad-project-grid">{projects.filter(p=>saved.includes('project:'+p.id)).map(p=><ProjectCard key={p.id} project={p} today={today}/>)}</div>{!saved.length&&<div className="grad-empty"><Bookmark size={30}/><h3>아직 저장한 항목이 없습니다</h3><Link href="/exhibitions" className="grad-text-link">전시회 둘러보기</Link></div>}</section>}
    {tab==='mine'&&<section className="grad-band"><div className="grad-section-head"><h2>내 프로젝트</h2><Link href="/projects/new" className="grad-button primary"><Plus size={17}/>등록</Link></div><div className="grad-project-grid">{ownedProjects.map(p=><ProjectCard key={p.id} project={p} today={today}/>)}</div>{!ownedProjects.length&&<p className="grad-empty">{ownedError||'현재 계정에 연결된 프로젝트가 없습니다. 프로필 · 연결에서 개인 프로젝트를 동기화할 수 있습니다.'}</p>}</section>}
    {tab==='applications'&&<div className="grad-empty"><h2>지원·참여 내역 연동 준비 중</h2><p>현재 지원은 각 공고의 공식 접수처에서 진행됩니다. 접수 결과는 해당 기관에서 확인해 주세요.</p></div>}
  </>}</main>;
}
