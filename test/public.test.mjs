// This repo is public: the tree carries nothing private, and the check that says so works.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { check, loadRules, scan } from "../scripts/check-public.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");

test("the tree carries nothing private", () => {
  // Runs the script itself, so the private terms from .private-terms or the CI secret apply.
  execFileSync("node", ["scripts/check-public.mjs"], { cwd: ROOT, stdio: "pipe" });
});

test("the check finds each kind of leak, and names it without repeating it", () => {
  const rules = { terms: ["Acme Bank", "zork"], publicRepos: new Set(["ogfrench/claude-code-setup"]) };
  assert.deepEqual(scan("a deck for acme bank", rules), ["private term #1"]);
  // Built at runtime: written out, these would trip the check on this very file.
  assert.deepEqual(scan(`see ${["ogfrench", "zork-rfp-2026"].join("/")}`, rules), [
    "private term #2",
    "a repo not in public-repos.txt",
  ]);
  assert.deepEqual(scan(`mail ${["jane.doe", "example.com"].join("@")}`, rules), ["an email address"]);
  assert.deepEqual(scan(`the box at ${[10, 0, 4, 17].join(".")}`, rules), ["an IP address"]);
  assert.deepEqual(check([["notes.md:3", "ACME BANK"]], rules), ["notes.md:3: private term #1"]);
});

test("the check lets through what is meant to be here", () => {
  const rules = { terms: ["zork"], publicRepos: new Set(["ogfrench/claude-code-setup"]) };
  for (const ok of [
    "git clone https://github.com/ogfrench/claude-code-setup.git",
    "From ogfrench/claude-code-setup.",
    "Co-Authored-By: Claude <noreply@anthropic.com>",
    "Frenchie <42068679+ogfrench@users.noreply.github.com>",
    "caveman@ogfrench",
    "zorkish is a different word",
    "v1.2.3 and 127.0.0.1",
  ]) {
    assert.deepEqual(scan(ok, rules), [], ok);
  }
});

test("public-repos.txt lists only this owner's repos", () => {
  for (const repo of loadRules({}, ROOT).publicRepos) assert.match(repo, /^ogfrench\/[a-z0-9._-]+$/);
});
