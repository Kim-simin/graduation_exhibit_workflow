// scripts/check_artwork_images_on_disk.mjs
import fs from 'fs';
import path from 'path';

const targets = [
  'UNIV-2025-서울여자대학교-산업디자인학과',
  'UNIV-2025-세종대학교-디자인이노베이션전공'
];

const candidateBases = [
  'web/public',
  'admin/public',
  'public',
  'my-exhibit-platform/public',
  'data/uploads'
];

for (const target of targets) {
  console.log(`\n=== Target: ${target} ===`);
  for (const base of candidateBases) {
    const full = path.join(base, 'uploads', target);
    if (fs.existsSync(full)) {
      const files = fs.readdirSync(full);
      console.log(`Found in [${full}]: ${files.length} files`);
      console.log(`First 5 files:`, files.slice(0, 5));
    } else {
      // also check without 'uploads'
      const direct = path.join(base, target);
      if (fs.existsSync(direct)) {
        console.log(`Found in [${direct}]: ${fs.readdirSync(direct).length} files`);
      }
    }
  }
}
