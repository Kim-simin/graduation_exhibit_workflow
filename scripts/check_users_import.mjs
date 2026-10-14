import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const file = path.join(rootDir, "admin", "components", "exhibition-gallery.tsx");
const content = fs.readFileSync(file, "utf-8");
console.log("Does admin exhibition-gallery.tsx import Users?", content.includes("Users,") || content.includes(", Users") || content.includes("{ Users }"));
console.log("How many times is Users mentioned in file?", (content.match(/Users/g) || []).length);
