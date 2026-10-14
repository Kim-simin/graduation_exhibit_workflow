import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetTerms = [
  "SAMPLE_PROJECTS",
  "mockProjects",
  "placeholderProjects",
  "generateDummyProjects",
  "generateProjects",
  "generateMock",
  "ENABLE_MOCK_DATA",
  "default-project-image",
  "isDemo",
  "demo",
];

function searchRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", ".git", "dist", "build"].includes(entry.name)) {
        results.push(...searchRecursive(full));
      }
    } else if (/\.(ts|tsx|js|mjs|json)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(full, "utf-8");
        for (const t of targetTerms) {
          if (content.toLowerCase().includes(t.toLowerCase())) {
            results.push({ file: path.relative(rootDir, full), term: t });
          }
        }
      } catch (e) {}
    }
  }
  return results;
}

const res = searchRecursive(rootDir);
console.log(`Found ${res.length} matches:`);
res.forEach(r => console.log(`  ${r.file} -> ${r.term}`));
