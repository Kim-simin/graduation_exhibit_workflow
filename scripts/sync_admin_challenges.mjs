import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const adminChallPath = path.join(rootDir, "admin", "data", "industry_challenges.json");
const webChallPath = path.join(rootDir, "web", "data", "published", "industry_challenges.json");

const adminData = JSON.parse(fs.readFileSync(adminChallPath, "utf-8"));
const webData = JSON.parse(fs.readFileSync(webChallPath, "utf-8"));

console.log("admin challenges before:", adminData.challenges.length);
console.log("web challenges:", webData.challenges.length);

adminData.parentChallenges = webData.parentChallenges;
adminData.challenges = webData.challenges;

fs.writeFileSync(adminChallPath, JSON.stringify(adminData, null, 2), "utf-8");
console.log("admin challenges after sync:", adminData.challenges.length);
