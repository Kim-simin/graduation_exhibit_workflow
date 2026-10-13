'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Images, Layers3, UserRound, Search, ArrowUpRight, Flag } from 'lucide-react';
import { ArchiveSessionProvider, useArchiveSession } from './ArchiveSession';

const items = [
  { href: '/', label: '홈', icon: Home },
  { href: '/exhibitions', label: '전시회', icon: Images },
  { href: '/projects', label: '프로젝트', icon: Layers3 },
  { href: '/mentoring', label: '멘토링', icon: Flag },
  { href: '/my', label: '내정보', icon: UserRound },
];

export default function ArchiveShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname.startsWith('/exhibit') ? '/exhibitions' : pathname.startsWith('/mentoring') ? '/mentoring' : pathname;
  return <ArchiveSessionProvider><div className="grad-shell">
    <a href="#main-content" className="grad-skip">본문으로 이동</a>
    <header className="grad-header">
      <Link href="/" className="grad-brand" aria-label="GRAD EXHIBIT 홈">GRAD EXHIBIT</Link>
      <div className="about-header-actions"><Link href="/exhibitions?search=1" className="grad-icon" title="전시회 검색" aria-label="전시회 검색"><Search size={21}/></Link><Link href="/projects" className="grad-icon" title="프로젝트" aria-label="프로젝트"><Layers3 size={21}/></Link><Link href="/my" className="grad-icon" title="내정보" aria-label="내정보"><UserRound size={21}/></Link></div>
    </header>
    <div id="main-content" tabIndex={-1}>{children}</div>
    <footer className="grad-footer"><Link href="/" className="grad-wordmark">GRAD EXHIBIT.</Link><span>졸업의 순간, 그다음의 가능성.</span><Link href="/exhibitions">전시 아카이브 <ArrowUpRight size={15}/></Link><Link href="/mentoring">현직자 멘토링 <ArrowUpRight size={15}/></Link></footer>
    <GuestBar/><nav className="grad-bottom-nav" aria-label="하단 메뉴">{items.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={active===href || (href!=='/' && active.startsWith(href)) ? 'page' : undefined}><Icon size={22}/><span>{label}</span></Link>)}</nav>
  </div></ArchiveSessionProvider>;
}
function GuestBar(){const {user,ready}=useArchiveSession();const path=usePathname();return ready&&!user&&path==='/'?<div className="about-guest-bar"><div><strong>게스트로 둘러보는 중</strong><span>관심 있는 전시와 프로젝트를 저장해 보세요.</span></div><Link href="/my">시작하기</Link></div>:null;}
