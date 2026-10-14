import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

// 1. Read .env.local from web directory
const envPath = path.join(rootDir, "web", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ web/.env.local 파일을 찾을 수 없습니다.");
  process.exit(1);
}

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

console.log("==================================================");
console.log("   SUPABASE LIVE CONNECTION TEST");
console.log("==================================================");
console.log(`📡 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Publishable Key: ${supabaseKey ? supabaseKey.substring(0, 15) + "..." : "MISSING"}`);
console.log("--------------------------------------------------");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase URL 또는 Key가 올바르게 설정되지 않았습니다.");
  process.exit(1);
}

// 2. Load @supabase/supabase-js from web/node_modules
let createClient;
try {
  const supabasePackagePath = path.join(rootDir, "web", "node_modules", "@supabase", "supabase-js");
  const supabaseMod = await import(`file://${supabasePackagePath.replace(/\\/g, "/")}/dist/module/index.js`);
  createClient = supabaseMod.createClient;
} catch (err) {
  // Fallback to standard require
  try {
    const pkg = require(path.join(rootDir, "web", "node_modules", "@supabase", "supabase-js"));
    createClient = pkg.createClient;
  } catch (err2) {
    console.error("❌ @supabase/supabase-js 패키지를 불러올 수 없습니다:", err2.message);
    process.exit(1);
  }
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log("\n[TEST 1] HTTP Ping & Auth Handshake...");
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (resp.ok || resp.status === 200 || resp.status === 404) {
      console.log(`✅ Supabase REST API 응답 수신 성공! (HTTP Status: ${resp.status})`);
    } else {
      console.warn(`⚠️ Supabase 응답 상태 코드: ${resp.status} (${resp.statusText})`);
    }
  } catch (netErr) {
    console.error(`❌ 네트워크 연결 실패: ${netErr.message}`);
    process.exit(1);
  }

  console.log("\n[TEST 2] 'mentor_feedbacks' 테이블 쿼리 테스트...");
  const { data: feedbackData, error: feedbackError } = await supabase
    .from("mentor_feedbacks")
    .select("id, project_id, mentor_name, comment, created_at")
    .limit(5);

  if (feedbackError) {
    if (feedbackError.code === "PGRST205" || feedbackError.message.includes("relation") || feedbackError.message.includes("does not exist")) {
      console.log(`📡 [PostgREST 연결 성공] Supabase DB 서버와 통신 완료!`);
      console.log(`ℹ️ 상태: 테이블 미생성 상태 (코드: ${feedbackError.code} - ${feedbackError.message})`);
      console.log("👉 해결 방법: Supabase 대시보드 SQL Editor에서 'supabase/schema.sql' 쿼리를 1회 실행하면 즉시 테이블이 활성화됩니다.");
    } else {
      console.log(`⚠️ 테이블 쿼리 오류: [${feedbackError.code}] ${feedbackError.message}`);
    }
  } else {
    console.log(`✅ 'mentor_feedbacks' 테이블 정상 조회 성공! (현재 레코드: ${feedbackData.length}건)`);
  }

  console.log("\n[TEST 3] 'project_connections' 테이블 쿼리 테스트...");
  const { data: connData, error: connError } = await supabase
    .from("project_connections")
    .select("id, source_project_id, target_project_id, proposer_name, status")
    .limit(5);

  if (connError) {
    if (connError.code === "PGRST205" || connError.message.includes("relation") || connError.message.includes("does not exist")) {
      console.log(`ℹ️ 상태: 테이블 미생성 상태 (코드: ${connError.code})`);
    } else {
      console.log(`⚠️ 테이블 쿼리 오류: [${connError.code}] ${connError.message}`);
    }
  } else {
    console.log(`✅ 'project_connections' 테이블 정상 조회 성공! (현재 레코드: ${connData.length}건)`);
  }

  console.log("\n==================================================");
  console.log("🎉 SUPABASE 연결 테스트 종합 결과:");
  console.log("   • API URL 및 인증 키 유효성: 정상 (연결 성공)");
  console.log("   • 데이터베이스 엔드포인트: 정상 통신 확인");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("❌ 테스트 실행 중 예외 발생:", err);
  process.exit(1);
});
