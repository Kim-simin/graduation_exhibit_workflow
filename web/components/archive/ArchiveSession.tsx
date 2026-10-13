'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Session = { user: User | null; ready: boolean; saved: string[]; toggle: (key: string) => void; error: string };
const Context = createContext<Session>({user:null,ready:false,saved:[],toggle:()=>{},error:''});
export function ArchiveSessionProvider({children}: {children: React.ReactNode}) {
  const [user,setUser] = useState<User|null>(null);
  const [ready,setReady] = useState(false);
  const [saved,setSaved] = useState<string[]>([]);
  const [error,setError] = useState('');
  useEffect(()=>{
    if (!supabase) {setReady(true);return;}
    let active=true;
    supabase.auth.getUser().then(({data})=>{if(active){setUser(data.user);setReady(true);}}).catch(()=>{if(active)setReady(true);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setReady(true);});
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);
  useEffect(()=>{
    setSaved([]);setError('');
    if(!user)return;
    const sync=()=>{try {const values=JSON.parse(localStorage.getItem('grad-saved:'+user.id)||'[]');setSaved(Array.isArray(values)?values.filter((v:unknown)=>typeof v==='string'):[]);}catch{setError('저장 목록을 읽을 수 없습니다. 브라우저 저장 설정을 확인해 주세요.');}};
    sync();window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[user?.id]);
  const toggle=useCallback((key:string)=>{
    if(!user)return;
    const next=saved.includes(key)?saved.filter(x=>x!==key):[...saved,key];
    try {localStorage.setItem('grad-saved:'+user.id,JSON.stringify(next));setSaved(next);setError('');}
    catch{setError('저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');}
  },[user,saved]);
  return <Context.Provider value={{user,ready,saved,toggle,error}}>{children}</Context.Provider>;
}
export const useArchiveSession=()=>useContext(Context);
export function SaveButton({itemKey}: {itemKey:string}) {
  const {user,ready,saved,toggle,error}=useArchiveSession();
  const router=useRouter();
  const selected=saved.includes(itemKey);
  return <><button className={'grad-icon'+(selected?' is-saved':'')} disabled={!ready} aria-label={selected?'저장 해제':'저장'} title={selected?'저장 해제':'저장'} aria-pressed={selected} onClick={()=>{
    if(!user){router.push('/my?returnTo='+encodeURIComponent(window.location.pathname+window.location.search));return;}
    toggle(itemKey);
  }}><Bookmark size={19} fill={selected?'currentColor':'none'}/></button>{error&&<span className="grad-error" role="alert">{error}</span>}</>;
}
