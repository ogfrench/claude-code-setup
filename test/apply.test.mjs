// node --test   (no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apply, deepMerge } from "../lib/apply.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "ccs-test-"));
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, typeof v === "string" ? v : JSON.stringify(v));
};
const snapshot = (dir) =>
  fs.readdirSync(dir, { recursive: true }).sort().map((p) => {
    const f = path.join(dir, p);
    return fs.statSync(f).isFile() ? `${p}:${fs.readFileSync(f, "utf8")}` : p;
  });

test("deepMerge keeps what the target had and adds ours", () => {
  const target = {
    permissions: { allow: ["Bash(npm test)"], deny: ["Bash(git push -f:*)"] },
    hooks: { SessionStart: [{ hooks: [{ type: "command", command: "npm ci" }] }] },
    enabledPlugins: { "x@y": false },
  };
  const ours = {
    permissions: { allow: ["Bash(npm test)", "Bash(git status:*)"] },
    hooks: { SessionStart: [{ hooks: [{ type: "command", command: "echo hi" }] }] },
    enabledPlugins: { "a@b": true },
  };
  assert.deepEqual(deepMerge(target, ours), {
    permissions: { allow: ["Bash(npm test)", "Bash(git status:*)"], deny: ["Bash(git push -f:*)"] },
    hooks: {
      SessionStart: [
        { hooks: [{ type: "command", command: "npm ci" }] },
        { hooks: [{ type: "command", command: "echo hi" }] },
      ],
    },
    enabledPlugins: { "x@y": false, "a@b": true },
  });
});

test("apply on the real repo: copies skills, merges settings, is idempotent", () => {
  const t = tmp();
  write(path.join(t, ".claude/settings.json"), { permissions: { allow: ["Bash(npm test)"] }, hooks: { Stop: [] } });
  write(path.join(t, ".claude/skills/mine/SKILL.md"), "user's own skill");

  const managed = apply(t);
  const settings = read(path.join(t, ".claude/settings.json"));
  assert.deepEqual(settings.permissions, { allow: ["Bash(npm test)"] });
  assert.deepEqual(settings.hooks, { Stop: [] });
  assert.equal(settings.enabledPlugins["frog-writing@ogfrench"], true);
  assert.equal(settings.extraKnownMarketplaces.ogfrench.source.repo, "ogfrench/claude-code-setup");

  for (const s of fs.readdirSync(path.join(ROOT, "plugins/frog-writing/skills"))) {
    assert.ok(fs.existsSync(path.join(t, ".claude/skills", s, "SKILL.md")), `${s} copied`);
    assert.ok(managed.includes(`.claude/skills/${s}`));
  }
  assert.equal(fs.readFileSync(path.join(t, ".claude/skills/mine/SKILL.md"), "utf8"), "user's own skill");
  assert.ok(!managed.some((m) => m.includes("mine")), "user's own skill is not managed");
  assert.ok(!fs.existsSync(path.join(t, ".mcp.json")), "empty project/mcp.json writes nothing");

  const before = snapshot(t);
  apply(t);
  assert.deepEqual(snapshot(t), before, "second apply changes nothing");
});

test("a skill removed upstream is removed from the target, MCP servers merge", () => {
  const src = tmp();
  write(path.join(src, "plugins/p/skills/keep/SKILL.md"), "keep");
  write(path.join(src, "plugins/p/skills/gone/SKILL.md"), "gone");
  write(path.join(src, "plugins/p/agents/rev.md"), "agent");
  write(path.join(src, "project/settings.json"), {});
  write(path.join(src, "project/mcp.json"), { mcpServers: { ours: { type: "http", url: "https://x" } } });
  const t = tmp();
  write(path.join(t, ".mcp.json"), { mcpServers: { theirs: { command: "npx" } } });
  write(path.join(t, ".claude/skills/mine/SKILL.md"), "mine");

  apply(t, src);
  assert.ok(fs.existsSync(path.join(t, ".claude/skills/gone/SKILL.md")));
  assert.ok(fs.existsSync(path.join(t, ".claude/agents/rev.md")));
  assert.deepEqual(Object.keys(read(path.join(t, ".mcp.json")).mcpServers).sort(), ["ours", "theirs"]);

  fs.rmSync(path.join(src, "plugins/p/skills/gone"), { recursive: true });
  const managed = apply(t, src);
  assert.ok(!fs.existsSync(path.join(t, ".claude/skills/gone")), "removed downstream");
  assert.ok(managed.includes(".claude/skills/gone"), "reported so git stages the deletion");
  assert.ok(fs.existsSync(path.join(t, ".claude/skills/mine/SKILL.md")), "never-synced skill untouched");
  assert.ok(fs.existsSync(path.join(t, ".claude/skills/keep/SKILL.md")));
});

test("every skill has frontmatter with name and description", () => {
  const plugins = path.join(ROOT, "plugins");
  for (const p of fs.readdirSync(plugins)) {
    const dir = path.join(plugins, p, "skills");
    if (!fs.existsSync(dir)) continue;
    for (const s of fs.readdirSync(dir)) {
      const md = fs.readFileSync(path.join(dir, s, "SKILL.md"), "utf8");
      const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      assert.match(fm, /^name:\s*\S/m, `${p}/${s} has name`);
      assert.match(fm, /^description:\s*\S/m, `${p}/${s} has description`);
    }
  }
});
