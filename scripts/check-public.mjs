#!/usr/bin/env node
// This repo is public. Fail if it would carry anything that must stay private:
//   - a private term: a client, employer or project name, from a list kept out of git
//   - an ogfrench repo not listed in public-repos.txt (a repo's name can name a client)
//   - an email address, other than the no-reply ones commits use
//   - an IPv4 address
//
//   node scripts/check-public.mjs                   every tracked file, and its path
//   node scripts/check-public.mjs <git log args>    lines, paths and messages those commits add
//                                                   (the pre-push hook and CI pass a range)
//
// The private terms never go in the repo. They come from `.private-terms` (gitignored,
// one per line, `#` comments) or the PRIVATE_TERMS env var (a CI secret, same format).
// A finding names the file, the line and the rule, never the text: CI logs are public too.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "ogfrench";
const ALLOWED_EMAILS = [/^noreply@anthropic\.com$/i, /^noreply@github\.com$/i, /@users\.noreply\.github\.com$/i, /^git@github\.com$/i];

const lines = (text) => text.split(/\r?\n/).map((l) => l.replace(/#.*$/, "").trim()).filter(Boolean);
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function loadRules(env = process.env, root = ROOT) {
  const termsFile = path.join(root, ".private-terms");
  const terms = [
    ...(env.PRIVATE_TERMS ? lines(env.PRIVATE_TERMS) : []),
    ...(fs.existsSync(termsFile) ? lines(fs.readFileSync(termsFile, "utf8")) : []),
  ];
  const publicRepos = new Set(
    lines(fs.readFileSync(path.join(root, "public-repos.txt"), "utf8")).map((r) => r.toLowerCase()),
  );
  return { terms, publicRepos };
}

// Every finding in one line of text, as rule names.
export function scan(text, { terms, publicRepos }) {
  const found = [];
  terms.forEach((term, i) => {
    if (new RegExp(`(?<![A-Za-z0-9])${escape(term)}(?![A-Za-z0-9])`, "i").test(text)) {
      found.push(`private term #${i + 1}`);
    }
  });
  for (const [, raw] of text.matchAll(new RegExp(`(?<![A-Za-z0-9])${OWNER}/([A-Za-z0-9._-]+)`, "gi"))) {
    const name = raw.replace(/\.+$/, "").replace(/\.git$/i, "");
    if (!publicRepos.has(`${OWNER}/${name}`.toLowerCase())) found.push("a repo not in public-repos.txt");
  }
  for (const [email] of text.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
    if (!ALLOWED_EMAILS.some((re) => re.test(email))) found.push("an email address");
  }
  for (const [ip] of text.matchAll(/(?<![\d.])(\d{1,3}\.){3}\d{1,3}(?![\d.])/g)) {
    if (ip !== "127.0.0.1" && ip !== "0.0.0.0") found.push("an IP address");
  }
  return found;
}

const git = (...args) => execFileSync("git", ["-C", ROOT, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });

// [where, text] pairs for every tracked file and its path.
function treeLines() {
  const out = [];
  for (const file of git("ls-files", "-z").split("\0").filter(Boolean)) {
    out.push([`${file} (path)`, file]);
    const buf = fs.readFileSync(path.join(ROOT, file));
    if (buf.includes(0)) continue; // binary
    buf.toString("utf8").split("\n").forEach((l, i) => out.push([`${file}:${i + 1}`, l]));
  }
  return out;
}

// [where, text] pairs for what a set of commits adds: messages, paths and added lines.
function commitLines(revs) {
  const out = [];
  for (const sha of git("rev-list", ...revs).split("\n").filter(Boolean)) {
    const short = sha.slice(0, 7);
    git("log", "-1", "--format=%an <%ae>%n%B", sha).split("\n").forEach((l) => out.push([`${short} (message)`, l]));
    for (const file of git("show", "--format=", "--name-only", sha).split("\n").filter(Boolean)) {
      out.push([`${short} ${file} (path)`, file]);
    }
    let file = "";
    for (const l of git("show", "--format=", "--unified=0", "--no-color", sha).split("\n")) {
      if (l.startsWith("+++ ")) file = l.slice(6);
      else if (l.startsWith("+")) out.push([`${short} ${file}`, l.slice(1)]);
    }
  }
  return out;
}

export function check(pairs, rules) {
  const findings = [];
  for (const [where, text] of pairs) for (const rule of scan(text, rules)) findings.push(`${where}: ${rule}`);
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const revs = process.argv.slice(2);
  const rules = loadRules();
  const findings = check(revs.length ? commitLines(revs) : treeLines(), rules);
  if (!rules.terms.length) {
    console.error("note: no private terms loaded (.private-terms or PRIVATE_TERMS); only the generic rules ran");
  }
  if (findings.length) {
    console.error(`This repo is public, and ${findings.length} thing(s) must not be in it:`);
    for (const f of findings) console.error(`  ${f}`);
    process.exit(1);
  }
}
