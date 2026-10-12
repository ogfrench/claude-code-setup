// Build everything generated from kb/practices and learnings/.
//   node scripts/build-kb.mjs           write the files
//   node scripts/build-kb.mjs --check   exit 1 if any generated file is out of date or the graph is unsound
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadKb, render, validate } from "../lib/kb.mjs";

const check = process.argv.includes("--check");
const kb = loadKb();
const errors = validate(kb);
if (errors.length) {
  console.error(errors.map((e) => `  ${e}`).join("\n"));
  process.exit(1);
}

const files = render(kb);
const stale = [];
for (const [rel, content] of files) {
  const file = path.join(ROOT, rel);
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === content) continue;
  stale.push(rel);
  if (!check) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}
// A bundle for a stack that has no practices any more is dropped.
const bundles = path.join(ROOT, "kb/bundles");
for (const f of fs.existsSync(bundles) ? fs.readdirSync(bundles) : []) {
  if (files.has(`kb/bundles/${f}`)) continue;
  stale.push(`kb/bundles/${f} (remove)`);
  if (!check) fs.rmSync(path.join(bundles, f));
}

if (check && stale.length) {
  console.error(`out of date, run: node scripts/build-kb.mjs\n${stale.map((s) => `  ${s}`).join("\n")}`);
  process.exit(1);
}
console.log(stale.length ? `${check ? "" : "wrote "}${stale.length} file(s)` : "up to date");
