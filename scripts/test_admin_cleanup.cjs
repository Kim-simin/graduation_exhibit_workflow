// Run the actual admin loaders and ensure removed records cannot return via legacy sync.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const admin = path.join(root, 'admin');
const requireAdmin = createRequire(path.join(admin, 'package.json'));
const ts = requireAdmin('typescript');
const cache = new Map();
function load(id) {
  if (!id.startsWith('@/')) return requireAdmin(id);
  const base = path.join(admin, id.slice(2));
  const file = base + (id.endsWith('.json') ? '' : fs.existsSync(base + '.tsx') ? '.tsx' : '.ts');
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  if (file.endsWith('.json')) module.exports = JSON.parse(fs.readFileSync(file, 'utf8'));
  else {
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = request => request.startsWith('.')
      ? load('@/' + path.relative(admin, path.resolve(path.dirname(file), request)).split(path.sep).join('/'))
      : load(request);
    vm.runInThisContext(`(function(exports, require, module) {${code}\n})`, { filename: file })(module.exports, localRequire, module);
  }
  return module.exports;
}
const manifest = load('@/data/removed_demo_content.json');
const { withoutRemovedContent } = load('@/lib/content-removals');
for (const [group, entries] of Object.entries(manifest)) {
  assert.deepEqual(withoutRemovedContent(group, entries), [], `${group}: sync resurrection blocked`);
  assert.equal(withoutRemovedContent(group, [{ id: 'future-genuine-record' }]).length, 1, 'Unrelated records preserved');
}
const data = load('@/lib/data');
assert.equal(data.getStudents().length, 0);
assert.equal(data.getStudentById('stu-01'), undefined);
const challenges = load('@/lib/challenge');
assert.equal(challenges.getChallenges().length, 0);
assert.equal(challenges.getParentChallenges().length, 0);
assert.equal(challenges.getChallengeById('challenge-shipbuilding-llm'), undefined);
assert.equal(challenges.getMajorCategories().length, 14);
const opportunities = load('@/lib/opportunity');
assert.ok(opportunities.getOpportunities().length >= 8, 'Retained records are not removed when real notices are added');
assert.equal(opportunities.getEquipments().length, 0);
assert.equal(opportunities.getOpportunityById('opp_ks_2026_svc_seoul'), undefined);
for (const opportunity of opportunities.getOpportunities()) {
  assert.equal(opportunity.benefits.length, 0, 'Unverified reward details removed');
  if (opportunity.id.includes('multidisciplinary')) assert.equal(opportunity.status, 'CLOSED', 'Closed notice must not appear open');
  if (!opportunity.studentEligibilityVerified) assert.ok(['needs_review', 'excluded'].includes(opportunity.eligibilityStatus));
}
const notices = opportunities.getOpportunities('2026-10-04T12:00:00+09:00');
const company = notices.find(item => item.id === 'opp_inu_ax_company_proposals_2026_2');
assert.equal(company.status, 'OPEN');
assert.equal(opportunities.isStudentEligibleOpportunity(company), false);
assert.equal(company.applicantType, 'company');
assert.equal(notices.find(item => item.id === 'opp_pnu_capstone_2026_2_partner').status, 'UPCOMING');
assert.equal(notices.find(item => item.id === 'opp_pnu_capstone_2026_2_general').status, 'OPEN');
assert.equal(notices.find(item => item.id === 'opp_hanyang_erica_capstone_2026_2').status, 'CLOSED');
assert.equal(notices.find(item => item.id === 'opp_inje_biomedical_company_pbl_2026').approvalStatus, 'PENDING_REVIEW');
const later = opportunities.getOpportunities('2026-10-20T12:00:00+09:00');
assert.equal(later.find(item => item.id === 'opp_pnu_capstone_2026_2_partner').status, 'CLOSED', 'Deadline must update without another import');
const React = requireAdmin('react');
const { renderToStaticMarkup } = requireAdmin('react-dom/server');
const component = load('@/components/challenge/OfficialIndustryNotices').default;
const html = renderToStaticMarkup(React.createElement(component));
assert.ok(html.includes('기업·기관 신청'));
assert.ok(html.includes('공식 공고 보기'));
assert.ok(!html.includes('인제대학교'), 'Pending listing-only evidence must not be shown as verified');
console.log('PASS: actual admin loaders and rendered official-notice component; eligibility separation, deadlines, retained records and demo suppression.');
