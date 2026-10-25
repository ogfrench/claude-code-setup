---
date: 2026-10-25
source: a private project
tags: [ci, cost]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/actions-cost/SKILL.md
  - kb/practices/estimate-runner-minutes.md
---

# Batch related changes into one release PR, then run the expensive end-to-end suite once

**What happened.** In a private repository the end-to-end job took about forty minutes of
runner time and ran when a PR was marked ready. One day's work split naturally into several
PRs: a design change, a backend feature, follow-up fixes, then the fixes a review found. Each
one marked ready would have paid for its own run, four or five runs for one release. The owner
asked twice, a week apart, for the opposite: build on one branch, open one PR at the end, run
the suite once, and fold review fixes into that same PR.

**Why.** The heavy job's cost is per run, not per line changed, so splitting a release into
small PRs multiplies it. A separate PR for each review fix is the worst case: the fix is
small, the run is not. Pushing more commits to a PR that already ran does not re-run the job
when the job is gated on "ready" or a label, so later fixes ride along for free; a fresh
local run of the touched specs stands in for them.

**Do instead.** Plan the release as one branch and one PR. Merge the parts into it rather
than opening one PR each. Run the touched specs locally as you go, mark the PR ready once
(the one CI run), and push review fixes to the same PR, adding the re-run label only when a
fix is risky. A small change with no live-game or protocol impact can ship on its own with
the skip label, after its specs pass locally. Say in the PR which specs ran locally after
the CI run.

**Evidence.** Seen twice in one week, at the owner's request: a release built from three
open PRs merged into one integration PR with one end-to-end run, and a day's design work plus
its follow-up fixes shipped as one PR instead of three.
