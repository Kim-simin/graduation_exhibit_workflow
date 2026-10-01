import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data", "published", "recruitment_intelligence.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }
    const fallbackPath = path.resolve(process.cwd(), "data", "published", "jobs.json");
    if (fs.existsSync(fallbackPath)) {
      const data = JSON.parse(fs.readFileSync(fallbackPath, "utf-8"));
      return NextResponse.json(data);
    }
    return NextResponse.json({ verified_postings: [] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}