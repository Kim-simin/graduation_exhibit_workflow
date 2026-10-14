import { execSync } from "child_process";

try {
  const diff = execSync("git diff eb4f8df^..eb4f8df admin/components/exhibition-gallery.tsx", { encoding: "utf-8" });
  console.log("Diff in admin/components/exhibition-gallery.tsx:\n", diff);
} catch (e) {
  console.error("git diff error:", e.message);
}
