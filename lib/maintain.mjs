// The upkeep of the knowledge base: scaffold a learning, and report what needs a human.
import fs from "node:fs";
import path from "node:path";
import { BUDGET, render, tokens } from "./kb.mjs";

export const STALE_DAYS = 120;
export const RAW_DAYS = 14;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const list = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
const age = (from, today) => Math.floor((Date.parse(today) - Date.parse(from)) / 86400000);

// Writes learnings/<date>-<slug>.md from the template in learnings/README.md, with TODOs
// that `node --test` refuses to let through until they are written. Returns the path.
export function newLearning(root, slug, { date = new Date().toISOString().slice(0, 10), source = "ogfrench/claude-code-setup" } = {}) {
  if (!SLUG.test(slug)) throw new Error("slug: lowercase words joined by hyphens");
  const file = path.join(root, "learnings", `${date}-${slug}.md`);
  if (fs.existsSync(file)) throw new Error(`${path.relative(root, file)} exists`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---
date: ${date}
source: ${source}
tags: []
status: raw
promoted_to: []
---

# TODO: one line that states the lesson

**What happened.** TODO

**Why.** TODO

**Do instead.** TODO

**Evidence.** TODO
`);
  return path.relative(root, file);
}

// A read-only report. Nothing here fails a build: dates move on their own, commits do not.
export function audit(kb, today = new Date().toISOString().slice(0, 10)) {
  const act = kb.practices.filter((p) => p.status === "active");
  const files = render(kb);
  const size = (rel) => tokens(files.get(rel) ?? "");
  const bundles = [...files.keys()].filter((k) => k.startsWith("kb/bundles/"));
  return {
    today,
    stalePractices: act.filter((p) => age(p.last_verified, today) > STALE_DAYS).map((p) => p.id),
    staleTools: kb.tools.filter((t) => t.state === "installed" && age(t.last_reviewed, today) > STALE_DAYS).map((t) => t.id),
    markedStale: kb.practices.filter((p) => p.status === "stale").map((p) => p.id),
    rawLearnings: kb.learnings.filter((l) => l.status === "raw" && age(l.date, today) > RAW_DAYS).map((l) => l.id),
    promotionCandidates: act.filter((p) => list(p.derived_from).length >= 2 && !list(p.implemented_by).length).map((p) => p.id),
    judgmentOnly: act.filter((p) => p.source === "judgment").map((p) => p.id),
    headroom: {
      index: BUDGET.index - size("kb/INDEX.md"),
      largestBundle: BUDGET.bundle - Math.max(0, ...bundles.map(size)),
      largestCard: BUDGET.practiceCard - Math.max(0, ...act.map((p) => p.tokens)),
    },
  };
}

export function formatAudit(a) {
  const rows = (title, ids, hint) => `${title}: ${ids.length ? ids.join(", ") : "none"}${ids.length && hint ? `\n    ${hint}` : ""}`;
  return [
    `Knowledge audit, ${a.today}`,
    rows(`Practices unverified over ${STALE_DAYS} days`, a.stalePractices, "Re-check each. Still true: bump last_verified. Not: status stale (leaves the bundles) or retired."),
    rows(`Tools unreviewed over ${STALE_DAYS} days`, a.staleTools, "Check the upstream changelog, then bump last_reviewed, or set state retired."),
    rows("Marked stale, awaiting a decision", a.markedStale),
    rows(`Raw learnings older than ${RAW_DAYS} days`, a.rawLearnings, "Curate into a practice (extend one if it exists), or retire the learning."),
    rows("Promotion candidates (2 or more learnings, nothing enforces them)", a.promotionCandidates, "A skill, hook or script? See the ladder in CLAUDE.md."),
    rows("Practices resting on judgment alone", a.judgmentOnly, "Find the learning that backs each, or keep them as tips."),
    `Token headroom: index ${a.headroom.index}, largest bundle ${a.headroom.largestBundle}, largest card ${a.headroom.largestCard}`,
    "",
  ].join("\n");
}
