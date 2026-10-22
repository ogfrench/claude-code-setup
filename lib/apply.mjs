// Apply this repo's shared setup to one target repo checkout.
//   node lib/apply.mjs <target-dir>
// Prints the paths it manages, one per line, for the caller to `git add -f`.
//
// What lands in the target:
//   plugins/<p>/{skills,agents,commands}/<x>  -> .claude/{skills,agents,commands}/<x>  (copied)
//   project/settings.json                     -> .claude/settings.json                 (deep-merged)
//   project/mcp.json                          -> .mcp.json                             (deep-merged, if it has servers)
//   kb/ practices for the repo's stacks       -> .claude/knowledge/                    (rewritten whole each time)
// Copies are recorded in .claude/claude-code-setup.json, so an item deleted or
// renamed here is removed from the target on the next sync.
//   node lib/apply.mjs <target-dir> [stack,stack]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadKb, knowledgeFor } from "./kb.mjs";
import { copyFingerprint, sourceRevision } from "./sync-status.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KINDS = ["skills", "agents", "commands"];
const MANIFEST = ".claude/claude-code-setup.json";
const KNOWLEDGE = ".claude/knowledge";

const readJson = (f) => {
  if (!fs.existsSync(f)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(f, "utf8").replace(/^﻿/, ""));
  } catch (e) {
    throw new Error(`${f}: ${e.message}`);
  }
};
// The manifest comes from the target repo, so treat its entries as untrusted:
// only a direct child of .claude/{skills,agents,commands} may ever be deleted.
const SAFE = /^\.claude\/(skills|agents|commands)\/[A-Za-z0-9._-]+$/;
const isSafe = (rel) => SAFE.test(rel) && !rel.split("/").includes("..");
const writeJson = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
};

// Objects merge key by key, arrays gain the entries they lack, and a value the
// target already set wins over ours (a repo that turned a plugin off keeps it off).
// Re-applying is a no-op, and nothing the target already had is dropped or changed.
export function deepMerge(target, source) {
  if (target === undefined) return source;
  if (Array.isArray(target) && Array.isArray(source)) {
    const seen = new Set(target.map((x) => JSON.stringify(x)));
    return [...target, ...source.filter((x) => !seen.has(JSON.stringify(x)))];
  }
  if (isObject(target) && isObject(source)) {
    const out = { ...target };
    for (const [k, v] of Object.entries(source)) out[k] = deepMerge(out[k], v);
    return out;
  }
  return target;
}
const isObject = (x) => x && typeof x === "object" && !Array.isArray(x);

export function apply(target, root = ROOT, stacks = []) {
  const managed = new Set();
  const old = readJson(path.join(target, MANIFEST));
  const previous = (old?.copied ?? []).filter(isSafe);
  const copied = [];
  for (const plugin of fs.readdirSync(path.join(root, "plugins"))) {
    for (const kind of KINDS) {
      const dir = path.join(root, "plugins", plugin, kind);
      if (!fs.existsSync(dir)) continue;
      for (const item of fs.readdirSync(dir)) {
        const rel = `.claude/${kind}/${item}`;
        if (fs.existsSync(path.join(target, rel)) && !previous.includes(rel)) {
          console.error(`skipped ${rel}: the repo has its own with that name`);
          continue;
        }
        fs.rmSync(path.join(target, rel), { recursive: true, force: true });
        const from = path.join(dir, item);
        // A skill's own README is for people reading the source, so it never loads in a target.
        // LICENSE files stay: a vendored skill must travel with its notice.
        fs.cpSync(from, path.join(target, rel), {
          recursive: true,
          filter: (src) => !(kind === "skills" && src === path.join(from, "README.md")),
        });
        copied.push(rel);
      }
    }
  }
  for (const rel of previous) {
    if (!copied.includes(rel)) fs.rmSync(path.join(target, rel), { recursive: true, force: true });
    managed.add(rel);
  }
  copied.forEach((rel) => managed.add(rel));

  // The knowledge folder is ours as a whole, but only once the manifest says so: a repo
  // that already has its own .claude/knowledge keeps it, same rule as a same-name skill.
  let knowledge;
  if (fs.existsSync(path.join(root, "kb/_vocab.json"))) {
    const owned = !!old?.knowledge;
    if (fs.existsSync(path.join(target, KNOWLEDGE)) && !owned) {
      console.error(`skipped ${KNOWLEDGE}: the repo has its own`);
    } else {
      fs.rmSync(path.join(target, KNOWLEDGE), { recursive: true, force: true });
      for (const [rel, content] of knowledgeFor(loadKb(root), stacks)) {
        const file = path.join(target, KNOWLEDGE, rel);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
      }
      knowledge = { stacks: ["any", ...stacks.filter((s) => s !== "any")] };
      managed.add(KNOWLEDGE);
    }
  }

  const revision = sourceRevision(root);
  writeJson(path.join(target, MANIFEST), {
    source: "https://github.com/ogfrench/claude-code-setup",
    note: "Written by sync-to-repos.sh. Edit the source repo, not these copies.",
    copied: copied.sort(),
    snapshot_sha256: copyFingerprint(target, copied),
    ...(revision && { source_revision: revision }),
    ...(knowledge && { knowledge }),
  });
  managed.add(MANIFEST);

  const settings = path.join(target, ".claude/settings.json");
  const merged = deepMerge(readJson(settings) ?? {}, readJson(path.join(root, "project/settings.json")) ?? {});
  for (const keys of readJson(path.join(root, "project/retired.json"))?.settings ?? []) {
    const parent = keys.slice(0, -1).reduce((o, k) => (isObject(o) ? o[k] : undefined), merged);
    if (isObject(parent)) delete parent[keys.at(-1)];
  }
  writeJson(settings, merged);
  managed.add(".claude/settings.json");

  const mcp = readJson(path.join(root, "project/mcp.json"));
  if (mcp && Object.keys(mcp.mcpServers ?? {}).length) {
    const file = path.join(target, ".mcp.json");
    writeJson(file, deepMerge(readJson(file) ?? {}, mcp));
    managed.add(".mcp.json");
  }

  return [...managed];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stacks = (process.argv[3] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  console.log(apply(path.resolve(process.argv[2]), ROOT, stacks).join("\n"));
}
