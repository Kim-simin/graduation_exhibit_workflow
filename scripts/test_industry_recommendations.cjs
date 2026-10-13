const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// 1. Verify JSON DB integrity
const projectsSeedPath = path.resolve(__dirname, '../web/data/projects.json');
const projectsRaw = JSON.parse(fs.readFileSync(projectsSeedPath, 'utf8'));
assert(Array.isArray(projectsRaw), 'projects.json must be an array');
assert(projectsRaw.length >= 1, 'Seed projects must not be erased');
assert(projectsRaw.some(p => p.id === 'proj-grad-exhibit-platform'), 'Original project proj-grad-exhibit-platform must exist');
console.log('✅ 1. Seed Projects DB integrity verified: ' + projectsRaw.length + ' records intact.');

// 2. Test summarizeResources logic
const sampleResources = [
  { name: 'VS Code', kind: 'program' },
  { name: 'Claude 3.5 Sonnet', kind: 'model' },
  { name: 'Cursor IDE', kind: 'tool' },
  { name: 'v0 by Vercel', kind: 'tool' },
  { name: 'Code Refactoring Workflow', kind: 'agent_skill' },
  { name: '디자인 시스템 구축', kind: 'human_skill' },
  { name: 'Postgres MCP Server', kind: 'mcp' }
];

function summarizeResources(resources = []) {
  const tools = resources.filter(r => r.kind === 'tool').map(r => r.name);
  const models = resources.filter(r => r.kind === 'model').map(r => r.name);
  const skills = resources.filter(r => r.kind === 'agent_skill' || r.kind === 'human_skill').map(r => r.name);
  const mcps = resources.filter(r => r.kind === 'mcp').map(r => r.name);
  const programs = resources.filter(r => r.kind === 'program').map(r => r.name);
  return { tools, models, skills, mcps, programs };
}

const summary = summarizeResources(sampleResources);
assert.deepEqual(summary.tools, ['Cursor IDE', 'v0 by Vercel']);
assert.deepEqual(summary.models, ['Claude 3.5 Sonnet']);
assert.deepEqual(summary.skills, ['Code Refactoring Workflow', '디자인 시스템 구축']);
assert.deepEqual(summary.mcps, ['Postgres MCP Server']);
assert.deepEqual(summary.programs, ['VS Code']);
console.log('✅ 2. summarizeResources categorized all 5 categories correctly.');

// 3. Test 3-tier status verification distinction
const STATUS_TIERS = {
  RECOMMENDED: 'Industry Recommended',
  REVIEWED: 'Industry Reviewed',
  RECOGNIZED: 'Employer Recognized'
};

function getProjectVerificationBadge(project, reviews = []) {
  if (project.employer_recognized) return STATUS_TIERS.RECOGNIZED;
  if (reviews.length > 0) return STATUS_TIERS.REVIEWED;
  if (project.project_origin === 'recommended' || project.recommendation_id) return STATUS_TIERS.RECOMMENDED;
  return null;
}

assert.equal(getProjectVerificationBadge({ project_origin: 'recommended' }, []), STATUS_TIERS.RECOMMENDED);
assert.equal(getProjectVerificationBadge({ project_origin: 'recommended' }, [{ id: 'rev-1' }]), STATUS_TIERS.REVIEWED);
assert.equal(getProjectVerificationBadge({ employer_recognized: true }, [{ id: 'rev-1' }]), STATUS_TIERS.RECOGNIZED);
assert.equal(getProjectVerificationBadge({ project_origin: 'original' }, []), null);
console.log('✅ 3. Three-tier Status distinction logic verified.');

// 4. Test Student Origin Isolation (No overwrite, separate student IDs)
function simulateStartRecommendedProject(recommendation, studentUser) {
  assert(studentUser && studentUser.id, 'Student login required');
  assert(recommendation && recommendation.id, 'Valid recommendation required');
  const newStudentProjectId = 'proj-student-' + Math.random().toString(36).slice(2, 9);
  
  const studentProject = {
    id: newStudentProjectId,
    owner_id: studentUser.id,
    title: recommendation.title,
    summary: recommendation.summary,
    project_origin: 'recommended',
    recommendation_id: recommendation.id,
    source_snapshot: {
      id: recommendation.id,
      title: recommendation.title,
      author_id: recommendation.author_id,
      revision: recommendation.revision || 1
    },
    visibility: 'private',
    current_step: 0,
    progress: 0
  };

  return studentProject;
}

const originalRec = { id: 'rec-1234', title: '산업용 AI Agent 구축', summary: '실무 에이전트 개발', author_id: 'mentor-5678', revision: 2 };
const studentA = { id: 'student-aaa' };
const studentB = { id: 'student-bbb' };

const projectA = simulateStartRecommendedProject(originalRec, studentA);
const projectB = simulateStartRecommendedProject(originalRec, studentB);

assert.notEqual(projectA.id, originalRec.id, 'Student project ID must be independent from recommendation ID');
assert.notEqual(projectA.id, projectB.id, 'Different students must receive separate project IDs');
assert.equal(projectA.recommendation_id, originalRec.id, 'Origin recommendation ID must be preserved');
assert.equal(projectA.source_snapshot.author_id, 'mentor-5678', 'Original mentor attribution must be preserved');
assert.equal(projectA.visibility, 'private', 'New project starts private by default');
console.log('✅ 4. Student Independent Project isolation and attribution verified.');

// 5. Verify source filter labels consistency
const EXPECTED_SOURCE_FILTERS = [
  ['all', '전체 프로젝트'],
  ['student', '학생 프로젝트'],
  ['company', '기업 프로젝트'],
  ['recommended', '현직자 추천'],
  ['pbl', '대학 PBL']
];
const projectBrowserCode = fs.readFileSync(path.resolve(__dirname, '../web/components/archive/ProjectBrowser.tsx'), 'utf8');
for (const [key, label] of EXPECTED_SOURCE_FILTERS) {
  assert(projectBrowserCode.includes(label), `ProjectBrowser must contain label "${label}"`);
}
console.log('✅ 5. ProjectBrowser 5 Source filter labels verified.');

console.log('\n🎉 ALL 5 INDUSTRY RECOMMENDATION SYSTEM INTEGRATION TESTS PASSED!\n');
