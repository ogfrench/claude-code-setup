---
date: 2026-10-17
source: a private project
tags: [ci, cost]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
  - plugins/agent-workflow/skills/actions-cost/SKILL.md
---

# Estimate a workflow's runner-minutes before merging what triggers it

**What happened.** In a private repository, a workflow that prebuilt every artifact across a
matrix of eight variants (about 230 runner-minutes a run) fired on each merge that touched
shared code, and the slow browser job ran on the pull request and again after the merge. Two
such merges in one day used up the month's paid Actions budget and stopped all CI.

**Why.** Cost is jobs times minutes times triggers, and none of the three shows in the diff:
a version bump or an edit to a shared package looks small and fans out to every matrix cell.

**Do instead.** Before merging, read the trigger paths, estimate the runner-minutes from a
recent run, and say the number when it is large. Prefer making an artifact on demand and
caching it over prebuilding a matrix. Do not repeat on the default branch a slow job the pull
request already ran on its merge commit. A job that fails in a second or two with no runner
and no log is a billing limit: stop, tell the owner, do not retry.

**Evidence.** Seen once, at a cost: the run list showed eight parallel jobs of about 28
minutes each per merge, and every later job failed in one or two seconds with no runner.
