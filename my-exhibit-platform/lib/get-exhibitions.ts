import fs from "fs";
import path from "path";
import { getStandardCategory, isArtworkZoomDisabled } from "@/src/utils/categoryMapper";

export interface Artwork {
  title: string;
  author: string;
  role: string;
  imagePath: string;
  description: string;
  department?: string;
}

export interface Exhibition {
  id: string;
  university: string;
  department: string;
  year: string;
  category: string;
  title: string;
  isResearched: boolean;
  posterPath: string | null;
  headline: string;
  curationIntro: string;
  period: string;
  venue: string;
  criticScore: number;
  tags: string[];
  artworks: Artwork[];
  works?: Artwork[];
  targetUrl?: string;
  status?: string;
  slogan?: string;
  subtitle?: string;
  description?: string;
  schedule?: string;
  instagramPublished?: boolean;
  publishedAt?: string | null;
  cardCaption?: string;
  isUploaded?: boolean;
  cooperationCompanies?: string[];
  crossValidationStatus?: string;
  hasCorporateCooperation?: boolean;
  corporateCooperationCount?: number;
  verifiedRequiredSkills?: string[];
  corporateResearchReport?: string;
  disableArtworkZoom?: boolean;
}

export function mapCategory(rawCat: string): string {
  return getStandardCategory(rawCat);
}

export function getInitialExhibitions(): Exhibition[] {
  try {
    const queuePaths = [
      path.resolve(process.cwd(), "..", "data", "university_queue.json"),
      path.resolve(process.cwd(), "data", "university_queue.json"),
      path.resolve("c:\\Users\\graduation_exhibit_workflow\\data\\university_queue.json"),
    ];

    let queueFile = "";
    for (const qp of queuePaths) {
      if (fs.existsSync(qp)) {
        queueFile = qp;
        break;
      }
    }

    if (!queueFile) {
      return [];
    }

    const raw = fs.readFileSync(queueFile, "utf-8");
    const rawQueue = JSON.parse(raw);

    return rawQueue.map((item: any) => {
      const poster = item.poster_image;
      const hasRealPoster = Boolean(poster && typeof poster === "string" && !poster.includes("unsplash") && poster.length > 5);
      const cleanPosterPath = hasRealPoster
        ? poster.replace(/\\/g, "/").replace(/^.*data\/downloads\//, "").replace(/^.*downloads\//, "").replace(/^\/+/, "").replace(/^public\//, "")
        : null;

      const artworks = (item.artworks || [])
        .filter((a: any) => a.image && !a.image.includes("unsplash"))
        .map((a: any) => ({
          title: a.title || "출품작",
          author: a.student_name || `${item.university} 작가`,
          role: a.inferred_role || "크리에이터",
          department: a.department || a.sub_department || a.track || a.major || "",
          imagePath: a.image.replace(/\\/g, "/").replace(/^.*data\/downloads\//, "").replace(/^.*downloads\//, "").replace(/^\/+/, "").replace(/^public\//, ""),
          description: a.description || "",
        }));

      const cleanTitle = hasRealPoster
        ? (item.exhibition_title && !item.exhibition_title.includes("인공지능 기반 능동형")
            ? item.exhibition_title
            : `[${item.university}] ${item.year || "2025"} ${item.department} 졸업전시회`)
        : `[${item.university}] ${item.department} 졸업전시회`;

      const cleanHeadline = hasRealPoster
        ? (item.curation_summary?.headline || item.card_news?.card_headline || item.exhibition_title || item.title || `${item.university} ${item.department} 졸업전시회`)
        : `${item.university} ${item.department} 공식 졸업전시 아카이브`;

      const isResearched = (item.status === "리서치 완료" || item.status === "완료" || item.status === "승인 완료" || item.status === "검수 완료" || item.status === "published") && Boolean(hasRealPoster);
      const isUploaded = isResearched || item.status === "published" || Boolean(item.isUploaded);

      return {
        id: item.id,
        university: item.university,
        department: item.department,
        year: item.year || "2025",
        category: getStandardCategory(item.category || item.department),
        title: cleanTitle,
        isResearched,
        isUploaded,
        status: item.status || "대기",
        targetUrl: item.target_url || item.scraped_url || item.official_url || "",
        posterPath: cleanPosterPath,
        headline: cleanHeadline,
        curationIntro:
          isResearched
            ? (item.curation_summary?.curation_intro || item.card_news?.card_intro || (typeof item.curation_summary === "string" ? item.curation_summary : "") || item.slogan || item.critic_feedback || "")
            : "아직 리서치 및 에셋 아카이빙이 진행되지 않았습니다. 관리자 관제 대시보드에서 리서치를 트리거하면 Gemini Search Grounding과 Playwright 크롤러가 공식 아카이브를 수집합니다.",
        period: item.exhibition_period || "일정 공지 대기",
        schedule: item.exhibition_period || "일정 공지 대기",
        venue: item.exhibition_venue || "교내 전시홀",
        slogan: item.slogan || item.exhibit_slogan || item.curation_summary?.headline || item.card_news?.card_headline || cleanHeadline,
        subtitle: item.slogan || item.exhibit_slogan || item.curation_summary?.headline || item.card_news?.card_headline || cleanHeadline,
        description: item.raw_description || item.curation_summary?.curation_intro || item.card_news?.card_intro || "",
        criticScore: isResearched ? (item.critic_score || 95) : 0,
        tags: item.curation_summary?.inferred_industry_keywords || item.card_news?.tags || [item.department, "졸업전시"],
        artworks,
        instagramPublished: Boolean(item.instagramPublished),
        publishedAt: item.publishedAt || null,
        cardCaption: item.card_news?.card_caption || "",
        cooperationCompanies: (item.cooperation_companies || []).map((c: any) =>
          typeof c === "string" ? c : c?.company_name || c?.name || String(c)
        ),
        crossValidationStatus: item.cross_validation_status || null,
        hasCorporateCooperation: Boolean(item.has_corporate_cooperation || (item.cooperation_companies && item.cooperation_companies.length > 0)),
        corporateCooperationCount: item.corporate_cooperation_count || (item.cooperation_companies ? item.cooperation_companies.length : 0),
        verifiedRequiredSkills: item.verified_required_skills || [],
        corporateResearchReport: item.corporate_research_report || null,
        disableArtworkZoom: isArtworkZoomDisabled({
          id: item.id,
          category: item.category,
          department: item.department,
          university: item.university,
          year: item.year,
          title: cleanTitle,
          disableArtworkZoom: Boolean(item.disable_artwork_zoom || item.disableArtworkZoom),
        }),
      };
    });
  } catch (err) {
    console.error("[getInitialExhibitions Error]:", err);
    return [];
  }
}
