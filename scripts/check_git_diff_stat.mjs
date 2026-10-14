import { execSync } from "child_process";

try {
  const diffStat = execSync("git diff --stat", { encoding: "utf-8" });
  console.log("git diff --stat:\n", diffStat);
} catch (e) {
  console.error("git diff error:", e.message);
}
