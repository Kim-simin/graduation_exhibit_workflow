import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const webProjectTs = fs.readFileSync(path.join(rootDir, "web", "lib", "project.ts"), "utf-8").split("\n");
const adminProjectTs = fs.readFileSync(path.join(rootDir, "admin", "lib", "project.ts"), "utf-8").split("\n");

console.log(`web lines: ${webProjectTs.length}, admin lines: ${adminProjectTs.length}`);
for (let i = 0; i < Math.max(webProjectTs.length, adminProjectTs.length); i++) {
  const w = webProjectTs[i] || "";
  const a = adminProjectTs[i] || "";
  if (w.trim() !== a.trim()) {
    console.log(`Line ${i + 1}:\n  web:   ${w.trim()}\n  admin: ${a.trim()}`);
    if (i > 15) break; // just see the first few differences
  }
}
