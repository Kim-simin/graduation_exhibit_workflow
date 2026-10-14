import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const adminProjectsPath = path.join(rootDir, "admin", "data", "projects.json");
const adminChallengesPath = path.join(rootDir, "admin", "data", "industry_challenges.json");

if (fs.existsSync(adminProjectsPath)) {
  const p = JSON.parse(fs.readFileSync(adminProjectsPath, "utf-8"));
  console.log(`admin projects.json count: ${p.length}`);
} else {
  console.log("admin projects.json does not exist");
}

if (fs.existsSync(adminChallengesPath)) {
  const c = JSON.parse(fs.readFileSync(adminChallengesPath, "utf-8"));
  console.log(`admin industry_challenges.json count: ${(c.challenges || []).length}`);
} else {
  console.log("admin industry_challenges.json does not exist");
}
