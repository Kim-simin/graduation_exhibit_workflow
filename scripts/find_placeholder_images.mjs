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
    } else if (e.name.includes(name)) {
      res.push(full);
    }
  }
  return res;
}

console.log("Files matching image:", findFiles(rootDir, "default-project"));
console.log("Files matching placeholder:", findFiles(rootDir, "placeholder"));
