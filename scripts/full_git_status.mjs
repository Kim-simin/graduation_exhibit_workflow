import { execSync } from "child_process";

try {
  const status = execSync("git status", { encoding: "utf-8" });
  console.log("git status:\n", status);
} catch (e) {
  console.error("git error:", e.message);
}
