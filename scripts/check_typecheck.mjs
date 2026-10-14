import { execSync } from "child_process";

try {
  console.log("Checking admin build/typecheck...");
  const adminRes = execSync("npx tsc --noEmit", { cwd: "admin", encoding: "utf-8" });
  console.log("admin tsc output:\n", adminRes || "No errors!");
} catch (e) {
  console.log("admin tsc errors:\n", e.stdout || e.message);
}

try {
  console.log("\nChecking web build/typecheck...");
  const webRes = execSync("npx tsc --noEmit", { cwd: "web", encoding: "utf-8" });
  console.log("web tsc output:\n", webRes || "No errors!");
} catch (e) {
  console.log("web tsc errors:\n", e.stdout || e.message);
}
