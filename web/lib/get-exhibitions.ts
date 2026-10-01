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
    const publishedPath = path.resolve(process.cwd(), "data", "published", "exhibitions.json");
    if (!fs.existsSync(publishedPath)) {
      console.warn("[getInitialExhibitions] Published exhibitions file not found at:", publishedPath);
      return [];
    }
    const raw = fs.readFileSync(publishedPath, "utf-8");
    const exhibitions: Exhibition[] = JSON.parse(raw);
    return exhibitions;
  } catch (err) {
    console.error("[getInitialExhibitions Error]:", err);
    return [];
  }
}
