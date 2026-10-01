import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const oppsPath = path.resolve(process.cwd(), "data", "published", "opportunities.json");
    const equipPath = path.resolve(process.cwd(), "data", "published", "equipment.json");
    
    const opportunities = fs.existsSync(oppsPath) ? JSON.parse(fs.readFileSync(oppsPath, "utf-8")) : [];
    const equipment = fs.existsSync(equipPath) ? JSON.parse(fs.readFileSync(equipPath, "utf-8")) : [];
    
    return NextResponse.json({
      opportunities,
      equipment,
      count: opportunities.length + equipment.length
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load opportunities" }, { status: 500 });
  }
}