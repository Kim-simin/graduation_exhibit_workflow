import { NextResponse } from "next/server";
import { getOpportunityById, getEquipmentById } from "@/lib/opportunity";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const opp = getOpportunityById(id);
    if (opp) {
      return NextResponse.json({
        success: true,
        kind: "OPPORTUNITY",
        data: opp,
      });
    }

    const eq = getEquipmentById(id);
    if (eq) {
      return NextResponse.json({
        success: true,
        kind: "EQUIPMENT",
        data: eq,
      });
    }

    return NextResponse.json(
      { success: false, error: "Resource not found" },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch item" },
      { status: 500 }
    );
  }
}
