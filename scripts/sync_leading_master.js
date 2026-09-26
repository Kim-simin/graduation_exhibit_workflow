const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'data', 'leading_departments_master.json');
const destPath = path.join(__dirname, '..', 'my-exhibit-platform', 'data', 'leading_departments_master.json');

console.log(`Reading from ${srcPath}`);
const raw = fs.readFileSync(srcPath, 'utf8');
const data = JSON.parse(raw);

console.log(`Loaded ${data.length} categories from source.`);
let totalUnivs = 0;
data.forEach((cat) => {
  if (!cat.id || !cat.category || !Array.isArray(cat.universities)) {
    throw new Error(`Category ${cat.category} is missing required fields`);
  }
  totalUnivs += cat.universities.length;
});

console.log(`Total target universities across all categories: ${totalUnivs}`);
fs.writeFileSync(destPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully synced to ${destPath}`);
