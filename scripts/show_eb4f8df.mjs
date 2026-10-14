import { execSync } from "child_process";

try {
  const stat = execSync("git show --stat eb4f8df", { encoding: "utf-8" });
  console.log("Git show --stat eb4f8df:\n", stat);
} catch (e) {
  console.error("git error:", e.message);
}
