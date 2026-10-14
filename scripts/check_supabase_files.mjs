import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const supabaseDir = path.join(rootDir, "web", "lib", "supabase");
if (fs.existsSync(supabaseDir)) {
  console.log("web/lib/supabase contains:", fs.readdirSync(supabaseDir));
} else {
  console.log("web/lib/supabase does not exist");
}

const adminSupabaseDir = path.join(rootDir, "admin", "lib", "supabase");
if (fs.existsSync(adminSupabaseDir)) {
  console.log("admin/lib/supabase contains:", fs.readdirSync(adminSupabaseDir));
} else {
  console.log("admin/lib/supabase does not exist");
}
