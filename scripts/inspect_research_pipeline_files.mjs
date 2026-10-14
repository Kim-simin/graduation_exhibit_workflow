// scripts/inspect_research_pipeline_files.mjs
import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === '__pycache__' || file === 'node_modules' || file === '.git') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

console.log('--- Research Files ---');
const researchFiles = walk('research');
researchFiles.forEach(f => console.log(' ', f));

console.log('\n--- Admin Research APIs ---');
const adminApis = walk('admin/app/api/research');
adminApis.forEach(f => console.log(' ', f));

console.log('\n--- Admin Lib Research ---');
const adminLibs = ['admin/lib/research-node.ts'];
adminLibs.forEach(f => {
  if (fs.existsSync(f)) console.log(' ', f);
});
