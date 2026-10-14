import { execSync } from "child_process";

try {
  const log = execSync("git log -n 5 --oneline -- admin/components/exhibition-gallery.tsx", { encoding: "utf-8" });
  console.log("Git log for admin/components/exhibition-gallery.tsx:\n", log);
} catch (e) {
  console.error("git log error:", e.message);
}
