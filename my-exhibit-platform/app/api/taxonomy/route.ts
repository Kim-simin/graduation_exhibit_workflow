import { NextResponse } from "next/server";
import { getTaxonomy, getProfessors, getRfps, getBrandAssets, getMentors } from "@/lib/data";

export async function GET() {
  const taxonomy = getTaxonomy();
  const professors = getProfessors();
  const rfps = getRfps();
  const brandAssets = getBrandAssets();
  const mentors = getMentors();

  // 각 산업군/분류별 엔터티 매핑 개수 집계
  const countsByTaxonomy: Record<string, any> = {};

  taxonomy.forEach((tax) => {
    const profCount = professors.filter((p) =>
      p.research_areas?.some((ra) => tax.keywords.some((kw) => ra.includes(kw))) ||
      tax.related_majors.some((rm) => p.department?.includes(rm))
    ).length;

    const rfpCount = rfps.filter((r) =>
      r.industry?.includes(tax.name) ||
      tax.keywords.some((kw) => r.title?.includes(kw) || r.industry?.includes(kw))
    ).length;

    const ipCount = brandAssets.filter((b) =>
      b.category?.includes(tax.name) ||
      b.industry?.includes(tax.name) ||
      tax.keywords.some((kw) => b.category?.includes(kw))
    ).length;

    const mentorCount = mentors.filter((m) =>
      m.specialties?.some((sp) => tax.keywords.some((kw) => sp.includes(kw))) ||
      tax.keywords.some((kw) => m.company?.includes(kw) || m.role?.includes(kw))
    ).length;

    countsByTaxonomy[tax.id] = {
      ...tax,
      counts: {
        professors: profCount,
        rfp: rfpCount,
        brand_assets: ipCount,
        mentors: mentorCount,
        total: profCount + rfpCount + ipCount + mentorCount,
      },
    };
  });

  return NextResponse.json({
    success: true,
    taxonomy,
    countsByTaxonomy,
  });
}
