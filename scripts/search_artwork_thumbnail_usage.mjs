// scripts/search_artwork_thumbnail_usage.mjs
import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.mjs')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = [...walk('web'), ...walk('admin')];
console.log(`Searching across ${files.length} source files...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('artworks') || content.includes('thumbnail') || content.includes('imagePath')) {
    const lines = content.split('\n');
    const matched = lines.map((l, i) => ({ line: i + 1, text: l.trim() })).filter(m => 
      m.text.includes('thumbnail') || m.text.includes('imagePath') || (m.text.includes('artworks') && m.text.includes('.map'))
    );
    if (matched.length > 0) {
      console.log(`\n[${file}]:`);
      matched.slice(0, 5).forEach(m => console.log(`  L${m.line}: ${m.text}`));
    }
  }
}
