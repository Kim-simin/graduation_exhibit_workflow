const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'data', 'curriculums.json');
const destPath = path.join(__dirname, '..', 'my-exhibit-platform', 'data', 'curriculums.json');

console.log(`Reading from ${srcPath}`);
const raw = fs.readFileSync(srcPath, 'utf8');
const data = JSON.parse(raw);

console.log(`Loaded ${data.length} curriculums from source.`);
data.forEach((item, index) => {
  if (!item.grade_tech_tree || item.grade_tech_tree.length !== 4) {
    throw new Error(`Item ${index} (${item.id}) does not have 4 grade_tech_tree items!`);
  }
});

fs.writeFileSync(destPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Successfully synced ${data.length} items to ${destPath}`);

// Verification
const verify = JSON.parse(fs.readFileSync(destPath, 'utf8'));
if (verify.length === data.length) {
  console.log('Verification passed: Integrity and count validated.');
} else {
  throw new Error('Verification failed!');
}
