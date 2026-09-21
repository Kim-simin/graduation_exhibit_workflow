"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  GraduationCap,
  Briefcase,
  Sparkles,
  Archive,
  Layers,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function GNB() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "졸업전시 아카이브",
      href: "/",
      icon: Archive,
      badge: null,
    },
    {
      label: "대학생",
      href: "/students",
      icon: Users,
      badge: { text: "인재풀", bg: "bg-[#252843] text-indigo-300" },
    },
    {
      label: "학과 커리큘럼 (교수)",
      href: "/professors",
      icon: GraduationCap,
      badge: null,
    },
    {
      label: "채용공고 및 스카우팅",
      href: "/jobs",
      icon: Briefcase,
      badge: { text: "채용 연계", bg: "bg-blue-950/80 text-blue-300 border border-blue-700/50" },
    },
    {
      label: "현직자 멘토링",
      href: "/mentoring",
      icon: Sparkles,
      badge: { text: "1:1 첨삭", bg: "bg-[#252843] text-indigo-300" },
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#111422] border-b border-slate-800/60 backdrop-blur-md">
      <div className="w-full px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* 좌측 내비게이션 메뉴 그룹 (로고 + 탭 메뉴들 + CTA 버튼) */}
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar py-2">
          {/* 서비스 로고 */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 text-decoration-none">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-extrabold text-sm text-white tracking-tight leading-none">
                <span>GRAD EXHIBIT</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold leading-none">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                전국 대학교 졸업전시 통합 아카이브
              </span>
            </div>
          </Link>

          {/* 좌측 내비게이션 메뉴 그룹 */}
          <nav className="flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#20253d] text-white font-semibold shadow-sm border border-indigo-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-indigo-400" : "text-slate-400"}`} />
                  <span className="shrink-0">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${item.badge.bg}`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 제안서 제출 CTA 버튼 */}
          <Link
            href="/rfp/submit"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5046e5] hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>과제 제안서 제출</span>
          </Link>
        </div>

        {/* 우측 유틸리티 영역 */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {process.env.NODE_ENV !== "production" && (
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition whitespace-nowrap"
            >
              관제 시스템
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
