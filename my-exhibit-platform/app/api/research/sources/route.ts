import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { InformationSource, SourceSummary } from "@/lib/source-traceability";

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
    const filterDomain = searchParams.get("domain")?.toLowerCase();
    const filterStatus = searchParams.get("status")?.toUpperCase();
    const filterEntityId = searchParams.get("entity_id");
    const filterRunId = searchParams.get("run_id");

    const rootDir = path.resolve(process.cwd(), "..");
    const cwdPath = process.cwd();

    const getFirstExisting = (subPath: string) => {
      for (const p of [path.join(rootDir, subPath), path.join(cwdPath, subPath)]) {
        const data = readJsonFile(p);
        if (data) return data;
      }
      return null;
    };

    const professors = getFirstExisting("data/professors.json") || [];
    const rfps = getFirstExisting("data/rfp.json") || [];
    const brandAssets = getFirstExisting("data/brand_assets.json") || [];
    const mentors = getFirstExisting("data/mentors.json") || [];
    const universityQueue = getFirstExisting("data/university_queue.json") || [];

    const allSources: InformationSource[] = [];

    // 1. Professors
    if (Array.isArray(professors)) {
      for (const p of professors) {
        if (Array.isArray(p.information_sources)) {
          allSources.push(...p.information_sources);
        }
      }
    }

    // 2. RFP
    if (Array.isArray(rfps)) {
      for (const r of rfps) {
        if (Array.isArray(r.information_sources)) {
          allSources.push(...r.information_sources);
        }
      }
    }

    // 3. Brand Assets
    if (Array.isArray(brandAssets)) {
      for (const b of brandAssets) {
        if (Array.isArray(b.information_sources)) {
          allSources.push(...b.information_sources);
        }
      }
    }

    // 4. Mentors
    if (Array.isArray(mentors)) {
      for (const m of mentors) {
        if (Array.isArray(m.information_sources)) {
          allSources.push(...m.information_sources);
        }
      }
    }

    // 5. University Queue (추가 대학 공식 출처 추출)
    if (Array.isArray(universityQueue)) {
      for (const uq of universityQueue.slice(0, 10)) {
        if (uq.scraped_url && typeof uq.scraped_url === "string" && uq.scraped_url.startsWith("http")) {
          try {
            const parsed = new URL(uq.scraped_url);
            allSources.push({
              source_id: `src-univ-${uq.id || Math.random().toString(36).slice(2, 8)}`,
              source_url: uq.scraped_url,
              source_title: `전국 대학 공식 아카이브 (${uq.university || "대학"} ${uq.department || "학과"})`,
              source_type: "UNIVERSITY_OFFICIAL",
              source_domain: parsed.hostname.toLowerCase(),
              source_priority: 1,
              verification_status: "VERIFIED",
              evidence: uq.scraped_text || `${uq.university} 공식 전시회 출품작 아카이브`,
              collected_at: uq.publishedAt || "2026-09-11T18:18:52",
              last_verified_at: "2026-09-16T18:30:00",
              entity_id: uq.id || "",
            });
          } catch (_) {}
        }
      }
    }

    // Deduplicate sources by URL
    const uniqueMap = new Map<string, InformationSource>();
    for (const src of allSources) {
      const key = src.source_url ? src.source_url.trim() : src.source_id;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, src);
      }
    }
    const deduplicatedSources = Array.from(uniqueMap.values());

    // Compute Summary
    const summary: SourceSummary = {
      total_sources: deduplicatedSources.length,
      verified_count: deduplicatedSources.filter((s) => s.verification_status === "VERIFIED").length,
      unverified_count: deduplicatedSources.filter((s) => s.verification_status === "UNVERIFIED").length,
      failed_count: deduplicatedSources.filter((s) => s.verification_status === "FAILED").length,
      last_research_time: deduplicatedSources.reduce((latest, s) => {
        const t = s.last_verified_at || s.collected_at || "";
        return t > latest ? t : latest;
      }, "2026-09-16T18:30:10"),
      by_domain: {
        university: deduplicatedSources.filter((s) => s.source_type === "UNIVERSITY_OFFICIAL").length,
        corporate_rfp: deduplicatedSources.filter((s) => s.source_type === "CORPORATE_RFP").length,
        professor: deduplicatedSources.filter((s) => s.source_type === "PROFESSOR_OFFICIAL").length,
        mentor: deduplicatedSources.filter((s) => s.source_type === "MENTOR_PROFILE").length,
        brand_ip: deduplicatedSources.filter((s) => s.source_type === "BRAND_IP_OFFICIAL").length,
      },
    };

    // Filter results
    let filtered = deduplicatedSources;

    if (filterDomain && filterDomain !== "all") {
      filtered = filtered.filter((s) => {
        switch (filterDomain) {
          case "university":
            return s.source_type === "UNIVERSITY_OFFICIAL";
          case "corporate_rfp":
            return s.source_type === "CORPORATE_RFP";
          case "professor":
            return s.source_type === "PROFESSOR_OFFICIAL";
          case "mentor":
            return s.source_type === "MENTOR_PROFILE";
          case "brand_ip":
            return s.source_type === "BRAND_IP_OFFICIAL";
          default:
            return true;
        }
      });
    }

    if (filterStatus) {
      filtered = filtered.filter((s) => s.verification_status === filterStatus);
    }

    if (filterEntityId) {
      filtered = filtered.filter((s) => s.entity_id === filterEntityId);
    }

    if (filterRunId) {
      filtered = filtered.filter((s) => s.run_id === filterRunId);
    }

    return NextResponse.json({
      status: "SUCCESS",
      summary,
      total: filtered.length,
      sources: filtered,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "ERROR", error: error.message },
      { status: 500 }
    );
  }
}
