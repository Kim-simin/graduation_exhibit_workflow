import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const file = path.join(rootDir, "web", "app", "mentoring", "projects", "[projectId]", "page.tsx");
const content = fs.readFileSync(file, "utf-8");
const lines = content.split("\n");
lines.forEach((line, i) => {
  if (/demo/i.test(line)) {
    console.log(`L${i+1}: ${line.trim()}`);
  }
});
