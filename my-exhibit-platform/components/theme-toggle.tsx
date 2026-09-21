"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved === "light") {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("theme", nextTheme);
    } catch (e) {}
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-slate-800/80 dark:border-slate-200 bg-black dark:bg-white" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center p-2 rounded-xl bg-black hover:bg-slate-900 text-white border border-slate-800/80 hover:border-slate-600 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 dark:border-slate-200 shadow-sm transition"
      title={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
      aria-label="테마 전환"
    >
      {theme === "light" ? (
        <Moon className="w-4 h-4 text-slate-300 hover:text-cyan-400 transition" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500 hover:text-amber-600 transition" />
      )}
    </button>
  );
}
