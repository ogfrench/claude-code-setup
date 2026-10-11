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
  assert.equal(lines.length, kb.practices.length + kb.tools.length + kb.learnings.length);
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

test("every installed plugin, local skill and agent has a tool node, and no node points at nothing", () => {
  const where = new Set(kb.tools.map((t) => t.where));
  const need = new Set();
  const plugins = fs.readFileSync(path.join(ROOT, "user/plugins.txt"), "utf8")
    .split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  plugins.forEach((p) => need.add(p));
  const settings = JSON.parse(fs.readFileSync(path.join(ROOT, "project/settings.json"), "utf8"));
  Object.keys(settings.enabledPlugins).forEach((p) => need.add(p));
  for (const plugin of fs.readdirSync(path.join(ROOT, "plugins"))) {
    for (const kind of ["skills", "agents"]) {
      const dir = path.join(ROOT, "plugins", plugin, kind);
      for (const item of fs.existsSync(dir) ? fs.readdirSync(dir) : []) need.add(`plugins/${plugin}/${kind}/${item}`);
    }
  }
  for (const w of need) assert.ok(where.has(w), `no kb/tools node for ${w}`);
  for (const t of kb.tools) {
    assert.ok(need.has(t.where) || t.state !== "installed", `kb/tools/${t.file}: installed, but ${t.where} is not installed or in the repo`);
  }
});

test("a marketplace plugin of ours is listed in the README table", () => {
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const market = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude-plugin/marketplace.json"), "utf8"));
  for (const p of market.plugins) assert.ok(readme.includes(`| \`${p.name}\` |`), `README Plugins table is missing ${p.name}`);
});
