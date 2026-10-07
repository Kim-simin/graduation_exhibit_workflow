const fs = require('fs');

function cleanProjectFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  const targetFn = /export function getCompanyChallengesAsProjects\(\): MentoringProject\[\] \{[\s\S]*?\n\}\n\n\/\*\*[\s\S]*?export function getProjects\(\): MentoringProject\[\] \{[\s\S]*?return uniqueProjects;\n\}/;
  
  const replacement = `export function getCompanyChallengesAsProjects(): MentoringProject[] {
  // 기업 제안 더미/가상 데이터 전면 제거: 100% 검증된 실데이터만 노출
  return [];
}

/**
 * 3. 전체 프로젝트 (검증된 실데이터만 노출)
 * Single Source of Truth:
 * - 부산경상대학교 김시민 학생의 실제 참여 프로젝트만 노출
 * - 임의 생성/가짜 더미 기업 과제 일체 제외
 */
export function getProjects(): MentoringProject[] {
  const students = getStudentProjects();
  return students;
}`;

  if (targetFn.test(content)) {
    content = content.replace(targetFn, replacement);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Successfully updated:', filePath);
  } else {
    console.error('Target pattern not found in:', filePath);
  }
}

cleanProjectFile('admin/lib/project.ts');
cleanProjectFile('web/lib/project.ts');
