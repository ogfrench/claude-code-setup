---
name: actions-cost
description: >-
  Estimate Actions runner-minutes before merging a workflow trigger; a job
  failing in seconds with no log is billing.
---

# Actions minutes cost money

In a private repository, every runner-minute past the month's free allowance is billed, and
larger runners are billed from the first minute. Cost is jobs × minutes × triggers, and none
of the three shows in a diff: a version bump or an edit to a shared package looks small and
fans out to every cell of a matrix. Two merges in one day once used a month's budget and
stopped all CI.

## Before a merge or push that starts a workflow

1. **List what it starts.** Read the `on:` triggers and `paths` of each workflow in
   `.github/workflows/` against the files the change touches. A merge to the default branch
   starts the `push` workflows; a push to a PR branch starts the `pull_request` ones.
2. **Estimate it:** jobs × minutes a job × how many times it runs. Read the minutes from a
   recent run of the same workflow (`gh run list`, `gh run view --json jobs`, or the GitHub
   MCP's run and job listings). Write the repo's usual figures in its `CLAUDE.md`, so the
   next session does not have to measure again.
3. **Over about an hour of runner-minutes for one change, say so before merging**, with the
   number. Batch it with other changes that rebuild the same things, rather than merging
   them one by one.
4. **Push once, validated.** Each push to a PR reruns its CI. Run the fast checks locally
   first (type check, the changed tests, linters), then push.

## When you add or change a workflow

- **On demand and cached beats a prebuilt matrix.** Make an artifact when someone asks and
  keep it for the next person, rather than making every combination after every merge.
- **Never run the same slow job twice for one change.** A PR's CI already tested its merge
  commit, so the slow job need not run again on the default branch after the merge.
- **A matrix multiplies everything.** Write its job count, and its minutes on a full
  rebuild, in the workflow's header comment.
- **Skip work whose inputs did not change**, and give a scheduled rebuild the same skip.
- **Use `concurrency` with `cancel-in-progress`** on anything a newer push makes stale.

## Shape the pipeline: a fast job on every push, a slow one once per PR

- **Run the slow, browser-backed job once per pull request,** when it is marked ready for
  review (and by hand for a PR that changed afterward). Open PRs as drafts, so the pushes
  while the work changes cost only the fast job. Give the ready run its own `concurrency`
  group, or a push right after "ready" cancels the one run that carries the slow job.
- **Keep the per-push job to about a minute or two, and watch its creep.** A job nobody owns
  grows a step at a time: one went from 1 to 8 to 12 minutes unnoticed. Set
  `timeout-minutes` as a fence. When a step pushes it over, move the step whole to the
  once-per-PR job, or make it faster; never sample the tests (`--changed`) to fit, and never
  drop a step. First find where the time goes: the step times of a recent run, then `time`
  each step locally, and ask whether a slow step is working or waiting (a CPU profile that
  shows most of the time idle means a retry or a sleep).
- **Do the same work once.** A test that builds what a later step builds is one build, run
  first, with the later step reading its output.
- **Skip a docs-only PR inside the job, not with `paths-ignore`.** A workflow that never
  starts leaves a required check pending forever. Start the job, run a first step that
  diffs the PR against its base (checkout `fetch-depth: 2` gives the merge commit's first
  parent), and put `if:` on the rest; a job of skipped steps reports success. Call a file
  prose only if no code reads it, and treat anything unclear as not prose.

## Estimate a month

Runs × billed minutes per run × the per-minute rate, minus the free quota. Each job rounds up
to a whole minute and parallel jobs bill separately, so add them; a skipped job bills nothing.

## A job that fails in one or two seconds with no runner and no log

That is billing, not code: the month's minutes or the spending limit are used up. Do not
rerun it, do not push "fixes", and do not merge on the strength of an old green run without
saying so. Tell the owner, who sees usage in the account's billing settings. Comment once on
each PR it blocks, saying the failure is not that PR's.
