import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const adminChallPath = path.join(rootDir, "admin", "data", "industry_challenges.json");
const webPubChallPath = path.join(rootDir, "web", "data", "published", "industry_challenges.json");

const adminChall = JSON.parse(fs.readFileSync(adminChallPath, "utf-8"));
const webChall = JSON.parse(fs.readFileSync(webPubChallPath, "utf-8"));

console.log("admin challenges count:", (adminChall.challenges || []).length);
console.log("web published challenges count:", (webChall.challenges || []).length);
