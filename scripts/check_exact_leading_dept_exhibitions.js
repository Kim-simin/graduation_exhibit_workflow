const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '..', 'data', 'leading_departments_master.json');
const queuePath = path.join(__dirname, '..', 'data', 'university_queue.json');

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

console.log("=== 선도학과의 선도학과 졸업전시 카드 매칭 정밀 검사 ===\n");

const matchedList = [];
const missingList = [];

master.forEach((catGroup) => {
  catGroup.universities.forEach((target) => {
    // Look for exact or closely matching exhibition card in queue
    // Must match university AND department/category
    const targetUniv = target.university;
    const defaultDept = target.default_dept;
    const category = catGroup.category;

    // Check all queue items
    const matches = queue.filter((item) => {
      const matchUniv = item.university.includes(targetUniv) || targetUniv.includes(item.university);
      if (!matchUniv) return false;

      // Check department relevance
      const deptWords = defaultDept.replace(/[\/\(\)]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
      const matchDept = deptWords.some(w => item.department.includes(w) || item.title.includes(w));
      
      // Also check category
      const matchCat = item.category && (
        category.includes(item.category) ||
        item.category.includes(category.split(' ')[0])
      );

      return matchDept || matchCat;
    });

    const researched = matches.filter(m => m.isResearched);

    if (researched.length > 0) {
      matchedList.push({
        category,
        university: targetUniv,
        targetDept: defaultDept,
        matchedCards: researched.map(r => `${r.department} (ID: ${r.id}, 작품: ${r.artworks ? r.artworks.length : 0}개)`)
      });
    } else {
      missingList.push({
        category,
        university: targetUniv,
        targetDept: defaultDept,
        hasPending: matches.length > 0
      });
    }
  });
});

console.log(`[1. 선도학과 졸업전시 카드가 등록되어 있는 선도학과 (${matchedList.length}건)]`);
matchedList.forEach(m => {
  console.log(`- [${m.category}] ${m.university} (${m.targetDept}): ${m.matchedCards.join(', ')}`);
});

console.log(`\n[2. 선도학과 졸업전시 카드가 없는 선도학과 (${missingList.length}건)]`);
missingList.forEach(m => {
  console.log(`- [${m.category}] ${m.university} (${m.targetDept}) ${m.hasPending ? '[대기열에만 있음]' : '[완전 미등록]'}`);
});
