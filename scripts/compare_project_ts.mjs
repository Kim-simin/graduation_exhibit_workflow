import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const webProjectTs = fs.readFileSync(path.join(rootDir, "web", "lib", "project.ts"), "utf-8");
const adminProjectTs = fs.readFileSync(path.join(rootDir, "admin", "lib", "project.ts"), "utf-8");

console.log("web/lib/project.ts === admin/lib/project.ts ?", webProjectTs === adminProjectTs);
if (webProjectTs !== adminProjectTs) {
  console.log("web length:", webProjectTs.length, "admin length:", adminProjectTs.length);
}
