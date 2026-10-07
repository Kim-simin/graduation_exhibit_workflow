"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TrafficTracker() {
  const pathname = usePathname();
  const last = useRef<string>();
  useEffect(() => {
    if (!pathname || /^\/(admin|api)(\/|$)/.test(pathname) || last.current === pathname) return;
    last.current = pathname;
    void fetch("/api/traffic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathname }), keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
