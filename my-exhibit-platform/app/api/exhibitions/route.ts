import { NextResponse } from "next/server";
import { getInitialExhibitions } from "@/lib/get-exhibitions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const exhibitions = getInitialExhibitions();
    return NextResponse.json({ exhibitions });
  } catch (error: any) {
    console.error("[API /api/exhibitions Error]:", error);
    return NextResponse.json({ exhibitions: [], error: error.message }, { status: 500 });
  }
}
