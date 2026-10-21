// Read-only verification of the committed shared Claude Code copies in one project.
// The sync manifest is untrusted input: reject traversal and symlinks before hashing.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = ".claude/claude-code-setup.json";
const SAFE = /^\.claude\/(skills|agents|commands)\/[A-Za-z0-9._-]+$/;

export function sourceRevision(root = ROOT) {
  try {
    const base = execFileSync("git", ["-C", root, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (path.resolve(base) !== path.resolve(root)) return null;
    const sha = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
  } catch {
    return null; // Unit-test fixture or a source snapshot without Git metadata.
  }
}

export function copyFingerprint(target, copied) {
  if (!Array.isArray(copied)) throw new Error("invalid sync manifest: copied must be a list");
  const hash = createHash("sha256");
  function walk(full, rel) {
    const st = fs.lstatSync(full);
    if (st.isDirectory()) {
      hash.update("dir\0" + rel + "\0");
      for (const name of fs.readdirSync(full).sort()) walk(path.join(full, name), rel + "/" + name);
    } else if (st.isFile()) {
      hash.update("file\0" + rel + "\0");
      hash.update(fs.readFileSync(full));
      hash.update("\0");
    } else {
      throw new Error("managed copy contains an unsupported file type or symlink");
    }
  }
  for (const rel of [...copied].sort()) {
    if (typeof rel !== "string" || !SAFE.test(rel) || [".", ".."].includes(rel.split("/").at(-1))) {
      throw new Error("invalid managed path in sync manifest");
    }
    walk(path.join(target, rel), rel);
  }
  return hash.digest("hex");
}

export function checkSync(target, root = ROOT) {
  const file = path.join(target, MANIFEST);
  if (!fs.existsSync(file)) return { status: "missing", reason: "No managed-copy manifest. Run the central sync." };
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { status: "invalid", reason: "The managed-copy manifest is not valid JSON." };
  }
  if (!manifest.snapshot_sha256 || !manifest.source_revision) {
    return { status: "legacy", reason: "This copy predates revision and fingerprint tracking. Resync once." };
  }
  let observed;
  try {
    observed = copyFingerprint(target, manifest.copied);
  } catch {
    return { status: "modified", reason: "A managed file is missing, unsafe or not readable. Check the local copy." };
  }
  if (observed !== manifest.snapshot_sha256) {
    return { status: "modified", reason: "Managed skill or agent files differ from the recorded snapshot." };
  }
  const current = sourceRevision(root);
  if (!current) return { status: "unverifiable", reason: "The central source checkout has no Git revision." };
  if (current !== manifest.source_revision) {
    return { status: "outdated", reason: "The central source commit has changed since this project was synced.", source_revision: manifest.source_revision, latest_revision: current };
  }
  return { status: "current", source_revision: current };
}
