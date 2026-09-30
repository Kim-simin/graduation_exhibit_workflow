import fs from "fs";

function verifyFile(path) {
  try {
    const raw = fs.readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    const count = Array.isArray(parsed) ? parsed.length : (parsed.records ? parsed.records.length : Object.keys(parsed).length);
    console.log(`[PASS] ${path} is valid JSON. Item count: ${count}`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${path} invalid JSON:`, err.message);
    return false;
  }
}

const files = [
  "data/university_queue.json",
  "my-exhibit-platform/data/university_queue.json",
  "data/schedules.json",
  "my-exhibit-platform/data/schedules.json"
];

let allPass = true;
for (const f of files) {
  if (fs.existsSync(f)) {
    if (!verifyFile(f)) allPass = false;
  }
}

if (!allPass) {
  process.exit(1);
} else {
  console.log("[ALL JSON INTEGRITY VERIFIED]");
}
