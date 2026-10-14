// scripts/find_target_exhibitions.mjs
import fs from 'fs';
import path from 'path';

console.log('--- Finding Target Exhibitions: Seoul Women Univ & Sejong Univ ---');

const filesToInspect = [
  'web/data/exhibitions.json',
  'data/exhibitions.json',
  'admin/data/exhibitions_all.json',
  'my-exhibit-platform/data/exhibitions.json'
];

for (const f of filesToInspect) {
  if (!fs.existsSync(f)) {
    console.log(`[${f}] NOT FOUND`);
    continue;
  }
  const content = JSON.parse(fs.readFileSync(f, 'utf8'));
  const list = Array.isArray(content) ? content : (content.exhibitions || []);
  console.log(`\n=== File: ${f} (Total exhibitions: ${list.length}) ===`);
  
  const swu = list.filter(e => {
    const uni = (e.university || '').replace(/\s+/g, '');
    const dept = (e.department || '').replace(/\s+/g, '');
    const yr = String(e.year || e.exhibition_year || '');
    return uni.includes('서울여') && (dept.includes('산업디자인') || dept.includes('산디')) && yr.includes('2025');
  });

  const sejong = list.filter(e => {
    const uni = (e.university || '').replace(/\s+/g, '');
    const dept = (e.department || '').replace(/\s+/g, '');
    const yr = String(e.year || e.exhibition_year || '');
    return uni.includes('세종') && (dept.includes('디자인이노베이션') || dept.includes('디자인')) && yr.includes('2025');
  });

  console.log(`Found SWU 2025 Industrial Design: ${swu.length}`);
  swu.forEach(e => {
    console.log(` - ID: ${e.id}, Title: ${e.title}, Dept: ${e.department}, Artworks: ${e.artworks?.length || 0}`);
    if (e.artworks && e.artworks.length > 0) {
      console.log(`   Sample artwork 0:`, {
        title: e.artworks[0].title,
        author: e.artworks[0].author,
        imagePath: e.artworks[0].imagePath || e.artworks[0].image,
        thumbnail: e.artworks[0].thumbnail
      });
    }
  });

  console.log(`Found Sejong 2025 Design Innovation: ${sejong.length}`);
  sejong.forEach(e => {
    console.log(` - ID: ${e.id}, Title: ${e.title}, Dept: ${e.department}, Artworks: ${e.artworks?.length || 0}`);
    if (e.artworks && e.artworks.length > 0) {
      console.log(`   Sample artwork 0:`, {
        title: e.artworks[0].title,
        author: e.artworks[0].author,
        imagePath: e.artworks[0].imagePath || e.artworks[0].image,
        thumbnail: e.artworks[0].thumbnail
      });
    }
  });
}
