import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const oppsPath = path.resolve(process.cwd(), "data", "published", "opportunities.json");
    const equipPath = path.resolve(process.cwd(), "data", "published", "equipment.json");
    
    const opportunities = fs.existsSync(oppsPath) ? JSON.parse(fs.readFileSync(oppsPath, "utf-8")) : [];
    const equipment = fs.existsSync(equipPath) ? JSON.parse(fs.readFileSync(equipPath, "utf-8")) : [];
    
    const found = [...opportunities, ...equipment].find((item: any) => item.id === params.id);
    if (found) {
      return NextResponse.json(found);
    }
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load opportunity" }, { status: 500 });
  }
}