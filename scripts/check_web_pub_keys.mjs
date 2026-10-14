import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const webChall = JSON.parse(fs.readFileSync(path.join(rootDir, "web", "data", "published", "industry_challenges.json"), "utf-8"));
console.log("Keys in web published industry_challenges.json:", Object.keys(webChall));
console.log("Challenges length:", webChall.challenges?.length);
console.log("MajorCategories length:", webChall.majorCategories?.length);
console.log("ParentChallenges length:", webChall.parentChallenges?.length);
