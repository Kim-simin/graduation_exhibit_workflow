import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const rootC = path.join(rootDir, "data", "industry_challenges.json");
const rootP = path.join(rootDir, "data", "projects.json");

console.log("root data/projects.json exists:", fs.existsSync(rootP));
if (fs.existsSync(rootP)) {
  const p = JSON.parse(fs.readFileSync(rootP, "utf-8"));
  console.log("root projects count:", p.length);
}

console.log("root data/industry_challenges.json exists:", fs.existsSync(rootC));
if (fs.existsSync(rootC)) {
  const c = JSON.parse(fs.readFileSync(rootC, "utf-8"));
  console.log("root challenges count:", (c.challenges || []).length);
}
