import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function findFiles(dir, name) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let res = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !["node_modules", ".git", ".next"].includes(e.name)) {
      res.push(...findFiles(full, name));
    } else if (e.name === name) {
      res.push(path.relative(rootDir, full));
    }
  }
  return res;
}

console.log("Matching files for exhibition-gallery.tsx:", findFiles(rootDir, "exhibition-gallery.tsx"));
