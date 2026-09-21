import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Access denied in production" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const filterLicense = searchParams.get("license_status");
    const filterTopic = searchParams.get("topic_id");

    const rootDir = path.resolve(process.cwd(), "..");
    const dbPath = path.join(rootDir, "data", "content_research.json");
    const logPath = path.join(rootDir, "data", "logs", "content_research_runs.json");

    let dbData: any = { topics: [], sources: [], assets: [] };
    if (fs.existsSync(dbPath)) {
      try {
        dbData = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {}
    }

    let runsLog: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        runsLog = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      } catch (e) {}
    }

    let filteredAssets = dbData.assets || [];
    if (filterLicense && filterLicense !== "ALL") {
      filteredAssets = filteredAssets.filter(
        (a: any) => a.license_status === filterLicense
      );
    }
    if (filterTopic && filterTopic !== "ALL") {
      filteredAssets = filteredAssets.filter(
        (a: any) => a.topic_id === filterTopic
      );
    }

    const verifiedCount = (dbData.assets || []).filter(
      (a: any) => a.license_status === "VERIFIED"
    ).length;
    const reviewNeededCount = (dbData.assets || []).filter(
      (a: any) => a.license_status === "REVIEW_NEEDED"
    ).length;
    const downloadedCount = (dbData.assets || []).filter(
      (a: any) => Boolean(a.storage_path)
    ).length;

    return NextResponse.json({
      status: "SUCCESS",
      statistics: {
        total_topics: (dbData.topics || []).length,
        total_sources: (dbData.sources || []).length,
        total_assets: (dbData.assets || []).length,
        verified_assets: verifiedCount,
        review_needed_assets: reviewNeededCount,
        downloaded_assets: downloadedCount,
        last_updated: dbData.last_updated || null,
      },
      topics: dbData.topics || [],
      sources: dbData.sources || [],
      assets: filteredAssets,
      recent_runs: runsLog.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { status: "FAILED", error: "배포 환경(Production)에서는 콘텐츠 리서치 러너가 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { mode = "mock", keywords = [] } = body;

    const rootDir = path.resolve(process.cwd(), "..");
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    const args = ["-3.11", "-m", "content_graph.runner", "--mode", mode];
    if (keywords.length > 0) {
      args.push("--keywords", ...keywords);
    }

    console.log(`[API /api/content-research] Running content research (mode: ${mode})`);

    return new Promise<NextResponse>((resolve) => {
      let stdoutData = "";
      let stderrData = "";

      const proc = spawn(pythonExe, args, { cwd: rootDir });

      proc.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });

      proc.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });

      proc.on("close", (code) => {
        console.log(`[API /api/content-research] Process exited with code ${code}`);
        if (code === 0) {
          const dbPath = path.join(rootDir, "data", "content_research.json");
          let latestDb: any = { topics: [], sources: [], assets: [] };
          if (fs.existsSync(dbPath)) {
            try {
              latestDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
            } catch (e) {}
          }

          resolve(
            NextResponse.json({
              status: "SUCCESS",
              exitCode: code,
              output: stdoutData,
              statistics: {
                total_topics: (latestDb.topics || []).length,
                total_sources: (latestDb.sources || []).length,
                total_assets: (latestDb.assets || []).length,
              },
            })
          );
        } else {
          resolve(
            NextResponse.json(
              {
                status: "FAILED",
                exitCode: code,
                error: stderrData || stdoutData,
              },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
