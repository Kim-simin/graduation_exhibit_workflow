import { NextRequest, NextResponse } from "next/server";
import { getInitialExhibitions } from "@/lib/get-exhibitions";
import fs from "fs";
import path from "path";

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

export async function POST(req: NextRequest) {
  try {
    const item = await req.json();
    const queuePaths = [
      path.resolve(process.cwd(), "data", "university_queue.json"),
      path.resolve(process.cwd(), "..", "data", "university_queue.json"),
      path.resolve("c:\\Users\\graduation_exhibit_workflow\\data\\university_queue.json"),
      path.resolve("c:\\Users\\graduation_exhibit_workflow\\my-exhibit-platform\\data\\university_queue.json"),
    ];

    let updatedCount = 0;
    for (const qp of queuePaths) {
      if (fs.existsSync(qp)) {
        const raw = fs.readFileSync(qp, "utf-8");
        const list = JSON.parse(raw);
        const filtered = list.filter((it: any) => it.id !== item.id);
        const updated = [item, ...filtered];
        fs.writeFileSync(qp, JSON.stringify(updated, null, 2), "utf-8");
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedFiles: updatedCount });
  } catch (error: any) {
    console.error("[API /api/exhibitions POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
