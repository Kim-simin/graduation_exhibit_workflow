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

async function inspectDb() {
  console.log("==================================================");
  console.log("   INSPECTING SUPABASE mentor_feedbacks ROWS");
  console.log("==================================================");

  const { data, error } = await supabase
    .from("mentor_feedbacks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 조회 에러:", error);
    return;
  }

  console.log(`총 레코드 개수: ${data.length}개`);
  data.forEach((row, i) => {
    console.log(`\n[#${i + 1}] ID: ${row.id}`);
    console.log(`  project_id: "${row.project_id}"`);
    console.log(`  mentor_name: "${row.mentor_name}"`);
    console.log(`  content: "${row.content}"`);
    console.log(`  comment: "${row.comment}"`);
    console.log(`  created_at: "${row.created_at}"`);
  });
}

inspectDb();
