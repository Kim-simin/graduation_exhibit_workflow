import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const currPath = path.resolve(process.cwd(), "data", "published", "curriculums.json");
    const masterPath = path.resolve(process.cwd(), "data", "published", "leading_departments_master.json");
    
    const curriculums = fs.existsSync(currPath)
      ? JSON.parse(fs.readFileSync(currPath, "utf-8"))
      : [];
    const masterCategories = fs.existsSync(masterPath)
      ? JSON.parse(fs.readFileSync(masterPath, "utf-8"))
      : [];
      
    return NextResponse.json({
      status: "SUCCESS",
      curriculums,
      master_categories: masterCategories,
    });
  } catch (error) {
    return NextResponse.json({ status: "ERROR", message: "Failed to load curriculums" }, { status: 500 });
  }
}