import { NextRequest, NextResponse } from "next/server";
import { readTraffic, recordTraffic, validTrafficPath } from "@/lib/traffic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function local(request: NextRequest) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(request.nextUrl.hostname);
}
export async function GET(request: NextRequest) {
  if (!local(request)) return new NextResponse(null, { status: 403 });
  const days = Number(request.nextUrl.searchParams.get("days") || 1);
  if (![1, 7, 30].includes(days)) return new NextResponse(null, { status: 400 });
  try { return NextResponse.json(await readTraffic(days), { headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: "방문 기록을 읽지 못했습니다." }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  if (!local(request) || request.headers.get("origin") !== request.nextUrl.origin) return new NextResponse(null, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 1024) return new NextResponse(null, { status: 413 });
  let page: unknown;
  try { page = (await request.json()).path; } catch { return new NextResponse(null, { status: 400 }); }
  if (!validTrafficPath(page)) return new NextResponse(null, { status: 400 });
  try { await recordTraffic(page); return new NextResponse(null, { status: 204 }); }
  catch { return new NextResponse(null, { status: 503 }); }
}
