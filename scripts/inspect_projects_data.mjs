import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const webProjectsPath = path.join(rootDir, "web", "data", "published", "projects.json");
const webChallengesPath = path.join(rootDir, "web", "data", "published", "industry_challenges.json");

const projects = JSON.parse(fs.readFileSync(webProjectsPath, "utf-8"));
const challengesData = JSON.parse(fs.readFileSync(webChallengesPath, "utf-8"));
const challenges = challengesData.challenges || [];

console.log(`[web] projects.json count: ${projects.length}`);
projects.forEach((p, i) => {
  console.log(`  ${i + 1}. [${p.id}] ${p.title} (${p.university || "No univ"})`);
});

console.log(`\n[web] industry_challenges count: ${challenges.length}`);
challenges.forEach((c, i) => {
  console.log(`  ${i + 1}. [${c.id}] ${c.title} (${c.providerName || "No provider"})`);
});

console.log(`\nTotal verified published: ${projects.length + challenges.length}`);
