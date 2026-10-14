// scripts/check_queue_for_targets.mjs
import fs from 'fs';

const queueFiles = [
  'data/university_queue.json',
  'my-exhibit-platform/data/university_queue.json',
  'web/data/published/exhibitions.json'
];

for (const qf of queueFiles) {
  if (fs.existsSync(qf)) {
    const data = JSON.parse(fs.readFileSync(qf, 'utf8'));
    const items = Array.isArray(data) ? data : (data.exhibitions || []);
    const found = items.filter(i => 
      i.id === 'UNIV-2025-서울여자대학교-산업디자인학과' || 
      i.id === 'UNIV-2025-세종대학교-디자인이노베이션전공-firstchase' ||
      (i.university?.includes('서울여') && i.department?.includes('산업디자인') && String(i.year).includes('2025')) ||
      (i.university?.includes('세종') && i.department?.includes('디자인이노베이션') && String(i.year).includes('2025'))
    );
    console.log(`[${qf}]: Total items ${items.length}, Found target matches: ${found.length}`);
    found.forEach(f => console.log(`  - ID: ${f.id}, Title: ${f.title || f.exhibition_title}, Artworks: ${f.artworks?.length || 0}`));
  } else {
    console.log(`[${qf}] NOT FOUND`);
  }
}
