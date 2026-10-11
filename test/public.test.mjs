// This repo is public: the tree carries nothing private, and the check that says so works.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { decode, loadRules, scan, scanBlock, termPattern } from "../scripts/check-public.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SCRIPT = path.join(ROOT, "scripts/check-public.mjs");
const rulesFor = (terms, repos = ["ogfrench/claude-code-setup"]) => ({
  terms,
  patterns: terms.map(termPattern),
  publicRepos: new Set(repos),
});
// Built at runtime: written out, these would trip the check on this very file.
const join = (...parts) => parts.join("");

test("the tree carries nothing private", () => {
  // Runs the script itself, so the private terms from .private-terms or the CI secret apply.
  execFileSync("node", [SCRIPT], { cwd: ROOT, stdio: "pipe" });
});

test("a term matches whatever separates its words, in any case", () => {
  const rules = rulesFor(["Acme Bank", "zork"]);
  for (const text of ["a deck for acme bank", "AcmeBank", "acme-bank", "acme_bank", "acme\u00a0bank", "acme  bank"]) {
    assert.deepEqual(scan(text, rules), ["private term #1"], text);
  }
  for (const text of ["zorks", "zorkClient", "zork2026", "the-zork-deck.md", "myZorkDeck"]) {
    assert.deepEqual(scan(text, rules), ["private term #2"], text);
  }
  // Not inside a word that merely holds it.
  for (const text of ["bizork", "unzorked"]) assert.deepEqual(scan(text, rules), [], text);
  // Wrapped over two lines of one file.
  assert.deepEqual(scanBlock("notes.md", "a deck for Acme\nBank, due Friday", rules), ["notes.md:1: private term #1"]);
});

test("the generic rules", () => {
  const rules = rulesFor([]);
  assert.deepEqual(scan(`see ${join("ogf", "rench/zork-rfp-2026")}`, rules), ["a repo not in public-repos.txt"]);
  assert.deepEqual(scan(`mail ${join("jane.doe", "@", "bigcorp.com")}`, rules), ["an email address"]);
  assert.deepEqual(scan(`the box at ${join("10.0.", "4.17")}.`, rules), ["an IP address"]);
});

test("the check lets through what is meant to be here", () => {
  const rules = rulesFor(["zork"]);
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
  const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("zork\r\n", "utf16le")]);
  assert.equal(decode(utf16).text.trim(), "zork");
  assert.equal(decode(utf16).binary, false);
});

test("with --require-terms and no terms, the check refuses", () => {
  const run = spawnSync("node", [SCRIPT, "--require-terms"], {
    cwd: ROOT,
    env: { ...process.env, PRIVATE_TERMS: "" },
    encoding: "utf8",
  });
  // A clone with its own .private-terms has terms, so this only holds without one.
  if (loadRules({}, ROOT).terms.length === 0) {
    assert.equal(run.status, 1);
    assert.match(run.stderr, /no private terms loaded/);
  }
});

test("public-repos.txt lists only this owner's repos", () => {
  for (const repo of loadRules({}, ROOT).publicRepos) assert.match(repo, /^ogfrench\/[a-z0-9._-]+$/);
});
