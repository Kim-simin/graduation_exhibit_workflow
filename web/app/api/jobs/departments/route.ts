import { NextResponse } from "next/server";

const DEPARTMENTS = [
  "전체 학과",
  "시각디자인과",
  "산업디자인과",
  "컴퓨터공학과",
  "소프트웨어학과",
  "미디어커뮤니케이션학과",
  "패션디자인과",
  "건축학과",
  "영상애니메이션과"
];

export async function GET() {
  return NextResponse.json({ departments: DEPARTMENTS });
}