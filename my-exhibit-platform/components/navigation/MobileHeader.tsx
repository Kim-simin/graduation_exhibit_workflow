"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";

const links = [
  { href: "/", label: "졸업전시" },
  { href: "/students", label: "인재풀" },
  { href: "/rfp", label: "기업과제" },
  { href: "/mentoring", label: "멘토링" },
  { href: "/professors", label: "학과 커리큘럼" },
  { href: "/jobs", label: "채용공고" },
  { href: "/brand-assets", label: "기업 브랜드 IP" },
  { href: "/rfp/submit", label: "과제 제안서 제출" },
];

export default function MobileHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full min-w-0 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-[#0b0f19] md:hidden">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="min-w-0 text-sm font-extrabold text-slate-900 dark:text-white">
          전국 대학교 졸업전시 아카이브
        </Link>
        <div className="shrink-0"><ThemeToggle /></div>
      </div>
      <nav aria-label="모바일 주요 메뉴" className="mt-3 flex w-full gap-2 overflow-x-auto whitespace-nowrap pb-2">
        {links.map(({ href, label }) => {
          const active = href === "/" ? pathname === href :
            href === "/rfp" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${active
                ? "border-cyan-600 bg-cyan-600 text-white"
                : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
