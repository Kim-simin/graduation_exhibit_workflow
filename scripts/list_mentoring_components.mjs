import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function listDirFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(f => path.join(dir, f));
}

console.log("web/components/mentoring:", listDirFiles(path.join(rootDir, "web", "components", "mentoring")));
console.log("admin/components/mentoring:", listDirFiles(path.join(rootDir, "admin", "components", "mentoring")));
