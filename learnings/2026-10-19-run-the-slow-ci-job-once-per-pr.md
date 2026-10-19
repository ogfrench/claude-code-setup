---
date: 2026-10-19
source: a private project
tags: [ci, cost]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/actions-cost/SKILL.md
  - kb/practices/estimate-runner-minutes.md
---

# Run the slow CI job once per PR, keep the per-push job near a minute, and watch its creep

**What happened.** In a private repository the fast CI job was meant to take about a minute
and the browser job about twenty, and both ran on every push. After the browser job was
limited to once per pull request, the fast job turned out to take twelve minutes. It had
grown from one to eight to twelve without anyone noticing, a step at a time. Two things were
most of it: a test waited 75 seconds on a client library retrying a store that was down on
purpose (the process was idle, not working), and the site was built twice, once inside the
unit tests and once as its own step.

**Why.** A per-push job is paid for on every push of every PR, so each minute in it is
multiplied by the number of pushes. Nobody owns a job's duration, so it creeps. Speed is not
the same as "needs a browser": the slow parts were waiting and repeating, found only by
reading the step times of a real run and timing each step locally.

**Do instead.** Open PRs as drafts and run the slow, browser-backed job once, when the PR is
marked ready for review, in its own concurrency group so a push right after cannot cancel it.
Keep the per-push job to about a minute or two, give it a `timeout-minutes` as a fence, and
when a step pushes it over, move that step to the once-per-PR job whole or make it faster;
never sample the tests to fit. Skip a docs-only PR inside the heavy job with `if:` on a
changed-files step, not with `paths-ignore`, because a required check that never starts stays
pending forever. Look for steps that build the same thing twice.

**Evidence.** Seen once, at a cost: the step times of a push run (6 min 47 s of unit tests,
77 s for one test file, 3 min 23 s for the site build) against a local profile of the same
test file (2.4 s of CPU, 77 s idle). After the changes the same steps took about 70 seconds on a busy four-core machine.
