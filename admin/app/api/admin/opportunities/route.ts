import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getOpportunities, getEquipments } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

function getDualPaths(relPath: string) {
  const rootTarget = path.resolve(process.cwd(), "..", relPath);
  const platformTarget = path.resolve(process.cwd(), relPath);
  return [rootTarget, platformTarget];
}

function writeAtomicJson(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp.${crypto.randomBytes(4).toString("hex")}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (_) {}
  fs.renameSync(tempPath, filePath);
}

function syncDualFiles(relPath: string, data: any) {
  const [rootTarget, platformTarget] = getDualPaths(relPath);
  try {
    writeAtomicJson(rootTarget, data);
  } catch (err) {
    console.error(`Error writing to ${rootTarget}:`, err);
  }
  try {
    writeAtomicJson(platformTarget, data);
  } catch (err) {
    console.error(`Error writing to ${platformTarget}:`, err);
  }
}

export async function GET(req: Request) {
  try {
    const opps = getOpportunities();
    const eqs = getEquipments();

    return NextResponse.json({
      success: true,
      opportunities: opps,
      equipments: eqs,
      stats: {
        totalOpportunities: opps.length,
        totalEquipments: eqs.length,
        openOpportunities: opps.filter((o) => o.status === "OPEN").length,
        closedOpportunities: opps.filter((o) => o.status === "CLOSED").length,
        upcomingOpportunities: opps.filter((o) => o.status === "UPCOMING").length,
        publishedOpportunities: opps.filter((o) => o.approvalStatus === "PUBLISHED").length,
        pendingOpportunities: opps.filter((o) => o.approvalStatus === "PENDING_REVIEW").length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, kind, id, reviewer = "admin" } = body;

    if (!id || !action || !kind) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (id, action, kind)" },
        { status: 400 }
      );
    }

    const newApprovalStatus =
      action === "APPROVE" ? "PUBLISHED" : action === "REJECT" ? "REJECTED" : "PENDING_REVIEW";

    const timestamp = new Date().toISOString();

    if (kind === "OPPORTUNITY") {
      const opps = getOpportunities();
      const target = opps.find((o) => o.id === id);
      if (!target) {
        return NextResponse.json({ success: false, error: "Opportunity not found" }, { status: 404 });
      }

      target.approvalStatus = newApprovalStatus;
      target.updatedAt = timestamp;
      target.lastCheckedAt = timestamp;

      syncDualFiles(path.join("data", "opportunities.json"), opps);

      return NextResponse.json({
        success: true,
        message: `Opportunity ${id} updated to ${newApprovalStatus}`,
        data: target,
      });
    } else if (kind === "EQUIPMENT") {
      const eqs = getEquipments();
      const target = eqs.find((e) => e.id === id);
      if (!target) {
        return NextResponse.json({ success: false, error: "Equipment not found" }, { status: 404 });
      }

      target.approvalStatus = newApprovalStatus;
      target.updatedAt = timestamp;
      target.lastCheckedAt = timestamp;

      syncDualFiles(path.join("data", "equipment.json"), eqs);

      return NextResponse.json({
        success: true,
        message: `Equipment ${id} updated to ${newApprovalStatus}`,
        data: target,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid kind" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
