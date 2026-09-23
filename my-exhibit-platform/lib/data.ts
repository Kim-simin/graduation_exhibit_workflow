import studentsData from "@/data/students.json";
import professorsData from "@/data/professors.json";
import rfpData from "@/data/rfp.json";
import mentorsData from "@/data/mentors.json";
import corporateData from "@/data/corporate.json";
import brandAssetsData from "@/data/brand_assets.json";
import taxonomyData from "@/data/taxonomy.json";
import recruitmentIntelligence from "@/data/research/intelligence/recruitment_intelligence.json";
import generatedContentsData from "@/data/generated_contents.json";
import { Student, Professor, RFP, Mentor, CorporateData, BrandAsset, GeneratedContentItem, JobPosting } from "@/types";

export interface TaxonomyItem {
  id: string;
  name: string;
  icon: string;
  keywords: string[];
  related_majors: string[];
  color: string;
}

export function getTaxonomy(): TaxonomyItem[] {
  return taxonomyData as TaxonomyItem[];
}

export function getStudents(): Student[] {
  return studentsData as Student[];
}

export function getStudentById(id: string): Student | undefined {
  return (studentsData as Student[]).find((s) => s.id === id);
}

export function getProfessors(): Professor[] {
  return (professorsData as unknown as Professor[]) || [];
}

export function getVerifiedProfessors(): Professor[] {
  return ((professorsData as unknown as Professor[]) || []).filter(
    (p) => p.is_verified || p.verification_status === "VERIFIED"
  );
}

export function getProfessorById(id: string): Professor | undefined {
  return ((professorsData as unknown as Professor[]) || []).find((p) => p.id === id);
}

export function getRfps(): RFP[] {
  return [];
}

export function getVerifiedRfps(): RFP[] {
  return [];
}

export function getRfpById(id: string): RFP | undefined {
  return undefined;
}

export function getJobs(): JobPosting[] {
  const data = recruitmentIntelligence as any;
  return (data?.verified_postings || []) as JobPosting[];
}

export function getJobById(id: string): JobPosting | undefined {
  return getJobs().find((j) => j.id === id);
}

export function getMatchedJobsForStudent(student: Student): JobPosting[] {
  const allJobs = getJobs();
  if (allJobs.length === 0) return [];

  const cleanDept = (student.department || "").replace(/학과|전공|학부|과/g, "").trim();
  const studentSkills = (student.skills || []).map((s) => s.toLowerCase());

  const scored = allJobs.map((job) => {
    let score = 0;
    // 1. 학과/전공 매칭
    const deptMatched = job.preferredDepartments?.some((d) => {
      const clean = d.replace(/학과|전공|학부|과/g, "").trim();
      return clean && (cleanDept.includes(clean) || clean.includes(cleanDept));
    }) || (job.matchedDepartment && job.matchedDepartment.includes(cleanDept));
    if (deptMatched) score += 50;

    // 2. 기술 스택 매칭
    const matchedSkills = (job.techStacks || []).filter((stack) =>
      studentSkills.some((s) => s.includes(stack.toLowerCase()) || stack.toLowerCase().includes(s))
    );
    score += matchedSkills.length * 15;

    // 3. 직무 키워드 매칭
    if (student.role) {
      const roleWords = student.role.split(" ");
      roleWords.forEach((rw) => {
        if (job.title.includes(rw) || job.jobCategory.includes(rw)) score += 20;
      });
    }

    // 4. 산학협력 가산점
    if (job.isPartnership) score += 10;

    return { job, score, matchedSkills };
  });

  scored.sort((a, b) => b.score - a.score);

  // 상위 2~3건 반환
  return scored.slice(0, 3).map((s) => s.job);
}

export function getBrandAssets(): BrandAsset[] {
  return [];
}

export function getVerifiedBrandAssets(): BrandAsset[] {
  return [];
}

export function getMentors(): Mentor[] {
  return [];
}

export function getVerifiedMentors(): Mentor[] {
  return [];
}

export function getMentorById(id: string): Mentor | undefined {
  return undefined;
}

export function getCorporateData(): CorporateData {
  return {
    partners: [],
    rfp_list: [],
    ip_freepass_list: [],
    stats: {
      total_projects: 0,
      active_enterprises: 0,
      verified_rfps: 0,
    },
  } as any;
}

export function getGeneratedContents(): GeneratedContentItem[] {
  const data = generatedContentsData as any;
  return (data.contents || []) as GeneratedContentItem[];
}

export function getGeneratedContentById(id: string): GeneratedContentItem | undefined {
  return getGeneratedContents().find((c) => c.content_id === id);
}

export function getContentsForEntity(
  entityId: string,
  entityType?: string
): GeneratedContentItem[] {
  const allContents = getGeneratedContents();
  const directMatches = allContents.filter(
    (c) =>
      c.related_entity_id === entityId ||
      c.project_id === entityId ||
      c.research_ids?.includes(entityId)
  );

  if (directMatches.length > 0) return directMatches;

  // Fallback: Return top QA_PASSED or HUMAN_REVIEW or APPROVED contents
  return allContents.slice(0, 2);
}



