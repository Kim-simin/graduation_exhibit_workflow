import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const pagesToCheck = [
  "web/app/page.tsx",
  "web/app/industry-challenges/page.tsx",
  "web/app/mentoring/page.tsx",
  "web/app/mentoring/[id]/page.tsx",
  "web/app/mentoring/projects/[projectId]/page.tsx",
  "admin/app/(public)/page.tsx",
  "admin/app/(public)/industry-challenges/page.tsx",
  "admin/app/(public)/mentoring/page.tsx",
  "admin/app/(public)/mentoring/[id]/page.tsx",
  "admin/app/(public)/mentoring/projects/[projectId]/page.tsx",
];

for (const rel of pagesToCheck) {
  const full = path.join(rootDir, rel);
  if (fs.existsSync(full)) {
    const content = fs.readFileSync(full, "utf-8");
    console.log(`\n=== Checking ${rel} ===`);
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (/getProjects|challenges|projects|sample|dummy|mock|Array\.from|Math\.random/i.test(line)) {
        if (!line.includes("lucide-react") && !line.includes("className=")) {
          console.log(`  L${idx + 1}: ${line.trim()}`);
        }
      }
    });
  }
}
