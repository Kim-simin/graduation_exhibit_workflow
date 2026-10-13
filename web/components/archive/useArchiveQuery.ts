'use client';
import { useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';

const eventName='grad-query-change';
function subscribe(notify:()=>void){
  window.addEventListener('popstate',notify);
  window.addEventListener(eventName,notify);
  return ()=>{window.removeEventListener('popstate',notify);window.removeEventListener(eventName,notify);};
}
export function useArchiveQuery(){
  const serverParams=useSearchParams();
  const query=useSyncExternalStore(subscribe,()=>window.location.search.slice(1),()=>serverParams.toString());
  return new URLSearchParams(query);
}
export function navigateArchiveQuery(url:string,push=false){
  // Next 14 integrates native history; filters do not need another server render.
  if(push)window.history.pushState(null,'',url);
  else window.history.replaceState(null,'',url);
  window.dispatchEvent(new Event(eventName));
}
