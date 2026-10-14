import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const { createClient } = require(path.join(rootDir, "web", "node_modules", "@supabase", "supabase-js"));

const envPath = path.join(rootDir, "web", ".env.local");
let supabaseUrl = "";
let supabaseKey = "";

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const l of lines) {
    if (l.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = l.split("=")[1].trim();
    } else if (l.startsWith("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=") || l.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      supabaseKey = l.split("=")[1].trim();
    }
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.log("No Supabase env found in .env.local");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  const tables = ["projects", "user_projects", "mentor_feedbacks", "project_connections"];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t}: Error -> ${error.message} (${error.code})`);
    } else {
      console.log(`Table ${t}: Accessible! rows: ${data.length}`);
    }
  }
}

testTables();
