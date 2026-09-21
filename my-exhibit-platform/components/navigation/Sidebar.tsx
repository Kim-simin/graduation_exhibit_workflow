"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Users,
  GraduationCap,
  Briefcase,
  Sparkles,
  Layers,
  Shield,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      label: "졸업전시 아카이브",
      href: "/",
      badge: null,
      iconEmoji: "🌐",
    },
    {
      label: "대학생",
      href: "/students",
      badge: {
        text: "인재풀",
        bg: "bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 dark:bg-indigo-100 dark:text-indigo-700 dark:border-indigo-300",
      },
      iconEmoji: "👥",
    },
    {
      label: "학과 커리큘럼 (교수)",
      href: "/professors",
      badge: null,
      iconEmoji: "🎓",
    },
    {
      label: "채용공고 및 스카우팅",
      href: "/jobs",
      badge: {
        text: "채용 연계",
        bg: "bg-blue-950/80 text-blue-300 border border-blue-700/50 dark:bg-blue-100 dark:text-blue-700 dark:border-blue-300",
      },
      iconEmoji: "💼",
    },
    {
      label: "기업 브랜드 IP",
      href: "/brand-assets",
      badge: {
        text: "IP 프리패스",
        bg: "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 dark:bg-emerald-100 dark:text-emerald-700 dark:border-emerald-300",
      },
      iconEmoji: "🏷️",
    },
    {
      label: "현직자 멘토링",
      href: "/mentoring",
      badge: {
        text: "1:1 첨삭",
        bg: "bg-sky-950/80 text-sky-300 border border-sky-700/50 dark:bg-sky-100 dark:text-sky-700 dark:border-sky-300",
      },
      iconEmoji: "✨",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex w-56 shrink-0 bg-transparent min-h-screen sticky top-0 h-screen flex-col justify-between p-4 z-40 select-none overflow-y-auto no-scrollbar">
      {/* 상단 브랜드 로고 및 세로 메뉴 그룹 */}
      <div className="flex flex-col">
        <Link
          href="/"
          className="flex items-center gap-2.5 pb-5 text-decoration-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 font-black text-xs text-slate-900 dark:text-white tracking-tight leading-none">
              <span>GRAD EXHIBIT</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-extrabold leading-none">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1 truncate">
              전국 대학교 졸전 아카이브
            </span>
          </div>
        </Link>

        {/* 산업군 필터 칩 룩앤필(Pill Button) 세로 메뉴 리스트 */}
        <nav className="py-1 space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all ${
                  active
                    ? "bg-[#008da5] hover:bg-[#007b91] text-white font-bold shadow-md border border-[#008da5]"
                    : "bg-black hover:bg-slate-900 text-white border border-slate-800/80 hover:border-slate-600 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 dark:border-slate-200 shadow-sm font-semibold"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">{item.iconEmoji}</span>
                  <span className="truncate text-xs">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      active
                        ? "bg-white/20 text-white border border-white/30"
                        : item.badge.bg
                    }`}
                  >
                    {item.badge.text}
                  </span>
                )}
              </Link>
            );
          })}

          {/* [ 💼 과제 제안서 제출 ] CTA 버튼 (둥근 모서리 rounded-2xl) */}
          <Link
            href="/rfp/submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-3 rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 mt-3 text-xs transition-all whitespace-nowrap"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>과제 제안서 제출</span>
          </Link>
        </nav>
      </div>

      {/* 사이드바 하단 푸터 / 유틸리티 */}
      <div className={`pt-3 flex items-center gap-1.5 ${process.env.NODE_ENV !== "production" ? "justify-between" : "justify-end"}`}>
        {process.env.NODE_ENV !== "production" && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black hover:bg-slate-900 text-white border border-slate-800/80 hover:border-slate-600 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 dark:border-slate-200 text-[11px] font-medium shadow-sm transition"
          >
            <Shield className="w-3 h-3" />
            <span>관제 시스템</span>
          </Link>
        )}
        <ThemeToggle />
      </div>
    </aside>
  );
}
