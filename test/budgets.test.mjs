// Token budgets live in lib/kb.mjs. See "Reading it cheaply" in README.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BUDGET, ROOT, loadKb, tokens } from "../lib/kb.mjs";
import { parseFrontmatter } from "../lib/frontmatter.mjs";

// T3: long reference skills, read only when invoked.
const T3 = new Set(["deslopify", "frogify", "humanizer"]);

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
function items() {
  const out = [];
  for (const plugin of fs.readdirSync(path.join(ROOT, "plugins"))) {
    const skills = path.join(ROOT, "plugins", plugin, "skills");
    for (const s of fs.existsSync(skills) ? fs.readdirSync(skills) : []) out.push({ name: s, rel: `plugins/${plugin}/skills/${s}/SKILL.md`, skill: true });
    const agents = path.join(ROOT, "plugins", plugin, "agents");
    for (const a of fs.existsSync(agents) ? fs.readdirSync(agents) : []) out.push({ name: a, rel: `plugins/${plugin}/agents/${a}`, skill: false });
  }
  return out;
}
// The description may be a folded block (`description: >-`), which the small parser does not unfold.
const description = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/)[1].match(/^description:[ \t]*(?:>-?)?[ \t]*\n?((?:[ \t]+.*\n?|.*)*?)(?=^[a-z_-]+:|$(?![\s\S]))/m);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
};

test("always-on text (skill and agent descriptions) fits its budget", () => {
  let total = 0;
  for (const it of items()) {
    const text = read(it.rel);
    const d = description(text);
    assert.ok(d.length > 40, `${it.rel}: description not found`);
    total += tokens(`${it.name} ${d}`);
  }
  assert.ok(total <= BUDGET.alwaysOn, `descriptions are ~${total} tokens, budget ${BUDGET.alwaysOn}`);
});

test("SKILL.md bodies stay small unless they are T3 reference skills", () => {
  for (const it of items().filter((i) => i.skill && !T3.has(i.name))) {
    const body = parseFrontmatter(read(it.rel)).body;
    assert.ok(tokens(body) <= BUDGET.skillBody, `${it.rel} body is ~${tokens(body)} tokens, budget ${BUDGET.skillBody}`);
  }
});

test("practice cards, bundles and the index fit their budgets", () => {
  for (const p of loadKb().practices) {
    assert.ok(p.tokens <= BUDGET.practiceCard, `kb/practices/${p.file} is ~${p.tokens} tokens, budget ${BUDGET.practiceCard}`);
  }
  for (const f of fs.readdirSync(path.join(ROOT, "kb/bundles"))) {
    const t = tokens(read(`kb/bundles/${f}`));
    assert.ok(t <= BUDGET.bundle, `kb/bundles/${f} is ~${t} tokens, budget ${BUDGET.bundle}`);
  }
  assert.ok(tokens(read("kb/INDEX.md")) <= BUDGET.index, "kb/INDEX.md is over budget");
});
