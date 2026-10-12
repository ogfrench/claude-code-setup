#!/usr/bin/env node
// This repo is public. Fail if it would carry anything that must stay private:
//   - an ogfrench repo not listed in public-repos.txt (a repo's name can name a client)
//   - an email address, other than the no-reply and documentation ones
//   - an IPv4 address, other than loopback and the documentation ranges
//
//   node scripts/check-public.mjs                        every tracked file, and its path
//   node scripts/check-public.mjs <git log args>         what those commits add: lines, paths,
//                                                        messages, author and committer
//   --ref <name>      also check a ref name, and a tag's own message (the hook passes each ref)
//
// A finding names the place and the rule, never the text: CI logs are public too.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OWNER = "ogfrench";
const ALLOWED_EMAILS = [
  /^noreply@anthropic\.com$/i,
  /^noreply@github\.com$/i,
  /@users\.noreply\.github\.com$/i,
  /^git@github\.com$/i,
  /@example\.(com|org|net)$/i, // reserved for documentation (RFC 2606)
];
// What follows an @ in a file name (icon@2x.png) rather than an address.
const FILE_SUFFIX = /\.(png|jpe?g|gif|svg|webp|avif|ico|js|mjs|ts|css|md|json|ya?ml|txt)$/i;
const ALLOWED_IP = /^(127\.0\.0\.1|0\.0\.0\.0|192\.0\.2\.\d+|198\.51\.100\.\d+|203\.0\.113\.\d+)$/;

// Text from bytes: UTF-8, or UTF-16 by its byte-order mark (PowerShell's `>` writes UTF-16).
export function decode(buf) {
  if (buf[0] === 0xff && buf[1] === 0xfe) return { text: buf.subarray(2).toString("utf16le"), binary: false };
  if (buf[0] === 0xfe && buf[1] === 0xff) {
    const swapped = Buffer.from(buf.subarray(2));
    swapped.swap16();
    return { text: swapped.toString("utf16le"), binary: false };
  }
  if (buf.includes(0)) return { text: buf.toString("latin1"), binary: true };
  return { text: buf.toString("utf8").replace(/^﻿/, ""), binary: false };
}

const listLines = (text) =>
  text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
export function loadRules(env = process.env, root = ROOT) {
  const publicRepos = new Set(
    listLines(fs.readFileSync(path.join(root, "public-repos.txt"), "utf8")).map((r) => r.toLowerCase()),
  );
  return { publicRepos };
}

// Rule names for the line-shaped rules: repos, emails, IPs.
function lineRules(line, publicRepos) {
  const found = [];
  for (const [, raw] of line.matchAll(new RegExp(`(?<![A-Za-z0-9])${OWNER}/([A-Za-z0-9._-]+)`, "gi"))) {
    const name = raw.replace(/\.+$/, "").replace(/\.git$/i, "");
    if (!publicRepos.has(`${OWNER}/${name}`.toLowerCase())) found.push("a repo not in public-repos.txt");
  }
  for (const [email] of line.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
    if (!ALLOWED_EMAILS.some((re) => re.test(email)) && !FILE_SUFFIX.test(email)) found.push("an email address");
  }
  for (const [ip] of line.matchAll(/(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?!\d|\.\d)/g)) {
    if (!ALLOWED_IP.test(ip)) found.push("an IP address");
  }
  return found;
}

// Every finding in one line of text, as rule names. Kept for one-line checks and tests.
export function scan(text, rules) {
  return lineRules(text, rules.publicRepos);
}

// Findings in a block of text (a file, a message), each as "<where>:<line>: <rule>".
export function scanBlock(where, text, rules, { binary = false } = {}) {
  const out = [];
  if (binary) return out;
  text.split("\n").forEach((line, i) => {
    for (const rule of lineRules(line, rules.publicRepos)) out.push(`${where}:${i + 1}: ${rule}`);
  });
  return out;
}

// A path is printed only if it is clean itself; otherwise its findings name it by number.
function namer(rules) {
  let n = 0;
  const seen = new Map();
  return (file) => {
    if (!seen.has(file)) seen.set(file, scan(file, rules).length ? `<flagged file name #${++n}>` : file);
    return seen.get(file);
  };
}

const git = (...args) =>
  execFileSync("git", ["-C", ROOT, "-c", "core.quotePath=false", ...args], { maxBuffer: 1 << 28 });
const gitText = (...args) => git(...args).toString("utf8");

function checkTree(rules) {
  const name = namer(rules);
  const out = [];
  for (const file of gitText("ls-files", "-z").split("\0").filter(Boolean)) {
    for (const rule of scan(file, rules)) out.push(`${name(file)} (its name): ${rule}`);
    let buf;
    try {
      buf = fs.readFileSync(path.join(ROOT, file));
    } catch {
      buf = git("cat-file", "blob", `:${file}`); // tracked, but gone from the working tree
    }
    const { text, binary } = decode(buf);
    out.push(...scanBlock(name(file), text, rules, { binary }));
  }
  return out;
}

function checkCommits(revs, rules) {
  const name = namer(rules);
  const out = [];
  for (const sha of gitText("rev-list", ...revs).split("\n").filter(Boolean)) {
    const short = sha.slice(0, 7);
    const people = gitText("log", "-1", "--format=%an <%ae>%n%cn <%ce>", sha);
    out.push(...scanBlock(`${short} (author, committer)`, people, rules));
    out.push(...scanBlock(`${short} (message)`, gitText("log", "-1", "--format=%B", sha), rules));
    // Added lines, per file. Header lines are read only between `diff --git` and the
    // first hunk, so an added line that starts with "++" is never taken for one.
    const added = new Map();
    let file = "";
    let header = false;
    for (const l of gitText("show", "--format=", "--unified=0", "--no-color", "--no-ext-diff", sha).split("\n")) {
      if (l.startsWith("diff --git") || l.startsWith("diff --cc") || l.startsWith("diff --combined")) header = true;
      else if (header && l.startsWith("+++ ")) file = l.slice(4).replace(/^b\//, "");
      else if (l.startsWith("@@")) header = false;
      else if (!header && /^\+{1,2}/.test(l)) {
        if (!added.has(file)) added.set(file, []);
        added.get(file).push(l.replace(/^\+{1,2}/, ""));
      }
    }
    for (const f of gitText("show", "--format=", "--name-only", sha).split("\n").filter(Boolean)) {
      for (const rule of scan(f, rules)) out.push(`${short} ${name(f)} (its name): ${rule}`);
    }
    for (const [f, lines] of added) out.push(...scanBlock(`${short} ${name(f)} (added)`, lines.join("\n"), rules));
  }
  return out;
}

function checkRef(ref, rules) {
  const out = scan(ref, rules).map((rule) => `a ref name: ${rule}`);
  try {
    if (gitText("cat-file", "-t", ref).trim() === "tag") {
      out.push(...scanBlock("a tag's message", gitText("cat-file", "-p", ref), rules));
    }
  } catch {
    /* a ref this clone does not have */
  }
  return out;
}

export function main(argv, env = process.env) {
  const refs = [];
  const revs = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ref") refs.push(argv[++i]);
    else revs.push(argv[i]);
  }
  const rules = loadRules(env);
  const findings = [
    ...refs.flatMap((r) => checkRef(r, rules)),
    ...(revs.length ? checkCommits(revs, rules) : checkTree(rules)),
  ];
  if (findings.length) {
    console.error(`This repo is public, and ${findings.length} thing(s) must not be in it:`);
    for (const f of findings) console.error(`  ${f}`);
    return 1;
  }
  return 0;
}

const invoked = process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invoked) process.exitCode = main(process.argv.slice(2));
