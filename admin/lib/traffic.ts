import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type TrafficEvent = { at: number; path: string };
const directory = () => path.join(process.cwd(), ".traffic");
export function validTrafficPath(value: unknown): value is string {
  return typeof value === "string" && value.length <= 300 && /^\/[a-zA-Z0-9/_%.-]*$/.test(value)
    && !/^\/(admin|api)(\/|$)/.test(value) && !value.startsWith("//");
}
export async function recordTraffic(page: string) {
  const at = Date.now();
  const dir = path.join(directory(), new Date(at).toISOString().slice(0, 10));
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, randomUUID());
  await fs.writeFile(file + ".tmp", JSON.stringify({ at, path: page }), { flag: "wx" });
  await fs.rename(file + ".tmp", file + ".json");
}
export function aggregateTraffic(events: TrafficEvent[], days: number, now = Date.now()) {
  const start = now - days * 86400000;
  const count = days === 1 ? 24 : days;
  const step = (now - start) / count;
  const buckets = Array.from({ length: count }, (_, i) => ({ at: start + i * step, views: 0 }));
  const pages = new Map<string, number>();
  let views = 0;
  for (const event of events) {
    if (event.at < start || event.at > now) continue;
    views++;
    buckets[Math.min(count - 1, Math.floor((event.at - start) / step))].views++;
    pages.set(event.path, (pages.get(event.path) || 0) + 1);
  }
  return { days, start, end: now, views, buckets, pages: Array.from(pages).map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 5) };
}
export async function readTraffic(days: number) {
  const now = Date.now();
  const events: TrafficEvent[] = [];
  for (let i = 0; i <= days; i++) {
    const dir = path.join(directory(), new Date(now - i * 86400000).toISOString().slice(0, 10));
    let files: string[];
    try { files = await fs.readdir(dir); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
    for (const file of files.filter(name => name.endsWith(".json"))) {
      const event = JSON.parse(await fs.readFile(path.join(dir, file), "utf8")) as TrafficEvent;
      if (!Number.isFinite(event.at) || !validTrafficPath(event.path)) throw new Error("Invalid traffic record");
      events.push(event);
    }
  }
  return aggregateTraffic(events, days, now);
}
