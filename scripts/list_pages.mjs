import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function findPages(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next") {
        results.push(...findPages(full));
      }
    } else if (entry.name === "page.tsx") {
      results.push(path.relative(rootDir, full));
    }
  }
  return results;
}

console.log("Pages in web:", findPages(path.join(rootDir, "web", "app")));
console.log("Pages in admin:", findPages(path.join(rootDir, "admin", "app")));
