// Execute the real TypeScript modules without installing a separate test runner.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const platform = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(fs.readFileSync(path.join(platform, "../scripts/fixtures/student_rnd_cases.json"), "utf8"));
const nativeRequire = createRequire(import.meta.url);

function loader(overrides = {}) {
  const cache = new Map();
  return function load(id) {
    if (Object.hasOwn(overrides, id)) return overrides[id];
    if (!id.startsWith("@/")) return nativeRequire(id);
    const file = path.join(platform, id.slice(2)) + (id.endsWith(".json") ? "" : ".ts");
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    if (file.endsWith(".json")) module.exports = JSON.parse(fs.readFileSync(file, "utf8"));
    else {
      const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
        fileName: file,
      }).outputText;
      const execute = vm.runInThisContext(`(function(exports, require, module, __filename, __dirname) {${compiled}\n})`, { filename: file });
      execute(module.exports, load, module, file, path.dirname(file));
    }
    return module.exports;
  };
}

function merge(base, patch) {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(patch)) {
    result[key] = value && typeof value === "object" && !Array.isArray(value)
      ? merge(result[key] || {}, value) : structuredClone(value);
  }
  return result;
}

try {
  const load = loader();
  const { evaluateStudentRnD, isStudentRnDOpportunity, calculateRecruitmentStatus } = load("@/lib/student-rnd");
  for (const scenario of fixture.cases) {
    const opportunity = merge(fixture.base, scenario.patch);
    const before = structuredClone(opportunity);
    assert.equal(isStudentRnDOpportunity(opportunity, fixture.now), scenario.expectedActive, scenario.name);
    assert.equal(evaluateStudentRnD(opportunity, fixture.now).recruitmentStatus, scenario.expectedStatus, scenario.name);
    assert.deepEqual(opportunity, before, `${scenario.name}: validator must not mutate saved records`);
  }
  assert.equal(calculateRecruitmentStatus(null, null, fixture.now).status, "UNKNOWN");
  assert.equal(calculateRecruitmentStatus(null, "invalid", fixture.now).status, "UNKNOWN");

  const verified = fixture.base;
  const projectOnly = merge(fixture.base, { id: "general-project", recruitmentEvidence: null });
  const equipment = merge(fixture.base, { id: "research-equipment", type: "RESEARCH_EQUIPMENT" });
  const pending = merge(fixture.base, { id: "pending", approvalStatus: "PENDING_REVIEW" });
  const synthetic = loader({ "@/data/opportunities.json": [verified, projectOnly, equipment, pending], "@/data/equipment.json": [] });
  const lib = synthetic("@/lib/opportunity");
  assert.equal(lib.getOpportunities(fixture.now).length, 4, "All records retained, including general R&D");
  const discovery = lib.getStudentExplorationData("all", "all", fixture.now);
  assert.deepEqual(discovery.activeRnD.map(o => o.id), [verified.id], "Only verified recruitment reaches API discovery bundle");
  assert.deepEqual(discovery.recruitingProjects.map(o => o.id), [verified.id], "General R&D cannot bypass verification through Projects");
  assert.deepEqual(discovery.availableResources.map(o => o.id), [equipment.id], "Equipment remains accessible in resources");
  const expired = lib.getStudentExplorationData("all", "all", "2026-10-01T00:00:00+09:00");
  assert.equal(expired.activeRnD.length, 0, "Expiry reevaluated without a database edit");

  const realLib = load("@/lib/opportunity");
  const stored = JSON.parse(fs.readFileSync(path.join(platform, "data/opportunities.json"), "utf8"));
  assert.equal(realLib.getOpportunities().length, stored.length, "Real platform loader preserves records");
  const route = load("@/app/api/opportunities/route");
  const response = await route.GET(new Request("http://localhost/api/opportunities?mode=student_discovery"));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.ok(payload.data.activeRnD.every(o => isStudentRnDOpportunity(o)), "Public API excludes unverified records");
  const standard = await route.GET(new Request("http://localhost/api/opportunities"));
  const standardPayload = await standard.json();
  assert.ok(standardPayload.opportunities.every(o => o.approvalStatus === "PUBLISHED"));
  console.log(`PASS: ${fixture.cases.length} shared scenarios; real loader/API, expiry, preservation and bypass checks.`);
  console.log(`Platform records: ${stored.length}; verified student R&D: ${payload.data.activeRnD.length}`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
