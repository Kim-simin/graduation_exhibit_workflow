import { NextRequest, NextResponse } from "next/server";
import { JobPosting } from "@/types";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// 산학협력 검증 기업 목록 (선행 리서치 파이프라인 연계)
const PARTNERSHIP_COMPANIES = [
  "현대자동차",
  "네이버",
  "LG전자",
  "현대모비스",
  "현대건설",
  "카카오",
  "토스",
  "크래프톤",
  "리인벤션",
];

// 12대 산업군/직무 카테고리 매핑 헬퍼
function mapToCategory(title: string, dept: string, keyword: string): string {
  const text = (title + " " + dept + " " + keyword).toLowerCase();
  if (text.includes("디자인") || text.includes("ux") || text.includes("ui") || text.includes("gui")) return "디자인";
  if (text.includes("개발") || text.includes("소프트웨어") || text.includes("it") || text.includes("코딩") || text.includes("프론트") || text.includes("백엔드")) return "IT·인터넷";
  if (text.includes("연구") || text.includes("설계") || text.includes("r&d") || text.includes("hmi") || text.includes("공학")) return "연구개발·설계";
  if (text.includes("마케팅") || text.includes("광고") || text.includes("홍보") || text.includes("브랜드")) return "마케팅·광고·홍보";
  if (text.includes("경영") || text.includes("기획") || text.includes("사무") || text.includes("인사") || text.includes("총무")) return "경영·사무";
  if (text.includes("유통") || text.includes("물류") || text.includes("무역") || text.includes("scm")) return "무역·유통";
  if (text.includes("생산") || text.includes("제조") || text.includes("공정") || text.includes("품질")) return "생산·제조";
  if (text.includes("영업") || text.includes("세일즈") || text.includes("상담") || text.includes("고객")) return "영업·고객상담";
  if (text.includes("건축") || text.includes("건설") || text.includes("토목") || text.includes("실내")) return "건설";
  if (text.includes("금융") || text.includes("은행") || text.includes("투자") || text.includes("증권") || text.includes("핀테크")) return "금융";
  if (text.includes("미디어") || text.includes("영상") || text.includes("방송") || text.includes("콘텐츠") || text.includes("pd")) return "미디어";
  if (text.includes("특수") || text.includes("전문") || text.includes("법률") || text.includes("특허") || text.includes("회계")) return "전문·특수직";
  return "디자인";
}

// 제목/설명에서 기술스택 자동 추출 헬퍼
function extractTechStacks(title: string): string[] {
  const result: string[] = [];
  const knownKeywords = [
    "Figma", "UI/UX", "Photoshop", "Illustrator", "React", "TypeScript",
    "Next.js", "Python", "After Effects", "AutoCAD", "Revit", "BIM",
    "SQL", "ProtoPie", "3D", "Blender", "Rhino", "Keyshot", "Office", "Excel"
  ];
  for (const kw of knownKeywords) {
    if (title.toLowerCase().includes(kw.toLowerCase())) {
      result.push(kw);
    }
  }
  if (result.length === 0) {
    result.push("포트폴리오", "실무역량", "기본소양");
  }
  return result.slice(0, 4);
}

// 순수 정규식 기반 안전한 XML 태그 파서
function extractXmlTag(xmlItem: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xmlItem.match(regex);
  if (!match) return "";
  let val = match[1].trim();
  val = val.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
  return val;
}

// 워크넷 XML 파싱 및 JobPosting 규격 변환
function parseWorknetXml(xmlText: string, searchKeyword: string): JobPosting[] {
  const items: JobPosting[] = [];
  const wantedRegex = /<wanted>([\s\S]*?)<\/wanted>/gi;
  let match;
  let idx = 1;

  while ((match = wantedRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const authNo = extractXmlTag(itemXml, "wantedAuthNo");
    if (!authNo) continue; // 원본 번호가 없는 경우 배제

    const company = extractXmlTag(itemXml, "company");
    const title = extractXmlTag(itemXml, "title");
    if (!company || !title) continue;

    const prefDeptRaw = extractXmlTag(itemXml, "prefDept") || extractXmlTag(itemXml, "major");
    const closeDt = extractXmlTag(itemXml, "closeDt") || "상시채용";
    const career = extractXmlTag(itemXml, "career") || "신입";
    const region = extractXmlTag(itemXml, "region") || "전국";
    
    const mobileUrl = extractXmlTag(itemXml, "wantedMobileInfoUrl");
    const pcUrl = extractXmlTag(itemXml, "wantedInfoUrl");
    let originUrl = mobileUrl || pcUrl;
    if (!originUrl || originUrl.includes("...") || originUrl.length < 15) {
      originUrl = `https://www.work.go.kr/empInfo/empInfoSrch/detail/empDetailAuthView.do?wantedAuthNo=${authNo}`;
    }

    const preferredDepartments = prefDeptRaw
      ? prefDeptRaw.split(/[,/·\s]+/).filter(Boolean)
      : [searchKeyword || "관련 전공"];

    const category = mapToCategory(title, prefDeptRaw, searchKeyword);
    const techStacks = extractTechStacks(title);
    const isPartnership = PARTNERSHIP_COMPANIES.some((p) => company.includes(p));

    items.push({
      id: authNo,
      companyName: company,
      logoEmoji: isPartnership ? "🏢" : "💼",
      title,
      jobCategory: category,
      techStacks,
      employmentType: "정규직",
      careerLevel: career.includes("경력무관") ? "신입/경력무관" : "신입",
      preferredDepartments,
      deadline: closeDt,
      originUrl,
      sourceUrl: originUrl,
      isPartnership,
      location: region,
      verificationStatus: "VERIFIED",
      majorPreferenceStatus: prefDeptRaw ? "MAJOR_PREFERENCE_CONFIRMED" : "MAJOR_PREFERENCE_NOT_STATED",
      evidenceText: `[워크넷 Open API 실공고] ${company} - ${title} (요구조건: ${career}, 전공: ${prefDeptRaw || "명시없음"})`,
      sourceId: `src-worknet-${authNo}`,
      evidenceId: `evi-worknet-${authNo}`,
    });
    idx++;
  }

  return items;
}

// 실제 검증된 Recruitment Intelligence DB 조회
function getVerifiedRecruitmentPostings(): JobPosting[] {
  const possiblePaths = [
    path.join(process.cwd(), "data", "research", "intelligence", "recruitment_intelligence.json"),
    path.join(process.cwd(), "..", "data", "research", "intelligence", "recruitment_intelligence.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.verified_postings)) {
          return parsed.verified_postings;
        }
      } catch (err) {
        console.error(`[API /api/jobs] Failed to read ${p}:`, err);
      }
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = (searchParams.get("keyword") || "").toLowerCase().trim();
    const category = searchParams.get("category") || "";
    const department = searchParams.get("department") || "";
    const startPage = searchParams.get("startPage") || "1";
    const display = searchParams.get("display") || "20";

    const effectiveKeyword = keyword || (department !== "all" ? department : "") || (category !== "전체" ? category : "");
    const apiKey = process.env.WORKNET_API_KEY;

    // 1. 워크넷 실제 Open API 연동 시도 (API 키 존재 시에만 동작)
    if (apiKey && apiKey.trim() !== "") {
      try {
        const queryParams = new URLSearchParams({
          authKey: apiKey,
          callTp: "L",
          returnType: "XML",
          startPage,
          display,
          ...(effectiveKeyword ? { keyword: effectiveKeyword } : {}),
        });

        const worknetEndpoint = `http://openapi.work.go.kr/opi/opi/opia/wantedApi.do?${queryParams.toString()}`;

        const response = await fetch(worknetEndpoint, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (GradExhibitPro/1.0; JobBoard)",
          },
          next: { revalidate: 300 }, // 5분 캐시
        });

        if (response.ok) {
          const xmlText = await response.text();
          if (xmlText.includes("<wanted>") && !xmlText.includes("<errorCode>")) {
            const parsedJobs = parseWorknetXml(xmlText, effectiveKeyword);
            if (parsedJobs.length > 0) {
              return NextResponse.json({
                success: true,
                source: "worknet-live-api",
                total: parsedJobs.length,
                jobs: parsedJobs,
              });
            }
          }
        }
      } catch (apiError) {
        console.error("[Worknet API] Live fetch error:", apiError);
      }
    }

    // 2. 검증된 Intelligence DB 조회 (가짜 시드/Mock 데이터 전면 제거)
    const allVerifiedJobs = getVerifiedRecruitmentPostings();

    // 3. 신입 전용 강제 및 필터 적용
    const filteredJobs = allVerifiedJobs.filter((job) => {
      // 경력직 배제: 신입 전용만 허용
      if (job.careerLevel !== "신입" && job.careerLevel !== "신입/경력무관") {
        return false;
      }

      // 12대 산업군 카테고리 필터
      if (category && category !== "전체" && job.jobCategory !== category) {
        return false;
      }

      // 학과 필터
      if (department && department !== "all") {
        const cleanDept = department.replace("학과", "").replace("전공", "").replace("학부", "").replace(/과$/, "").trim();
        const deptMatch =
          job.preferredDepartments?.some((d) => d.includes(cleanDept) || cleanDept.includes(d)) ||
          (job.matchedDepartment && job.matchedDepartment.includes(cleanDept)) ||
          job.title.toLowerCase().includes(cleanDept.toLowerCase());
        if (!deptMatch) return false;
      }

      // 키워드 필터
      if (keyword) {
        const match =
          job.companyName.toLowerCase().includes(keyword) ||
          job.title.toLowerCase().includes(keyword) ||
          job.techStacks?.some((t) => t.toLowerCase().includes(keyword)) ||
          job.preferredDepartments?.some((d) => d.toLowerCase().includes(keyword));
        if (!match) return false;
      }

      return true;
    });

    // 검색 결과가 0건이면 가짜 데이터를 만들지 않고 빈 배열 [] 반환 (정상 상태)
    return NextResponse.json({
      success: true,
      source: "recruitment-intelligence-db",
      message: "Served strictly verified recruitment postings from Intelligence DB",
      total: filteredJobs.length,
      jobs: filteredJobs,
    });
  } catch (error) {
    console.error("[API /api/jobs] Critical error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch jobs from Intelligence DB",
        jobs: [],
      },
      { status: 500 }
    );
  }
}
