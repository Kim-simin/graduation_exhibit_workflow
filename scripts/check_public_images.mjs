import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const webPub = path.join(rootDir, "web", "public");
const adminPub = path.join(rootDir, "admin", "public");

console.log("web/public exists:", fs.existsSync(webPub));
if (fs.existsSync(webPub)) {
  console.log("web/public files:", fs.readdirSync(webPub));
}

console.log("admin/public exists:", fs.existsSync(adminPub));
if (fs.existsSync(adminPub)) {
  console.log("admin/public files:", fs.readdirSync(adminPub));
}
