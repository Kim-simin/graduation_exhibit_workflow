export interface JobPosting {
  id: string;
  companyName: string;
  logoUrl?: string;
  logoEmoji?: string;
  title: string;
  jobCategory: string; // 12대 산업군 카테고리
  techStacks: string[];
  employmentType: string; // "정규직", "인턴", "계약직" 등
  
  // 🚀 핵심 필드: 신입 전용 및 우대 학과
  careerLevel: '신입' | '신입/경력무관'; // 경력직 전용 공고는 원천 배제
  preferredDepartments: string[]; // 채용에서 우대/요구하는 학과 리스트 (예: ["시각디자인학과", "산업정보디자인전공", "소프트웨어학과"])
  
  deadline: string; // "2026-11-30", "상시채용" 등
  originUrl: string;
  isPartnership: boolean; // 산학협력 연계 기업 여부
  location?: string;
  departmentMatchReason?: string;
}
