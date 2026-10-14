import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const webRequire = createRequire(path.join(rootDir, "web", "package.json"));

const envPath = path.join(rootDir, "web", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
let supabaseUrl = "";
let supabaseKey = "";

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
    supabaseUrl = trimmed.split("=")[1].trim();
  }
  if (
    trimmed.startsWith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=") ||
    (!supabaseKey && trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY="))
  ) {
    supabaseKey = trimmed.split("=")[1].trim();
  }
}

const { createClient } = webRequire("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.from("mentor_feedbacks").select("*").limit(1);
  if (error) {
    console.error("SELECT error:", error);
    return;
  }
  if (data && data[0]) {
    console.log("Column keys present in row 0:", Object.keys(data[0]));
  } else {
    console.log("No rows found. Let's inspect column insert behavior.");
  }
}

checkColumns();
