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
    const published = Array.isArray(data)
      ? data.filter(
          (item) =>
            (item.status === "published" || item.status === "완료" || item.status === "리서치 완료") &&
            item.isResearched === true &&
            Boolean(item.posterPath && item.posterPath.length > 5)
        )
      : [];
    return NextResponse.json({ exhibitions: published });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load exhibitions" }, { status: 500 });
  }
}