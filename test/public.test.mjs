// This repo is public: the tree carries nothing private, and the check that says so works.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { decode, loadRules, scan } from "../scripts/check-public.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SCRIPT = path.join(ROOT, "scripts/check-public.mjs");
const rulesFor = (repos = ["ogfrench/claude-code-setup"]) => ({ publicRepos: new Set(repos) });
// Built at runtime: written out, these would trip the check on this very file.
const join = (...parts) => parts.join("");

test("the tree carries nothing private", () => {
  execFileSync("node", [SCRIPT], { cwd: ROOT, stdio: "pipe" });
});

test("the generic rules", () => {
  const rules = rulesFor();
  assert.deepEqual(scan(`see ${join("ogf", "rench/zork-rfp-2026")}`, rules), ["a repo not in public-repos.txt"]);
  assert.deepEqual(scan(`mail ${join("jane.doe", "@", "bigcorp.com")}`, rules), ["an email address"]);
  assert.deepEqual(scan(`the box at ${join("10.0.", "4.17")}.`, rules), ["an IP address"]);
});

test("GitHub's default merge message is not mistaken for a repo", () => {
  const rules = rulesFor();
  assert.deepEqual(scan(`Merge pull request #7 from ${join("ogf", "rench/some-branch")}`, rules), []);
  assert.deepEqual(scan(`see Merge pull request #7 from ${join("ogf", "rench/some-branch")} and more`, rules), ["a repo not in public-repos.txt"]);
});

test("the check lets through what is meant to be here", () => {
  const rules = rulesFor();
  for (const ok of [
    "git clone https://github.com/ogfrench/claude-code-setup.git",
    "From ogfrench/claude-code-setup.",
    "Co-Authored-By: Claude <noreply@anthropic.com>",
    "Frenchie <42068679+ogfrench@users.noreply.github.com>",
    "caveman@ogfrench",
    "write to you@example.com",
    "icon@2x.png",
    "v1.2.3, 127.0.0.1 and 192.0.2.10",
  ]) {
    assert.deepEqual(scan(ok, rules), [], ok);
  }
});

test("a UTF-16 file is read, not skipped", () => {
  const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("hello\r\n", "utf16le")]);
  assert.equal(decode(utf16).text.trim(), "hello");
  assert.equal(decode(utf16).binary, false);
});

test("public-repos.txt lists only this owner's repos", () => {
  for (const repo of loadRules({}, ROOT).publicRepos) assert.match(repo, /^ogfrench\/[a-z0-9._-]+$/);
});
