import fs from "fs";

const data = JSON.parse(fs.readFileSync("my-exhibit-platform/data/industry_challenges.json", "utf-8"));

console.log("=== Challenges & Resource URLs ===");
data.challenges.forEach((c) => {
  console.log(`\n[${c.id}] ${c.title}`);
  console.log(`  Provider: ${c.providerName} (URL: ${c.officialUrl || "NONE"})`);
  console.log(`  Region: ${c.region} (URL: ${c.regionUrl || "NONE"})`);
  console.log(`  Resources (${c.resources.length}):`);
  c.resources.forEach((r) => {
    console.log(`    - [${r.type}] ${r.title} -> ${r.url || "NO_URL"}`);
  });
});
