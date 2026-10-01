import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function readJsonFile(filePath: string): any {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedRunId = searchParams.get("run_id");

    const rootDir = path.resolve(process.cwd(), "..");
    const cwdPath = process.cwd();

    const pathsToFind = (subPath: string) => [
      path.join(rootDir, subPath),
      path.join(cwdPath, subPath),
    ];

    const getFirstExisting = (subPath: string) => {
      for (const p of pathsToFind(subPath)) {
        const data = readJsonFile(p);
        if (data) return data;
      }
      return null;
    };

    // 1. Read Pipeline History & Active State (Single Source of Truth)
    const pipelineRuns = getFirstExisting("data/logs/pipeline_runs.json") || [];
    let runtimeState = getFirstExisting("data/runtime_pipeline.json");

    // If a specific run_id was requested, find it from pipeline_runs
    if (requestedRunId && Array.isArray(pipelineRuns)) {
      const matched = pipelineRuns.find((r: any) => r.run_id === requestedRunId);
      if (matched) {
        runtimeState = matched;
      }
    }

    // Prepare Runs List from actual history
    const runsList = Array.isArray(pipelineRuns)
      ? pipelineRuns.map((r: any) => ({
          run_id: r.run_id,
          pipeline: r.pipeline_name || "Graduation Exhibit Intelligence Pipeline",
          status: r.status,
          current_node: r.current_node,
          started_at: r.started_at,
          completed_at: r.completed_at,
          records: r.records,
          platform: r.platform || "N/A",
          content_type: r.content_type || "N/A",
          error: r.error,
        }))
      : [];

    // Empty state handling: If status is NO_ACTIVE_RUN or no run_id exists
    if (!runtimeState || runtimeState.status === "NO_ACTIVE_RUN" || !runtimeState.run_id) {
      return NextResponse.json({
        status: "NO_ACTIVE_RUN",
        timestamp: new Date().toISOString(),
        workflow: [],
        current_run: null,
        runs: runsList,
        logs: [],
        agents: [],
        metrics: null,
      });
    }

    // 2. Build live response from the single active state
    const nodes = runtimeState.nodes || [];
    const events = runtimeState.events || [];

    // Fleet Agent Status derived strictly from node executions
    const agents = [
      {
        id: "agent-research",
        name: "Research Intelligence Agent",
        node: "Research",
        status: nodes[0]?.status || "Idle",
        last_active: nodes[0]?.last_run_time || "-",
        throughput: nodes[0]?.throughput || nodes[0]?.records_count || "0",
        health: nodes[0]?.error && nodes[0]?.error !== "None" ? "Degraded" : "Healthy",
      },
      {
        id: "agent-validate",
        name: "Fact Validation Agent",
        node: "Validate",
        status: nodes[1]?.status || "Idle",
        last_active: nodes[1]?.last_run_time || "-",
        throughput: nodes[1]?.records_count || "0",
        health: nodes[1]?.error && nodes[1]?.error !== "None" ? "Degraded" : "Healthy",
      },
      {
        id: "agent-normalize",
        name: "Taxonomy & Schema Normalizer",
        node: "Normalize",
        status: nodes[2]?.status || "Idle",
        last_active: nodes[2]?.last_run_time || "-",
        throughput: nodes[2]?.records_count || "0",
        health: nodes[2]?.error && nodes[2]?.error !== "None" ? "Degraded" : "Healthy",
      },
      {
        id: "agent-sync",
        name: "Atomic DB Sync Agent",
        node: "Update DB",
        status: nodes[3]?.status || "Idle",
        last_active: nodes[3]?.last_run_time || "-",
        throughput: nodes[3]?.records_count || "0",
        health: nodes[3]?.error && nodes[3]?.error !== "None" ? "Degraded" : "Healthy",
      },
      {
        id: "agent-content",
        name: "STEP 8 Content Generator",
        node: "Content Generation",
        status: nodes[4]?.status || "Idle",
        last_active: nodes[4]?.last_run_time || "-",
        throughput: nodes[4]?.records_count || "0",
        health: nodes[4]?.error && nodes[4]?.error !== "None" ? "Degraded" : "Healthy",
      },
      {
        id: "agent-approval",
        name: "Human Approval Gate",
        node: "Human Approval",
        status: nodes[5]?.status || "Idle",
        last_active: nodes[5]?.last_run_time || "-",
        throughput: nodes[5]?.records_count || "0",
        health: nodes[5]?.error && nodes[5]?.error !== "None" ? "Degraded" : "Healthy",
      },
    ];

    const currentRun = {
      run_id: runtimeState.run_id,
      pipeline: runtimeState.pipeline_name || "Graduation Exhibit Intelligence Pipeline",
      status: runtimeState.status,
      current_node: runtimeState.current_node,
      approval_status: runtimeState.approval_status || nodes[5]?.approval_status || "NOT_REQUIRED",
      approval_required: runtimeState.approval_required ?? Boolean(nodes[5]),
      started_at: runtimeState.started_at,
      completed_at: runtimeState.completed_at,
      elapsed_time: runtimeState.elapsed_time || "-",
      records: runtimeState.records || "No Run Data",
      platform: runtimeState.platform || "N/A",
      content_type: runtimeState.content_type || "N/A",
      error: runtimeState.error,
      checkpoint: runtimeState.checkpoint,
    };

    return NextResponse.json({
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      workflow: nodes,
      current_run: currentRun,
      runs: runsList.slice(0, 15),
      logs: events.slice().reverse().slice(0, 25),
      agents,
      metrics: {
        total_runs: runsList.length,
        active_status: runtimeState.status,
        current_node: runtimeState.current_node,
        records_summary: runtimeState.records,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
