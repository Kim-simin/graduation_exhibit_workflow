export interface GradeTechStep {
  grade: string;       // "1학년", "2학년", "3학년", "4학년"
  stage: string;       // "기초 조형 및 UX 리서치"
  tools: string[];     // ["Figma", "Illustrator"]
  desc: string;        // "휴먼 팩터 리서치 및 기초 UI 컴포넌트 설계"
}

export interface DepartmentCurriculum {
  id: string;
  department_category: string; // 학과 카테고리 (예: "시각·인터랙션·UX디자인")
  lead_school: {
    university: string;        // 예: "고려대학교"
    department: string;        // 예: "디자인조형학부"
    badge_title: string;       // 예: "미래 모빌리티 UX/UI 선도 학과"
  };
  curriculum_title: string;    // 실무 커리큘럼명
  short_video_url: string;     // 숏폼 비디오 경로
  video_poster: string;        // 썸네일 포스터
  grade_tech_tree: GradeTechStep[]; // 1~4학년 실무 작업 테크트리
  steps?: {
    step_num: string;
    name: string;
    desc: string;
  }[];
  tech_stack?: string[];
  benchmarked_universities: {  // 동일 커리큘럼 개설 대학교
    university: string;
    department: string;
    exhibition_link_id?: string;
  }[];
}

export type StandardCurriculum = DepartmentCurriculum;
