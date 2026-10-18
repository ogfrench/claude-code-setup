---
date: 2026-10-18
source: a private project
tags: [git, review]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
---

# A before/after sheet against a stale local main compares the change with the past

**What happened.** A screenshot review tool built "before" from `main` by default. In a
long-lived clone the local `main` had not moved for weeks, about sixty merges behind
`origin/main`, so the sheet compared the change against an old site. It looked plausible
until someone checked the commit the tool printed.

**Why.** Work happens in worktrees branched from `origin/main`, and nothing ever
fast-forwards the local `main` ref.

**Do instead.** `git fetch origin main` and compare against `origin/main`, and read the sha a
review prints before trusting its sheet. Better, make such tools default to the
remote-tracking branch.

**Evidence.** The review printed a commit from weeks earlier as its baseline.
