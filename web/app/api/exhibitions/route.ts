import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data", "published", "exhibitions.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ exhibitions: [] });
    }
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return NextResponse.json({ exhibitions: data });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load exhibitions" }, { status: 500 });
  }
}