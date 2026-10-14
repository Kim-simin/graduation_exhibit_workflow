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

async function testRealInsert() {
  const targetProjectId = "proj-grad-exhibit-platform";
  console.log(`Testing insert for real projectId: "${targetProjectId}"`);

  const payload = {
    project_id: targetProjectId,
    mentor_id: "men-user",
    mentor_name: "현직자 멘토 (테스트)",
    mentor_role: "현업 R&D 전문가",
    mentor_company: "산학협력 파트너사",
    is_verified_mentor: true,
    feedback_type: "현업 적합성",
    content: "전국 대학 졸업작품 및 산학 연계 플랫폼의 데이터 파이프라인이 훌륭합니다.",
    comment: "전국 대학 졸업작품 및 산학 연계 플랫폼의 데이터 파이프라인이 훌륭합니다.",
    is_public: true,
  };

  const { data, error } = await supabase
    .from("mentor_feedbacks")
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error("❌ INSERT Error:", error);
    return;
  }

  console.log("✅ INSERT Success! Created ID:", data.id);

  // Now test SELECT for this project_id
  const { data: readData, error: readError } = await supabase
    .from("mentor_feedbacks")
    .select("*")
    .eq("project_id", targetProjectId)
    .order("created_at", { ascending: false });

  if (readError) {
    console.error("❌ SELECT Error:", readError);
    return;
  }

  console.log(`✅ SELECT Success! Found ${readData.length} feedbacks for "${targetProjectId}":`);
  readData.forEach((fb, idx) => {
    console.log(`  [${idx + 1}] ID: ${fb.id} | Mentor: ${fb.mentor_name} | Content: ${fb.content || fb.comment}`);
  });
}

testRealInsert();
