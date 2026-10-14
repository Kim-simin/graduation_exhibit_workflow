import { execSync } from "child_process";

try {
  const show = execSync("git show eb4f8df -- admin/components/exhibition-gallery.tsx", { encoding: "utf-8" });
  console.log("Git show eb4f8df for admin/components/exhibition-gallery.tsx:\n", show);
} catch (e) {
  console.error("git show error:", e.message);
}
