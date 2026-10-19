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

## A job that fails in one or two seconds with no runner and no log

That is billing, not code: the month's minutes or the spending limit are used up. Do not
rerun it, do not push "fixes", and do not merge on the strength of an old green run without
saying so. Tell the owner, who sees usage in the account's billing settings. Comment once on
each PR it blocks, saying the failure is not that PR's.
