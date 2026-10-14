import { execSync } from "child_process";

try {
  const status = execSync("git status -s", { encoding: "utf-8" });
  console.log("git status -s:\n", status);
  const log = execSync("git log -n 5 --oneline", { encoding: "utf-8" });
  console.log("\ngit log:\n", log);
} catch (e) {
  console.error("git error:", e.message);
}
