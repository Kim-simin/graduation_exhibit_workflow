import { NextResponse } from "next/server";
import { getCurriculums } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const curriculums = getCurriculums();
    return NextResponse.json({ status: "SUCCESS", curriculums });
  } catch (error: any) {
    console.error("[API /api/curriculums Error]:", error);
    return NextResponse.json({ status: "ERROR", error: error.message }, { status: 500 });
  }
}
