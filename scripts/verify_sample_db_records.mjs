// scripts/verify_sample_db_records.mjs
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('web/data/exhibitions.json', 'utf8'));
const swu = data.find(e => e.id === 'UNIV-2025-서울여자대학교-산업디자인학과');
const sejong = data.find(e => e.id === 'UNIV-2025-세종대학교-디자인이노베이션전공-firstchase');

console.log('--- SWU Sample Artwork 0 ---');
console.log(JSON.stringify(swu.artworks[0], null, 2));

console.log('\n--- Sejong Sample Artwork 0 ---');
console.log(JSON.stringify(sejong.artworks[0], null, 2));
