// node --test   (no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apply, deepMerge } from "../lib/apply.mjs";
import { BUDGET } from "../lib/kb.mjs";
import { checkSync, sourceRevision, SYNC_BUFFER } from "../lib/sync-status.mjs";
import { execFileSync } from "node:child_process";

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
  assert.deepEqual(settings.hooks.Stop, [], "the repo's own hook is kept");
  assert.match(settings.hooks.SessionStart[0].hooks[0].command, /\.claude\/knowledge\/must\.md/);
  assert.equal(settings.enabledPlugins["superpowers@claude-plugins-official"], true);
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

test("a value the target already set wins, so a disabled plugin stays disabled", () => {
  assert.deepEqual(
    deepMerge({ enabledPlugins: { "caveman@ogfrench": false } }, { enabledPlugins: { "caveman@ogfrench": true, "x@y": true } }),
    { enabledPlugins: { "caveman@ogfrench": false, "x@y": true } },
  );
});

test("a hostile manifest cannot delete outside .claude/<kind>/, and a same-name repo skill is kept", () => {
  const src = tmp();
  write(path.join(src, "plugins/p/skills/frogify/SKILL.md"), "ours");
  write(path.join(src, "project/settings.json"), {});
  const outside = tmp();
  write(path.join(outside, "precious.txt"), "keep me");
  const t = tmp();
  write(path.join(t, "README.md"), "readme");
  write(path.join(t, ".claude/skills/frogify/SKILL.md"), "the repo's own frogify");
  write(path.join(t, ".claude/claude-code-setup.json"), {
    copied: [path.relative(t, path.join(outside, "precious.txt")).replace(/\\/g, "/"), "README.md", ".claude/../README.md", ".claude/skills/../../README.md"],
  });

  const managed = apply(t, src);
  assert.equal(fs.readFileSync(path.join(outside, "precious.txt"), "utf8"), "keep me");
  assert.equal(fs.readFileSync(path.join(t, "README.md"), "utf8"), "readme");
  assert.ok(!managed.some((m) => m.includes("README") || m.includes("precious")));
  assert.equal(fs.readFileSync(path.join(t, ".claude/skills/frogify/SKILL.md"), "utf8"), "the repo's own frogify");
  assert.ok(!managed.includes(".claude/skills/frogify"));
});

test("keys in retired.json are removed from the repo, nothing else is", () => {
  const src = tmp();
  write(path.join(src, "plugins/p/skills/s/SKILL.md"), "s");
  write(path.join(src, "project/settings.json"), { enabledPlugins: { "keep@m": true } });
  write(path.join(src, "project/retired.json"), { settings: [["enabledPlugins", "old@m"], ["missing", "path"]] });
  const t = tmp();
  write(path.join(t, ".claude/settings.json"), { enabledPlugins: { "old@m": true, "mine@m": true }, model: "opus" });
  apply(t, src);
  assert.deepEqual(read(path.join(t, ".claude/settings.json")), {
    enabledPlugins: { "mine@m": true, "keep@m": true },
    model: "opus",
  });
});

test("the real project settings no longer enable personal plugins", () => {
  const t = tmp();
  write(path.join(t, ".claude/settings.json"), { enabledPlugins: { "caveman@ogfrench": true, "frog-writing@ogfrench": true } });
  apply(t);
  const on = Object.keys(read(path.join(t, ".claude/settings.json")).enabledPlugins);
  assert.ok(!on.some((k) => k.endsWith("@ogfrench")), on.join(","));
});

test("a settings file with a BOM still parses", () => {
  const t = tmp();
  write(path.join(t, ".claude/settings.json"), "﻿" + JSON.stringify({ model: "opus" }));
  apply(t);
  assert.equal(read(path.join(t, ".claude/settings.json")).model, "opus");
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

test("a skill's README stays in the source, its LICENSE travels with it", () => {
  const src = tmp();
  write(path.join(src, "plugins/p/skills/vendored/SKILL.md"), "s");
  write(path.join(src, "plugins/p/skills/vendored/README.md"), "for people");
  write(path.join(src, "plugins/p/skills/vendored/LICENSE"), "MIT");
  write(path.join(src, "plugins/p/skills/vendored/refs/README.md"), "a reference the skill reads");
  write(path.join(src, "project/settings.json"), {});
  const t = tmp();
  apply(t, src);
  assert.ok(fs.existsSync(path.join(t, ".claude/skills/vendored/SKILL.md")));
  assert.ok(fs.existsSync(path.join(t, ".claude/skills/vendored/LICENSE")));
  assert.ok(!fs.existsSync(path.join(t, ".claude/skills/vendored/README.md")));
  assert.ok(fs.existsSync(path.join(t, ".claude/skills/vendored/refs/README.md")), "only the top-level README is skipped");
});

test("knowledge: a repo gets the practices for its stacks, rewritten whole, never over its own folder", () => {
  const src = tmp();
  write(path.join(src, "plugins/p/skills/s/SKILL.md"), "s");
  write(path.join(src, "project/settings.json"), {});
  write(path.join(src, "kb/_vocab.json"), {
    concerns: { data: { title: "Data", file: "d.md", readBefore: "x" } },
    stacks: ["any", "nextjs", "python"], severities: ["must", "should", "tip"],
    toolKinds: ["skill"], toolStates: ["installed"],
  });
  const card = (id, stack, severity) =>
    `---\nid: ${id}\ntype: practice\nsummary: Rule ${id}.\nconcern: data\nstack: [${stack}]\nseverity: ${severity}\nsource: judgment\nlast_verified: 2026-10-11\nstatus: active\n---\n\nWhy ${id}.\n`;
  write(path.join(src, "kb/practices/general.md"), card("general", "any", "should"));
  write(path.join(src, "kb/practices/next-only.md"), card("next-only", "nextjs", "should"));
  write(path.join(src, "kb/practices/py-only.md"), card("py-only", "python", "should"));

  const t = tmp();
  const managed = apply(t, src, ["nextjs"]);
  const k = path.join(t, ".claude/knowledge");
  assert.ok(managed.includes(".claude/knowledge"));
  assert.deepEqual(fs.readdirSync(path.join(k, "practices")).sort(), ["general.md", "next-only.md"]);
  const lines = fs.readFileSync(path.join(k, "index.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.id).sort(), ["general", "next-only"]);
  assert.match(fs.readFileSync(path.join(k, "bundle.md"), "utf8"), /general: Rule general\./);
  assert.ok(!fs.readFileSync(path.join(k, "bundle.md"), "utf8").includes("py-only"));
  assert.deepEqual(read(path.join(t, ".claude/claude-code-setup.json")).knowledge, { stacks: ["any", "nextjs"] });

  const before = snapshot(t);
  apply(t, src, ["nextjs"]);
  assert.deepEqual(snapshot(t), before, "second apply changes nothing");

  fs.rmSync(path.join(src, "kb/practices/next-only.md"));
  apply(t, src, ["nextjs"]);
  assert.ok(!fs.existsSync(path.join(k, "practices/next-only.md")), "a practice removed upstream is removed downstream");

  apply(t, src, []);
  assert.deepEqual(fs.readdirSync(path.join(k, "practices")), ["general.md"], "fewer stacks, fewer cards");

  assert.throws(() => apply(tmp(), src, ["cobol"]), /unknown stack "cobol"/);

  const own = tmp();
  write(path.join(own, ".claude/knowledge/notes.md"), "the repo's own notes");
  apply(own, src, []);
  assert.equal(fs.readFileSync(path.join(own, ".claude/knowledge/notes.md"), "utf8"), "the repo's own notes");
  assert.ok(!fs.existsSync(path.join(own, ".claude/knowledge/bundle.md")));
});

test("the real repo: stack bundles stay inside the session budget", () => {
  const t = tmp();
  apply(t, ROOT, ["nextjs", "postgres", "shadcn", "python", "html-css-ts"]);
  const k = path.join(t, ".claude/knowledge");
  const must = fs.readFileSync(path.join(k, "must.md"), "utf8");
  assert.ok(Math.ceil(must.length / 4) <= BUDGET.mustRules, "must.md is the only thing printed at session start");
  assert.ok(must.includes("names-are-private-data"));
});

test("sync provenance detects changed and missing managed copies without writing", () => {
  const t = tmp();
  apply(t);
  const manifest = read(path.join(t, ".claude/claude-code-setup.json"));
  assert.match(manifest.snapshot_sha256, /^[0-9a-f]{64}$/);
  assert.equal(manifest.source_revision, sourceRevision(ROOT));
  assert.equal(checkSync(t).status, "current");

  const target = path.join(t, ".claude/skills/actions-cost/SKILL.md");
  fs.appendFileSync(target, "\\nlocal change\\n");
  assert.equal(checkSync(t).status, "modified");

  apply(t);
  assert.equal(checkSync(t).status, "current", "re-applying restores the synced version");

  fs.rmSync(target);
  assert.equal(checkSync(t).status, "modified", "missing files are not silently treated as current");

  const stamp = path.join(t, ".claude/claude-code-setup.json");
  const old = read(stamp);
  delete old.source_revision;
  write(stamp, old);
  assert.equal(checkSync(t).status, "legacy", "older manifests need a resync");
});

test("sync checker refuses untrusted managed paths", () => {
  const t = tmp();
  apply(t);
  const file = path.join(t, ".claude/claude-code-setup.json");
  const manifest = read(file);
  manifest.copied = ["../outside"];
  write(file, manifest);
  assert.equal(checkSync(t).status, "modified");
});

test("a copy up to SYNC_BUFFER central commits behind counts as current; one more is outdated", () => {
  // A throwaway central history: c0..c4, the checkout at c4.
  const root = tmp();
  const git = (...a) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  const shas = [];
  for (let i = 0; i <= SYNC_BUFFER + 2; i++) {
    git("-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-q", "--allow-empty", "-m", `c${i}`);
    shas.push(git("rev-parse", "HEAD"));
  }
  const head = shas.at(-1);
  const t = tmp();
  apply(t);
  const stamp = path.join(t, ".claude/claude-code-setup.json");
  const at = (sha) => {
    write(stamp, { ...read(stamp), source_revision: sha });
    return checkSync(t, root);
  };
  assert.equal(at(head).status, "current");
  const within = at(shas.at(-1 - SYNC_BUFFER));
  assert.equal(within.status, "current");
  assert.equal(within.behind, SYNC_BUFFER);
  const past = at(shas.at(-2 - SYNC_BUFFER));
  assert.equal(past.status, "outdated");
  assert.equal(past.behind, SYNC_BUFFER + 1);
  assert.equal(at("0".repeat(40)).status, "outdated", "a commit outside the history is not within the buffer");
  // Within the buffer, a hand edit still shows.
  write(stamp, { ...read(stamp), source_revision: shas.at(-2) });
  fs.appendFileSync(path.join(t, ".claude/skills/actions-cost/SKILL.md"), "\nlocal change\n");
  assert.equal(checkSync(t, root).status, "modified");
});
