import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const p1 = path.join(rootDir, "web", "data", "industry_challenges.json");
const p2 = path.join(rootDir, "web", "data", "published", "industry_challenges.json");

console.log("web/data/industry_challenges.json exists:", fs.existsSync(p1));
console.log("web/data/published/industry_challenges.json exists:", fs.existsSync(p2));
if (fs.existsSync(p1)) {
  const c = JSON.parse(fs.readFileSync(p1, "utf-8"));
  console.log("web/data challenges:", (c.challenges || []).length);
}
if (fs.existsSync(p2)) {
  const c = JSON.parse(fs.readFileSync(p2, "utf-8"));
  console.log("web/data/published challenges:", (c.challenges || []).length);
}
