// scripts/sync_published_file.mjs
import fs from 'fs';
import path from 'path';

const src = 'web/data/published/exhibitions.json';
const dst = 'data/published/exhibitions.json';

os: {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log(`Synced ${src} to ${dst} (Size: ${fs.statSync(dst).size} bytes)`);
}
