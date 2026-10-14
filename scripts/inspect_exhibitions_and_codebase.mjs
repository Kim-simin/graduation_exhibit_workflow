// scripts/inspect_exhibitions_and_codebase.mjs
import fs from 'fs';
import path from 'path';

console.log('--- Inspecting Codebase for Exhibitions and Research Pipeline ---');

const candidateDirs = [
  'web/data',
  'data',
  'admin/data',
  'my-exhibit-platform/data',
  'research',
  'content_graph',
  'generation_graph'
];

for (const dir of candidateDirs) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    console.log(`Directory [${dir}] has ${files.length} items:`, files.slice(0, 15));
  } else {
    console.log(`Directory [${dir}] DOES NOT EXIST`);
  }
}
