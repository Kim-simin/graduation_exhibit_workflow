import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function grepInDir(dir, searchTerms) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        results.push(...grepInDir(full, searchTerms));
      }
    } else if (/\.(ts|tsx|js|mjs|json)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(full, "utf-8");
        for (const term of searchTerms) {
          if (content.includes(term)) {
            results.push({ file: path.relative(rootDir, full), term });
            break;
          }
        }
      } catch (e) {}
    }
  }
  return results;
}

const terms = ["mentor_feedbacks", "project_connections", "getProjects", "getStudentProjects", "projects.json"];
const found = [
  ...grepInDir(path.join(rootDir, "web"), terms),
  ...grepInDir(path.join(rootDir, "admin"), terms),
];

console.log("Matched files:", found);
