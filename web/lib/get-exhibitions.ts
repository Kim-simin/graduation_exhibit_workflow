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
  thumbnail?: string;
  thumbnail_url?: string;
  original_image_url?: string;
  thumbnail_crop_coordinates?: Record<string, any>;
  thumbnail_generated_at?: string;
  thumbnail_status?: string;
  thumbnail_review_status?: string;
}

export function getArtworkThumbnail(art: Artwork): string {
  return art.thumbnail || art.thumbnail_url || art.imagePath;
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
  posterVideoPath?: string | null;
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
    const candidatePaths = [
      path.resolve(process.cwd(), "data", "published", "exhibitions.json"),
      path.resolve(process.cwd(), "web", "data", "published", "exhibitions.json"),
      path.resolve(process.cwd(), "web", "data", "exhibitions.json"),
      path.resolve(process.cwd(), "data", "exhibitions.json"),
      path.resolve(__dirname, "..", "data", "published", "exhibitions.json"),
      path.resolve(__dirname, "..", "data", "exhibitions.json"),
    ];
    let resolvedPath = "";
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        resolvedPath = p;
        break;
      }
    }
    if (!resolvedPath) {
      console.warn("[getInitialExhibitions] Exhibitions file not found in candidates");
      return [];
    }
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const exhibitions: Exhibition[] = JSON.parse(raw);
    return exhibitions.filter(
      (item) =>
        (item.status === "published" || item.status === "완료" || item.status === "리서치 완료") &&
        item.isResearched === true &&
        Boolean(item.posterPath && item.posterPath.length > 5)
    );
  } catch (err) {
    console.error("[getInitialExhibitions Error]:", err);
    return [];
  }
}
