import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetDirs = [
  path.join(rootDir, "web", "lib"),
  path.join(rootDir, "web", "app"),
  path.join(rootDir, "web", "components"),
  path.join(rootDir, "admin", "lib"),
  path.join(rootDir, "admin", "app"),
  path.join(rootDir, "admin", "components"),
];

const keywords = [
  "dummy",
  "mock",
  "sample",
  "placeholderprojects",
  "mockprojects",
  "sampleprojects",
  "generateprojects",
  "generatedummy",
  "generatemock",
  "math.random",
  "array.from({ length",
  "array.from({length",
  "array(10)",
  "array(12)",
  "array(20)",
];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        results.push(...scanDir(fullPath));
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = targetDirs.flatMap(scanDir);
console.log(`Scanning ${allFiles.length} source files for dummy generation patterns...`);

const matches = [];

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  lines.forEach((line, lineNum) => {
    const lower = line.toLowerCase();
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matches.push({
          file: path.relative(rootDir, filePath),
          line: lineNum + 1,
          keyword: kw,
          text: line.trim(),
        });
        break;
      }
    }
  });
}

console.log(`Found ${matches.length} matches:`);
matches.forEach((m) => {
  console.log(`[${m.file}:${m.line}] (${m.keyword}) -> ${m.text.substring(0, 100)}`);
});
