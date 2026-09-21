import { getInitialExhibitions, type Exhibition } from "@/lib/get-exhibitions";
import ExhibitionGallery from "@/components/exhibition-gallery";

export type { Exhibition };

export const dynamic = "force-dynamic";

export default function PublicHomePage() {
  const exhibitions = getInitialExhibitions();

  return <ExhibitionGallery initialExhibitions={exhibitions} />;
}
