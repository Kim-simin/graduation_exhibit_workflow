import { NextResponse } from "next/server";
import {
  getOpportunities,
  getEquipments,
  filterOpportunities,
  filterEquipments,
  getStudentExplorationData,
} from "@/lib/opportunity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const university = searchParams.get("university") || "all";
    const major = searchParams.get("major") || "all";
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "all";
    const scope = searchParams.get("scope") || "all";
    const searchQuery = searchParams.get("q") || "";
    const mode = searchParams.get("mode") || "standard";

    // 4대 핵심 질문 영역 모드
    if (mode === "student_discovery") {
      const discovery = getStudentExplorationData(university, major);
      return NextResponse.json({
        success: true,
        university,
        major,
        data: discovery,
      });
    }

    const allOpps = getOpportunities().filter(o => o.approvalStatus === "PUBLISHED");
    const allEqs = getEquipments();

    const filteredOpps = filterOpportunities(allOpps, {
      university,
      major,
      type,
      status,
      searchQuery,
      accessScope: scope,
    });

    const filteredEqs = filterEquipments(allEqs, {
      university,
      major,
      category,
      searchQuery,
      scope,
    });

    return NextResponse.json({
      success: true,
      counts: {
        opportunities: filteredOpps.length,
        equipment: filteredEqs.length,
        total: filteredOpps.length + filteredEqs.length,
      },
      opportunities: filteredOpps,
      equipment: filteredEqs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
