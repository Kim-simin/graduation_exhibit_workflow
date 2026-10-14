import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

for (const p of ["web/components/exhibition-gallery.tsx", "admin/components/exhibition-gallery.tsx"]) {
  const full = path.join(rootDir, p);
  const lines = fs.readFileSync(full, "utf-8").split("\n");
  lines.forEach((l, idx) => {
    if (l.includes("대학생 보기")) {
      console.log(`[${p}] Line ${idx + 1}: ${l.trim()}`);
      console.log("Context:");
      for (let j = Math.max(0, idx - 5); j <= Math.min(lines.length - 1, idx + 5); j++) {
        console.log(`  ${j + 1}: ${lines[j]}`);
      }
    }
  });
}
