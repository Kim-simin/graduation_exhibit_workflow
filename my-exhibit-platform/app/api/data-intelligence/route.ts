import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getProfessors, getRfps, getBrandAssets, getMentors } from "@/lib/data";

export async function GET() {
  const professors = getProfessors();
  const rfps = getRfps();
  const brandAssets = getBrandAssets();
  const mentors = getMentors();

  const profVerified = professors.filter((p) => p.is_verified || p.verification_status === "VERIFIED").length;
  const rfpVerified = rfps.filter((r) => r.is_verified || r.verification_status === "VERIFIED").length;
  const ipVerified = brandAssets.filter((b) => b.is_verified || b.verification_status === "VERIFIED").length;
  const mentorVerified = mentors.filter((m) => m.is_verified || m.verification_status === "VERIFIED").length;

  let auditLogs = [];
  try {
    const auditPath = path.join(process.cwd(), "..", "data", "logs", "data_intelligence_audit.json");
    if (fs.existsSync(auditPath)) {
      const content = fs.readFileSync(auditPath, "utf-8");
      auditLogs = JSON.parse(content);
    }
  } catch (e) {
    // fallback
  }

  return NextResponse.json({
    success: true,
    metrics: {
      professors: { total: professors.length, verified: profVerified, unverified: professors.length - profVerified },
      rfp: { total: rfps.length, verified: rfpVerified, unverified: rfps.length - rfpVerified },
      brand_assets: { total: brandAssets.length, verified: ipVerified, unverified: brandAssets.length - ipVerified },
      mentors: { total: mentors.length, verified: mentorVerified, unverified: mentors.length - mentorVerified },
    },
    latest_audit_logs: auditLogs.slice(-10).reverse(),
    verified_at: new Date().toISOString(),
  });
}
