import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

/**
 * GET /api/admin/research
 * Returns recent research runs, raw evidence snapshot metadata, and validation statistics.
 * ZERO LLM calls - pure JSON DB and file inspection.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Access denied in production" }, { status: 403 });
  }
  try {
    const rootDir = path.resolve(process.cwd(), "..");
    const logPath = path.join(rootDir, "data", "logs", "research_runs.json");
    const corpLogPath = path.join(rootDir, "data", "logs", "corporate_research_runs.json");
    const latestCorpFile = path.join(rootDir, "data", "research", "intelligence", "latest_corporate_research.json");
    const metaDir = path.join(rootDir, "data", "research", "raw", "metadata");

    let runs: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        runs = JSON.parse(fs.readFileSync(logPath, "utf-8"));
      } catch (_) {
        runs = [];
      }
    }

    let corpRuns: any[] = [];
    if (fs.existsSync(corpLogPath)) {
      try {
        corpRuns = JSON.parse(fs.readFileSync(corpLogPath, "utf-8"));
      } catch (_) {
        corpRuns = [];
      }
    }

    let latestCorporateIntel: any = null;
    if (fs.existsSync(latestCorpFile)) {
      try {
        latestCorporateIntel = JSON.parse(fs.readFileSync(latestCorpFile, "utf-8"));
      } catch (_) {
        latestCorporateIntel = null;
      }
    }

    let snapshots: any[] = [];
    if (fs.existsSync(metaDir)) {
      try {
        const files = fs.readdirSync(metaDir).filter((f) => f.endsWith(".json"));
        for (const file of files.slice(0, 20)) {
          try {
            const content = JSON.parse(
              fs.readFileSync(path.join(metaDir, file), "utf-8")
            );
            snapshots.push(content);
          } catch (_) {}
        }
      } catch (_) {}
    }

    // Compute aggregation stats
    const totalRuns = runs.length + corpRuns.length;
    const completedRuns = runs.filter((r) => r.status === "COMPLETED").length + corpRuns.filter((r) => r.status === "COMPLETED").length;
    const totalEvidence = runs.reduce((acc, r) => acc + (r.evidence_count || 0), 0) + corpRuns.reduce((acc, r) => acc + (r.evidences_count || 0), 0);
    const totalArtworks = runs.reduce((acc, r) => acc + (r.artworks_count || 0), 0);
    const totalConflicts = runs.reduce((acc, r) => acc + (r.conflicts_count || 0), 0);

    return NextResponse.json({
      status: "SUCCESS",
      statistics: {
        total_runs: totalRuns,
        completed_runs: completedRuns,
        total_evidence_collected: totalEvidence,
        total_artworks_resolved: totalArtworks,
        total_conflicts_detected: totalConflicts,
        total_snapshots_preserved: snapshots.length,
        total_corporate_runs: corpRuns.length,
      },
      recent_runs: runs.slice(0, 10),
      corporate_runs: corpRuns.slice(0, 10),
      latest_corporate_intelligence: latestCorporateIntel,
      raw_snapshots: snapshots,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/research
 * Triggers a research run via python runner.
 * Supports:
 * - pipeline_type === "corporate": python -m research.graph.cooperation_recruitment_runner
 * - default: python -m research.graph.runner
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "배포 환경(Production)에서는 AI 리서치 러너 실행이 비활성화됩니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      university = "홍익대학교",
      department = "시각디자인과",
      year = "2025",
      target_url = null,
      pipeline_type = "academic",
    } = body;

    const rootDir = path.resolve(process.cwd(), "..");
    const pythonExe = process.platform === "win32" ? "py" : "python3";

    let args: string[] = [];
    if (pipeline_type === "corporate") {
      args = [
        "-m",
        "research.graph.cooperation_recruitment_runner",
        "--univ",
        university,
        "--dept",
        department,
      ];
      if (target_url) {
        args.push("--url", target_url);
      }
    } else {
      args = [
        "-m",
        "research.graph.runner",
        "--univ",
        university,
        "--dept",
        department,
        "--year",
        year,
      ];
      if (target_url) {
        args.push("--url", target_url);
      }
    }

    return new Promise<NextResponse>((resolve) => {
      const proc = spawn(pythonExe, args, { cwd: rootDir });
      let stdoutData = "";
      let stderrData = "";

      proc.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });
      proc.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(
            NextResponse.json({
              status: "SUCCESS",
              message: `${pipeline_type === "corporate" ? "산학협력-채용 교차검증" : "아카이브"} 리서치 파이프라인 실행 완료`,
              stdout: stdoutData,
            })
          );
        } else {
          resolve(
            NextResponse.json(
              {
                status: "FAILED",
                error: stderrData || stdoutData || `Process exited with code ${code}`,
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
