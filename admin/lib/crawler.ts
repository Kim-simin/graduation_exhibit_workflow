/**
 * lib/crawler.ts
 * Playwright 기반 공식 아카이브 탐색 모듈 (하위 호환 래퍼)
 */

import { executeArchiveAgent, ArchiveAgentResult } from "./research-node";
import path from "path";
import fs from "fs";

export interface ScrapedAsset {
  posterImage: string | null;
  artworks: Array<{
    studentName: string;
    title: string;
    image: string;
    description: string;
    inferredRole: string;
  }>;
  scrapedText: string;
  scrapedUrl: string;
  exhibitionTitle: string;
  status: "SUCCESS" | "FAILED";
}

export async function crawlInstagramExhibit(
  university: string,
  department: string,
  year: string = "2025"
): Promise<ScrapedAsset> {
  const cleanUniv = university.replace(/[\\/*?:"<>|]/g, "_").trim();
  const cleanDept = department.replace(/[\\/*?:"<>|]/g, "_").trim();

  const possibleBase = [
    path.resolve(process.cwd(), "..", "data", "downloads"),
    path.resolve(process.cwd(), "data", "downloads"),
  ];
  let downloadBase = possibleBase[0];
  if (!fs.existsSync(downloadBase) && fs.existsSync(possibleBase[1])) {
    downloadBase = possibleBase[1];
  }
  const downloadDir = path.join(downloadBase, `${cleanUniv}_${cleanDept}`);
  fs.mkdirSync(downloadDir, { recursive: true });

  const agentRes: ArchiveAgentResult = await executeArchiveAgent(
    university,
    department,
    year,
    "디자인·UX/UI·서비스디자인",
    downloadDir
  );

  const finalArtworks = (agentRes.works_sample || []).map((w, idx) => ({
    studentName: w.student_name,
    title: w.title,
    image: path.join(downloadDir, `art_${String(idx + 1).padStart(2, "0")}.png`),
    description: w.title,
    inferredRole: `${department} 크리에이터`,
  }));

  return {
    posterImage: agentRes.exhibition.poster_url,
    artworks: finalArtworks,
    scrapedText: agentRes.exhibition.title,
    scrapedUrl: agentRes.exhibition.official_url || "",
    exhibitionTitle: agentRes.exhibition.title,
    status: agentRes.status,
  };
}
