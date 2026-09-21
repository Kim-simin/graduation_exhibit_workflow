import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getRootAndPlatformPaths(relativePath: string) {
  const rootDir = path.resolve(process.cwd(), "..");
  const cwdDir = process.cwd();
  return [
    path.join(rootDir, relativePath),
    path.join(cwdDir, relativePath),
  ];
}

function readJsonFile(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function getFirstExisting(relativePath: string) {
  for (const p of getRootAndPlatformPaths(relativePath)) {
    const data = readJsonFile(p);
    if (data) return data;
  }
  return null;
}

export async function GET() {
  try {
    // 1. Load Single Source of Truth DB files (Zero LLM)
    const pipelineRuns = getFirstExisting("data/logs/pipeline_runs.json") || [];
    const genDb = getFirstExisting("data/generated_contents.json") || { contents: [] };
    const schedules = getFirstExisting("data/schedules.json") || [];
    const runtimeState = getFirstExisting("data/runtime_pipeline.json");

    const runsArray = Array.isArray(pipelineRuns) ? pipelineRuns : [];
    const contentsArray = Array.isArray(genDb.contents) ? genDb.contents : [];
    const schedulesArray = Array.isArray(schedules) ? schedules : [];

    // 2. Aggregate Operations Stats (Section 7: Exact DB/Run Calculations)
    const activeRuns = runsArray.filter((r: any) => r.status === "RUNNING");
    const failedRuns = runsArray.filter((r: any) => r.status === "FAILED");
    
    // Waiting for approval: count contents currently in WAITING_FOR_APPROVAL
    const waitingContents = contentsArray.filter(
      (c: any) => c.status === "WAITING_FOR_APPROVAL" || c.approval_status === "WAITING_FOR_APPROVAL"
    );
    const waitingRuns = runsArray.filter(
      (r: any) => r.status === "WAITING_FOR_APPROVAL" || r.approval_status === "WAITING_FOR_APPROVAL"
    );

    const enabledSchedules = schedulesArray.filter((s: any) => s.enabled === true);

    // 3. Scheduler Status Summary (Section 11: Transparent Execution Mode)
    let lastRunTime: string | null = null;
    let nextUpcomingRunTime: string | null = null;
    
    for (const s of schedulesArray) {
      if (s.lastRunAt && (!lastRunTime || s.lastRunAt > lastRunTime)) {
        lastRunTime = s.lastRunAt;
      }
      if (s.enabled && s.nextRunAt) {
        if (!nextUpcomingRunTime || s.nextRunAt < nextUpcomingRunTime) {
          nextUpcomingRunTime = s.nextRunAt;
        }
      }
    }

    const schedulerSummary = {
      status: enabledSchedules.length > 0 ? "ENABLED" : "PAUSED",
      execution_mode: "Manual / External Tick", // Transparently stating current environment limit
      enabled_count: enabledSchedules.length,
      total_count: schedulesArray.length,
      last_run_at: lastRunTime,
      next_run_at: nextUpcomingRunTime,
    };

    // 4. Source Summary (Section 12: Preserving Provenance Metrics)
    let totalSources = 0;
    let verifiedSources = 0;
    let unverifiedSources = 0;

    // Check runtimeState nodes or contents
    if (runtimeState?.nodes && Array.isArray(runtimeState.nodes)) {
      const researchNode = runtimeState.nodes.find((n: any) => n.id === "node-research");
      if (researchNode?.information_sources && Array.isArray(researchNode.information_sources)) {
        totalSources = researchNode.information_sources.length;
        verifiedSources = researchNode.information_sources.filter(
          (s: any) => s.verification_status === "VERIFIED" || s.url_status === "URL_VERIFIED"
        ).length;
        unverifiedSources = totalSources - verifiedSources;
      }
    }

    // Fallback: aggregate from contents source_traceability
    if (totalSources === 0) {
      let uniqueUrls = new Set<string>();
      for (const c of contentsArray) {
        if (c.source_traceability && Array.isArray(c.source_traceability)) {
          for (const t of c.source_traceability) {
            if (t.source_url) uniqueUrls.add(t.source_url);
          }
        }
      }
      totalSources = uniqueUrls.size;
      verifiedSources = uniqueUrls.size; // content traceability is verified
      unverifiedSources = 0;
    }

    const sourceSummary = {
      total_sources: totalSources,
      verified_sources: verifiedSources,
      unverified_sources: unverifiedSources,
      verification_rate: totalSources > 0 ? Math.round((verifiedSources / totalSources) * 100) : 100,
      last_research_at: runtimeState?.started_at || null,
    };

    // 5. Active Runs Detail (Section 8: LangGraph State directly, 0 LLM)
    const activeRunsDetail = activeRuns.map((r: any) => {
      const started = r.started_at ? new Date(r.started_at).getTime() : Date.now();
      const durationSec = Math.max(0, Math.floor((Date.now() - started) / 1000));
      return {
        run_id: r.run_id,
        pipeline: r.pipeline_name || "Graduation Exhibit Intelligence Pipeline",
        current_node: r.current_node || "Research",
        status: r.status,
        started_at: r.started_at,
        duration: `${durationSec}s`,
        trigger: r.trigger || "Manual",
        schedule_id: r.schedule_id || null,
      };
    });

    // 6. Failed Runs Detail (Section 9: Error & metadata directly, 0 LLM)
    const failedRunsDetail = failedRuns.map((r: any) => ({
      run_id: r.run_id,
      pipeline: r.pipeline_name || "Graduation Exhibit Intelligence Pipeline",
      failed_node: r.failed_node || r.current_node || "Unknown Node",
      error: r.error || "Execution terminated unexpectedly",
      started_at: r.started_at,
      failed_at: r.completed_at || r.failed_at || r.started_at,
      retry_count: r.retry_count || 0,
      trigger: r.trigger || "Manual",
      schedule_id: r.schedule_id || null,
    }));

    return NextResponse.json({
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      counts: {
        active_runs: activeRuns.length,
        waiting_approval: waitingContents.length || waitingRuns.length,
        failed_runs: failedRuns.length,
        scheduled: enabledSchedules.length,
        total_runs: runsArray.length,
        total_contents: contentsArray.length,
      },
      scheduler: schedulerSummary,
      source_summary: sourceSummary,
      active_runs: activeRunsDetail,
      failed_runs: failedRunsDetail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
