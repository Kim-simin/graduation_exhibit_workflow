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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") || "WAITING_FOR_APPROVAL";
    const contentTypeParam = searchParams.get("content_type") || "ALL";
    const channelParam = searchParams.get("channel") || "ALL";
    const dateParam = searchParams.get("date") || "ALL";
    const versionParam = searchParams.get("version") || "ALL";
    const sourceStatusParam = searchParams.get("source_status") || "ALL";
    const runIdParam = searchParams.get("run_id") || "ALL";
    const scheduleIdParam = searchParams.get("schedule_id") || "ALL";
    const sortByParam = searchParams.get("sort_by") || "newest";

    // 1. Load Single Source of Truth DB (Zero LLM)
    const genDb = getFirstExisting("data/generated_contents.json") || { contents: [] };
    const pipelineRuns = getFirstExisting("data/logs/pipeline_runs.json") || [];
    const runtimeState = getFirstExisting("data/runtime_pipeline.json");

    let allContents: any[] = Array.isArray(genDb.contents) ? [...genDb.contents] : [];

    // Also include any in-flight content from runtimeState if not yet persisted in genDb
    if (
      runtimeState &&
      (runtimeState.status === "WAITING_FOR_APPROVAL" || runtimeState.approval_status === "WAITING_FOR_APPROVAL")
    ) {
      const approvalNode = runtimeState.nodes?.find((n: any) => n.id === "node-approval-gate");
      const contentGenNode = runtimeState.nodes?.find((n: any) => n.id === "node-content-gen");
      const inFlightItem = approvalNode?.target_content || contentGenNode?.content_item;
      if (inFlightItem && inFlightItem.content_id) {
        const exists = allContents.some((c: any) => c.content_id === inFlightItem.content_id);
        if (!exists) {
          allContents.unshift({
            ...inFlightItem,
            status: "WAITING_FOR_APPROVAL",
            approval_status: "WAITING_FOR_APPROVAL",
            run_id: runtimeState.run_id,
            version: inFlightItem.version || 1,
            created_at: inFlightItem.created_at || runtimeState.started_at,
          });
        }
      }
    }

    // Build version history mapping (grouped by project_id or base title)
    const projectVersionMap = new Map<string, any[]>();
    for (const item of allContents) {
      const key = item.project_id || item.title || item.content_id;
      if (!projectVersionMap.has(key)) {
        projectVersionMap.set(key, []);
      }
      projectVersionMap.get(key)!.push(item);
    }

    // Format Queue Items
    let formattedItems = allContents.map((item: any, index: number) => {
      const key = item.project_id || item.title || item.content_id;
      const relatedVersions = projectVersionMap.get(key) || [item];
      const versionHistory = relatedVersions.map((v: any) => ({
        version: v.version || 1,
        status: v.status || v.approval_status || "UNKNOWN",
        content_id: v.content_id,
        rejection_reason: v.rejection_reason || null,
        approved_at: v.approved_at || null,
        rejected_at: v.rejected_at || null,
      })).sort((a, b) => b.version - a.version);

      const sources = item.source_traceability || [];
      const totalSources = sources.length;
      const verifiedSources = sources.filter((s: any) => s.source_url && s.source_url.startsWith("http")).length;

      // Match linked pipeline run
      let linkedRun = null;
      if (Array.isArray(pipelineRuns)) {
        linkedRun = pipelineRuns.find(
          (r: any) => r.run_id === item.run_id || (r.records && r.records.includes(item.content_id))
        );
      }

      return {
        queue_id: `q-${item.content_id}`,
        content_id: item.content_id,
        case_no: `Case #${String(index + 1).padStart(3, "0")}`,
        title: item.title || "미지정 졸업전시 콘텐츠",
        content_type: (item.content_type || "reels").toLowerCase(),
        channel: (item.platform || "instagram").toUpperCase(),
        version: item.version || 1,
        version_history: versionHistory,
        status: item.status || item.approval_status || "WAITING_FOR_APPROVAL",
        approval_status: item.approval_status || item.status || "WAITING_FOR_APPROVAL",
        qa_score: item.qa_result?.score ?? 1.0,
        source_summary: {
          total: totalSources,
          verified: verifiedSources,
          status: totalSources > 0 && verifiedSources === totalSources ? "VERIFIED" : "PARTIAL",
        },
        sources: sources.map((s: any) => ({
          claim: s.claim,
          source_url: s.source_url,
          publisher: s.publisher,
        })),
        run_id: item.run_id || linkedRun?.run_id || runtimeState?.run_id || null,
        schedule_id: linkedRun?.schedule_id || null,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || item.created_at || new Date().toISOString(),
        hook: item.hook || "",
        body_preview: item.body ? item.body.slice(0, 180) + "..." : "",
        caption: item.caption || "",
        hashtags: item.hashtags || [],
        rejection_reason: item.rejection_reason || null,
        approved_by: item.approved_by || null,
        approved_at: item.approved_at || null,
        rejected_by: item.rejected_by || null,
        rejected_at: item.rejected_at || null,
      };
    });

    const waitingTotal = formattedItems.filter(
      (item) => item.status === "WAITING_FOR_APPROVAL" || item.approval_status === "WAITING_FOR_APPROVAL"
    ).length;

    // 2. Apply Filters (Section 4: DB/API Level, Zero LLM)
    if (statusParam !== "ALL") {
      formattedItems = formattedItems.filter((item) => {
        if (statusParam === "WAITING_FOR_APPROVAL") {
          return item.status === "WAITING_FOR_APPROVAL" || item.approval_status === "WAITING_FOR_APPROVAL";
        }
        return item.status === statusParam || item.approval_status === statusParam;
      });
    }

    if (contentTypeParam !== "ALL") {
      formattedItems = formattedItems.filter(
        (item) => item.content_type.toLowerCase() === contentTypeParam.toLowerCase()
      );
    }

    if (channelParam !== "ALL") {
      formattedItems = formattedItems.filter(
        (item) => item.channel.toUpperCase() === channelParam.toUpperCase()
      );
    }

    if (versionParam !== "ALL") {
      const vNum = Number(versionParam);
      if (!isNaN(vNum)) {
        formattedItems = formattedItems.filter((item) => item.version === vNum);
      }
    }

    if (sourceStatusParam !== "ALL") {
      formattedItems = formattedItems.filter(
        (item) => item.source_summary.status === sourceStatusParam
      );
    }

    if (runIdParam !== "ALL") {
      formattedItems = formattedItems.filter((item) => item.run_id === runIdParam);
    }

    if (scheduleIdParam !== "ALL") {
      formattedItems = formattedItems.filter((item) => item.schedule_id === scheduleIdParam);
    }

    if (dateParam !== "ALL") {
      const now = new Date();
      if (dateParam === "today") {
        const todayStr = now.toISOString().slice(0, 10);
        formattedItems = formattedItems.filter((item) => item.created_at.startsWith(todayStr));
      } else if (dateParam === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        formattedItems = formattedItems.filter((item) => new Date(item.created_at) >= weekAgo);
      }
    }

    // 3. Apply Sorting (Section 5: Deterministic, Zero LLM)
    formattedItems.sort((a, b) => {
      if (sortByParam === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortByParam === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortByParam === "type") {
        return a.content_type.localeCompare(b.content_type);
      } else if (sortByParam === "channel") {
        return a.channel.localeCompare(b.channel);
      }
      return 0;
    });

    return NextResponse.json({
      status: "SUCCESS",
      timestamp: new Date().toISOString(),
      total_count: formattedItems.length,
      waiting_count: waitingTotal,
      filters_applied: {
        status: statusParam,
        content_type: contentTypeParam,
        channel: channelParam,
        date: dateParam,
        version: versionParam,
        source_status: sourceStatusParam,
        sort_by: sortByParam,
      },
      items: formattedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
