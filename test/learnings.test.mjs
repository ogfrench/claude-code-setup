// The knowledge base stays linked: every learning is well formed, everything it says it was
// promoted to exists, and every practice cites a learning that exists.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const LEARNINGS = path.join(ROOT, "learnings");
const PRACTICES = path.join(ROOT, "plugins/agent-workflow/skills/best-practices");
const STATUSES = ["raw", "practice", "promoted", "retired"];
const NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const PUBLIC_REPOS = new Set(
  fs.readFileSync(path.join(ROOT, "public-repos.txt"), "utf8").split("\n")
    .map((l) => l.replace(/#.*$/, "").trim().toLowerCase()).filter(Boolean),
);

// A small reader for the frontmatter these files use: `key: value`, `[a, b]`, and `- item` lists.
function frontmatter(text, file) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, `${file}: no frontmatter`);
  const out = {};
  let list = null;
  for (const raw of m[1].split("\n")) {
    const line = raw.replace(/\s+#.*$/, "");
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && list) {
      out[list].push(item[1].trim());
      continue;
    }
    const kv = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    if (value === "") {
      out[key] = [];
      list = key;
    } else if (value.startsWith("[")) {
      out[key] = value.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
      list = null;
    } else {
      out[key] = value.trim();
      list = null;
    }
  }
  return out;
}

const learningFiles = fs.readdirSync(LEARNINGS).filter((f) => f !== "README.md" && f.endsWith(".md"));

test("every learning is well formed and its promotions exist", () => {
  assert.ok(learningFiles.length > 0, "no learnings");
  for (const file of learningFiles) {
    assert.match(file, NAME, `${file}: name it YYYY-MM-DD-slug.md`);
    const fm = frontmatter(fs.readFileSync(path.join(LEARNINGS, file), "utf8"), file);
    for (const key of ["date", "source", "tags", "status", "promoted_to"]) {
      assert.ok(key in fm, `${file}: missing ${key}`);
    }
    assert.equal(fm.date, file.slice(0, 10), `${file}: date does not match the file name`);
    assert.ok(STATUSES.includes(fm.status), `${file}: status must be one of ${STATUSES.join(", ")}`);
    assert.ok(
      fm.source === "a private project" || PUBLIC_REPOS.has(fm.source.toLowerCase()),
      `${file}: source must be a repo in public-repos.txt, or "a private project"`,
    );
    if (fm.status === "raw") assert.deepEqual(fm.promoted_to, [], `${file}: a raw learning is promoted nowhere`);
    if (fm.status === "practice" || fm.status === "promoted") {
      assert.ok(fm.promoted_to.length > 0, `${file}: say where it went in promoted_to`);
    }
    for (const target of fm.promoted_to) {
      assert.ok(fs.existsSync(path.join(ROOT, target)), `${file}: promoted_to ${target} does not exist`);
    }
  }
});

test("every practice cites learnings that exist, and every practice-status learning is cited", () => {
  const ids = new Set(learningFiles.map((f) => f.replace(/\.md$/, "")));
  const cited = new Set();
  for (const file of fs.readdirSync(PRACTICES).filter((f) => f !== "SKILL.md" && f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(PRACTICES, file), "utf8");
    for (const [, id] of text.matchAll(/\*\((\d{4}-\d{2}-\d{2}-[a-z0-9-]+)\)\*/g)) {
      assert.ok(ids.has(id), `${file} cites ${id}, which is not in learnings/`);
      cited.add(id);
    }
  }
  for (const file of learningFiles) {
    const fm = frontmatter(fs.readFileSync(path.join(LEARNINGS, file), "utf8"), file);
    const toPractice = fm.promoted_to.some((t) => t.includes("skills/best-practices/"));
    if (toPractice) assert.ok(cited.has(file.replace(/\.md$/, "")), `${file} says it is a practice, but no practice cites it`);
  }
});

test("the knowledge base carries no em dashes", () => {
  const dirs = [LEARNINGS, PRACTICES, path.join(ROOT, "plugins/agent-workflow/skills/learning-loop")];
  for (const dir of dirs) {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      assert.ok(!fs.readFileSync(path.join(dir, file), "utf8").includes("—"), `${path.basename(dir)}/${file} has an em dash`);
    }
  }
});
