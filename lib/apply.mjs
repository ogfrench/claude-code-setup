// Apply this repo's shared setup to one target repo checkout.
//   node lib/apply.mjs <target-dir>
// Prints the paths it manages, one per line, for the caller to `git add -f`.
//
// What lands in the target:
//   plugins/<p>/{skills,agents,commands}/<x>  -> .claude/{skills,agents,commands}/<x>  (copied)
//   project/settings.json                     -> .claude/settings.json                 (deep-merged)
//   project/mcp.json                          -> .mcp.json                             (deep-merged, if it has servers)
// Copies are recorded in .claude/claude-code-setup.json, so an item deleted or
// renamed here is removed from the target on the next sync.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KINDS = ["skills", "agents", "commands"];
const MANIFEST = ".claude/claude-code-setup.json";

const readJson = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : undefined);
const writeJson = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
};

// Objects merge key by key, arrays gain the entries they lack, scalars take ours.
// Re-applying is a no-op, and nothing the target already had is dropped.
export function deepMerge(target, source) {
  if (Array.isArray(target) && Array.isArray(source)) {
    const seen = new Set(target.map((x) => JSON.stringify(x)));
    return [...target, ...source.filter((x) => !seen.has(JSON.stringify(x)))];
  }
  if (isObject(target) && isObject(source)) {
    const out = { ...target };
    for (const [k, v] of Object.entries(source)) out[k] = k in out ? deepMerge(out[k], v) : v;
    return out;
  }
  return source;
}
const isObject = (x) => x && typeof x === "object" && !Array.isArray(x);

export function apply(target, root = ROOT) {
  const managed = new Set();
  const previous = readJson(path.join(target, MANIFEST))?.copied ?? [];
  const copied = [];
  for (const plugin of fs.readdirSync(path.join(root, "plugins"))) {
    for (const kind of KINDS) {
      const dir = path.join(root, "plugins", plugin, kind);
      if (!fs.existsSync(dir)) continue;
      for (const item of fs.readdirSync(dir)) {
        const rel = `.claude/${kind}/${item}`;
        fs.rmSync(path.join(target, rel), { recursive: true, force: true });
        fs.cpSync(path.join(dir, item), path.join(target, rel), { recursive: true });
        copied.push(rel);
      }
    }
  }
  for (const rel of previous) {
    if (!copied.includes(rel)) fs.rmSync(path.join(target, rel), { recursive: true, force: true });
    managed.add(rel);
  }
  copied.forEach((rel) => managed.add(rel));
  writeJson(path.join(target, MANIFEST), {
    source: "https://github.com/ogfrench/claude-code-setup",
    note: "Written by sync-to-repos.sh. Edit the source repo, not these copies.",
    copied: copied.sort(),
  });
  managed.add(MANIFEST);

  const settings = path.join(target, ".claude/settings.json");
  writeJson(settings, deepMerge(readJson(settings) ?? {}, readJson(path.join(root, "project/settings.json")) ?? {}));
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
  console.log(apply(path.resolve(process.argv[2])).join("\n"));
}
