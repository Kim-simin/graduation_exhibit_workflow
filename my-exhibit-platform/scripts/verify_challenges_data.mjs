import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, "../data/industry_challenges.json");
console.log("Reading:", jsonPath);

try {
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);
  console.log("JSON is valid!");
  console.log("Major Categories count:", data.majorCategories?.length);
  console.log("Parent Challenges count:", data.parentChallenges?.length);
  console.log("Sub Challenges count:", data.challenges?.length);

  // Check requirements for CASE 2
  const case2Challenge = data.challenges.find((c) => c.id === "challenge-shipbuilding-llm");
  console.log("Found CASE 2 Challenge:", case2Challenge.title);
  case2Challenge.majorRequirements.forEach((r) => {
    console.log(` - ${r.majorCategoryName}: ${r.currentMembers}/${r.capacity} (${r.status})`);
  });

  // Calculate dynamic recruiting counts per major
  const recruitingChallenges = data.challenges.filter(
    (c) => c.status === "OPEN" || c.status === "RECRUITING"
  );
  console.log("\nTotal Active Recruiting Challenges:", recruitingChallenges.length);

  data.majorCategories.forEach((cat) => {
    const count = recruitingChallenges.filter((c) =>
      c.majorRequirements.some(
        (r) => r.majorCategoryId === cat.id && r.currentMembers < r.capacity
      )
    ).length;
    console.log(`[${cat.icon} ${cat.name}]: ${count} challenges`);
  });

  process.exit(0);
} catch (err) {
  console.error("Error validating JSON:", err);
  process.exit(1);
}
