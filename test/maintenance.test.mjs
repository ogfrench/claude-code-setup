import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadKb, validate, ROOT } from "../lib/kb.mjs";
import { audit, formatAudit, newLearning } from "../lib/maintain.mjs";

const tmpRepo = () => {
  const t = fs.mkdtempSync(path.join(os.tmpdir(), "ccs-kb-"));
  fs.cpSync(path.join(ROOT, "kb"), path.join(t, "kb"), { recursive: true });
  fs.cpSync(path.join(ROOT, "learnings"), path.join(t, "learnings"), { recursive: true });
  fs.cpSync(path.join(ROOT, "plugins/agent-workflow/skills/best-practices"), path.join(t, "plugins/agent-workflow/skills/best-practices"), { recursive: true });
  for (const f of ["plugins/agent-workflow/skills/model-delegation", "plugins/agent-workflow/agents/cheap-reviewer.md", "scripts/check-public.mjs", ".githooks/pre-push"]) {
    fs.mkdirSync(path.dirname(path.join(t, f)), { recursive: true });
    fs.cpSync(path.join(ROOT, f), path.join(t, f), { recursive: true });
  }
  for (const f of ["frog-writing/skills/frogify", "frog-writing/skills/deslopify", "frog-writing/skills/humanizer", "agent-workflow/skills/learning-loop"]) {
    fs.mkdirSync(path.join(t, "plugins", path.dirname(f)), { recursive: true });
    fs.cpSync(path.join(ROOT, "plugins", f), path.join(t, "plugins", f), { recursive: true });
  }
  return t;
};

test("kb-new scaffolds a learning that the tests refuse until it is written", () => {
  const t = tmpRepo();
  const rel = newLearning(t, "a-new-lesson", { date: "2026-10-12" });
  assert.equal(rel, path.join("learnings", "2026-10-12-a-new-lesson.md"));
  const errors = validate(loadKb(t));
  assert.ok(errors.some((e) => e.includes("2026-10-12-a-new-lesson") && e.includes("TODO")), errors.join("\n"));
  assert.throws(() => newLearning(t, "a-new-lesson", { date: "2026-10-12" }), /exists/);
  assert.throws(() => newLearning(t, "Bad Slug"), /slug/);

  const file = path.join(t, rel);
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replaceAll("TODO: ", "").replaceAll("TODO", "Done."));
  assert.deepEqual(validate(loadKb(t)), []);
});

test("the kb-new command refuses a call without a slug, and writes nothing", () => {
  const before = fs.readdirSync(path.join(ROOT, "learnings")).length;
  assert.throws(() => execFileSync("node", [path.join(ROOT, "scripts/kb-new.mjs"), "learning"], { stdio: "pipe" }), (e) => e.status === 2);
  assert.equal(fs.readdirSync(path.join(ROOT, "learnings")).length, before);
});

test("the audit finds stale nodes, old raw learnings and promotion candidates, and nothing else", () => {
  const t = tmpRepo();
  const kb0 = loadKb(t);
  const clean = audit(kb0, "2026-10-12");
  assert.deepEqual(clean.stalePractices, []);
  assert.deepEqual(clean.staleTools, []);
  assert.deepEqual(clean.rawLearnings, []);
  assert.ok(clean.judgmentOnly.includes("test-fails-first"));
  assert.ok(Object.values(clean.headroom).every((n) => n > 0), "inside every budget");

  const later = audit(kb0, "2027-03-01");
  assert.equal(later.stalePractices.length, kb0.practices.length, "all verified on one day, all stale 120 days on");
  assert.equal(later.staleTools.length, kb0.tools.length);

  const card = path.join(t, "kb/practices/keep-ci-logs.md");
  fs.writeFileSync(card, fs.readFileSync(card, "utf8").replace("source: judgment", "derived_from: [2026-10-11-pin-ci-tool-versions-locally, 2026-10-11-conflicted-pr-runs-no-workflows]"));
  assert.deepEqual(audit(loadKb(t), "2026-10-12").promotionCandidates, ["keep-ci-logs"]);

  newLearning(t, "waiting", { date: "2026-09-01" });
  assert.ok(audit(loadKb(t), "2026-10-12").rawLearnings.includes("2026-09-01-waiting"));

  const text = formatAudit(later);
  assert.match(text, /Knowledge audit, 2027-03-01/);
  assert.match(text, /Token headroom/);
});

test("the audit command prints a report and exits 0", () => {
  const out = execFileSync("node", [path.join(ROOT, "scripts/kb-audit.mjs"), "--json"], { encoding: "utf8" });
  const report = JSON.parse(out);
  assert.ok(Array.isArray(report.stalePractices) && report.headroom.index > 0);
});
