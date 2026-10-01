import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ROOT_DIR = path.resolve(process.cwd(), "..");
const TASKS_DIR = path.join(ROOT_DIR, "temp", "insta_tasks");

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    // 보안 검증 (디렉토리 탈출 방지)
    const cleanJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, "");
    const statusFilePath = path.join(TASKS_DIR, `${cleanJobId}_status.json`);

    if (!fs.existsSync(statusFilePath)) {
      return NextResponse.json(
        {
          success: true,
          status: "queued",
          step: 0,
          totalSteps: 5,
          progress: 5,
          message: "워커 초기화 대기 중...",
        }
      );
    }

    const raw = fs.readFileSync(statusFilePath, "utf-8");
    const data = JSON.parse(raw);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error("[Instagram Status API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "상태 조회 중 오류 발생" },
      { status: 500 }
    );
  }
}
