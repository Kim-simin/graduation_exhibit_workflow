'use client';

import { useEffect, useRef } from 'react';
import { X, ArrowLeft } from 'lucide-react';

let locks=0;
let originalOverflow='';

export default function Dialog({title,onClose,children,wide=false}: {title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  const close=useRef(onClose);close.current=onClose;
  useEffect(()=>{
    const dialog=ref.current!;
    const previous=document.activeElement as HTMLElement|null;
    if(locks===0)originalOverflow=document.body.style.overflow;
    locks+=1;
    dialog.showModal();document.body.style.overflow='hidden';
    return()=>{dialog.close();locks-=1;if(locks===0)document.body.style.overflow=originalOverflow;if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[]);
  return <dialog ref={ref} className={'grad-dialog'+(wide?' grad-dialog-wide':'')} aria-label={title} onCancel={e=>{e.preventDefault();close.current();}} onClick={e=>{if(e.target===ref.current){const bounds=ref.current.getBoundingClientRect();if(e.clientX<bounds.left||e.clientX>bounds.right||e.clientY<bounds.top||e.clientY>bounds.bottom)close.current();}}}>
    <div className="grad-dialog-head"><button className="grad-icon grad-dialog-back" onClick={onClose} aria-label="뒤로" title="뒤로"><ArrowLeft size={21}/></button><h2>{title}</h2><button className="grad-icon" onClick={onClose} aria-label="닫기" title="닫기"><X size={21}/></button></div>
    <div className="grad-dialog-body">{children}</div>
  </dialog>;
}
