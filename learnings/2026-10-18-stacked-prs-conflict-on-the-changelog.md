---
date: 2026-10-18
source: a private project
tags: [git, ci, changelog]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
---

# Stacked pull requests that each add a line at the top of the changelog conflict in turn

**What happened.** Four pull requests opened the same night each added one line under
`## Unreleased`. Each merge made the next one unmergeable, and GitHub does not run
pull-request CI on a conflicting branch, so every merge cost a conflict fix and a full CI
rerun (about 15 runner-minutes each).

**Why.** Every branch edits the same lines at the same place, so every merge conflicts with
every branch still open.

**Do instead.** For stacked work, write the changelog line at merge time, or keep one file
per change and generate the changelog. `CHANGELOG.md merge=union` in `.gitattributes` helps
only a local merge; GitHub's merge button ignores it.

**Evidence.** Seen once: every merge after the first needed a conflict fix and a full CI
rerun, for a one-line entry.
