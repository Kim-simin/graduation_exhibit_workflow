const fs = require('fs');
const path = require('path');

const masterPath = path.join(__dirname, '..', 'data', 'leading_departments_master.json');
const queuePath = path.join(__dirname, '..', 'data', 'university_queue.json');

const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

// Extract all unique leading universities
const leadingUnivMap = new Map(); // univName -> Array of categories/departments
master.forEach((cat) => {
  cat.universities.forEach((u) => {
    if (!leadingUnivMap.has(u.university)) {
      leadingUnivMap.set(u.university, []);
    }
    leadingUnivMap.get(u.university).push({
      category: cat.category,
      default_dept: u.default_dept,
      sub_track: u.sub_track
    });
  });
});

console.log(`=== 총 ${leadingUnivMap.size}개 지정 선도대학교 분석 ===\n`);

const completedExhibits = queue.filter(e => e.isResearched && e.artworks && e.artworks.length > 0);
console.log(`현재 전체 전시 카드: ${queue.length}개 (완성된 연구 전시: ${completedExhibits.length}개)\n`);

const hasExhibition = [];
const missingExhibition = [];

for (const [univ, deptList] of leadingUnivMap.entries()) {
  const matchingCards = queue.filter(e => e.university.includes(univ) || univ.includes(e.university));
  const researchedCards = matchingCards.filter(e => e.isResearched);

  if (researchedCards.length > 0) {
    hasExhibition.push({
      university: univ,
      count: researchedCards.length,
      departments: researchedCards.map(c => `${c.department} (${c.year}년, 작품 ${c.artworks ? c.artworks.length : 0}개)`)
    });
  } else if (matchingCards.length > 0) {
    missingExhibition.push({
      university: univ,
      status: "PENDING_IN_QUEUE", // 대기열에 등록만 되어있고 리서치 미완료
      targetCategories: deptList
    });
  } else {
    missingExhibition.push({
      university: univ,
      status: "COMPLETELY_MISSING", // 아예 대기열에도 없음
      targetCategories: deptList
    });
  }
}

console.log(`[1. 현재 졸업전시 카드가 등록되어 있는 선도대학 (${hasExhibition.length}개교)]`);
hasExhibition.forEach(h => {
  console.log(`- ${h.university} (${h.count}건): ${h.departments.join(', ')}`);
});

console.log(`\n[2. 현재 졸업전시 카드가 없는 선도대학 (${missingExhibition.length}개교)]`);
missingExhibition.forEach(m => {
  const cats = m.targetCategories.map(c => c.category).join(', ');
  console.log(`- ${m.university} [${m.status === 'PENDING_IN_QUEUE' ? '대기열 수집대기' : '미등록'}] (해당 선도분야: ${cats})`);
});
