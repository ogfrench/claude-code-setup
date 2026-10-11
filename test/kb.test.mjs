// The knowledge graph is sound, and every generated file matches its source.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadKb, render, validate } from "../lib/kb.mjs";

const kb = loadKb();

test("the graph is sound: vocab, edges, evidence", () => {
  assert.ok(kb.practices.length > 0, "no practices");
  assert.deepEqual(validate(kb), []);
});

test("generated files are up to date (node scripts/build-kb.mjs)", () => {
  for (const [rel, content] of render(kb)) {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} is missing`);
    assert.equal(fs.readFileSync(path.join(ROOT, rel), "utf8"), content, `${rel} is out of date`);
  }
  for (const f of fs.readdirSync(path.join(ROOT, "kb/bundles"))) {
    assert.ok(render(kb).has(`kb/bundles/${f}`), `kb/bundles/${f} has no source`);
  }
});

test("index.jsonl has one parseable line per node, and every edge target exists", () => {
  const lines = fs.readFileSync(path.join(ROOT, "kb/index.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, kb.practices.length + kb.learnings.length);
  const ids = new Set(lines.map((l) => l.id));
  assert.equal(ids.size, lines.length, "duplicate ids across practices and learnings");
  for (const p of lines.filter((l) => l.type === "practice")) {
    for (const to of [...p.derived_from, ...p.related, ...p.supersedes]) assert.ok(ids.has(to), `${p.id} -> ${to}`);
  }
});

test("every bullet in a topic file comes from a node", () => {
  const summaries = new Set(kb.practices.map((p) => p.summary));
  for (const c of Object.values(kb.vocab.concerns)) {
    const text = fs.readFileSync(path.join(ROOT, "plugins/agent-workflow/skills/best-practices", c.file), "utf8");
    for (const [, s] of text.matchAll(/^- \*\*(.+?)\*\*/gm)) assert.ok(summaries.has(s), `${c.file}: "${s}" has no node`);
  }
});
