import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function grepRecursive(dir, text) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let res = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!["node_modules", ".git", ".next"].includes(e.name)) {
        res.push(...grepRecursive(full, text));
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) {
      try {
        const c = fs.readFileSync(full, "utf-8");
        if (c.includes(text)) {
          res.push(path.relative(rootDir, full));
        }
      } catch (err) {}
    }
  }
  return res;
}

console.log("Files containing '대학생 보기':", grepRecursive(rootDir, "대학생 보기"));
