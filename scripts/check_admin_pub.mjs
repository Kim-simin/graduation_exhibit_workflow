import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const pubP = path.join(rootDir, "admin", "data", "published", "projects.json");
const pubC = path.join(rootDir, "admin", "data", "published", "industry_challenges.json");

console.log("admin/data/published/projects.json exists:", fs.existsSync(pubP));
console.log("admin/data/published/industry_challenges.json exists:", fs.existsSync(pubC));
if (fs.existsSync(pubC)) {
  const c = JSON.parse(fs.readFileSync(pubC, "utf-8"));
  console.log("published challenges in admin:", (c.challenges || []).length);
}
