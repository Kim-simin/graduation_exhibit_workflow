import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const myExhibitPath = path.join(rootDir, "my-exhibit-platform");
console.log("my-exhibit-platform exists:", fs.existsSync(myExhibitPath));
if (fs.existsSync(myExhibitPath)) {
  const mentoringPage = path.join(myExhibitPath, "app", "mentoring", "page.tsx");
  console.log("my-exhibit-platform mentoring page exists:", fs.existsSync(mentoringPage));
  const projectLib = path.join(myExhibitPath, "lib", "project.ts");
  console.log("my-exhibit-platform project lib exists:", fs.existsSync(projectLib));
}
