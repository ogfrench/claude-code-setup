---
date: 2026-10-11
source: a private project
tags: [data, jobs]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/data-and-concurrency.md
---

# Every cleanup job must know about every hold, or the hold is decoration

**What happened.** A file in use by a running game was held instead of deleted. A separate orphan sweep, which deletes any old upload no record names, knew nothing of the hold and could delete it mid-game anyway.

**Why.** Holds were added to the three paths being fixed; the fourth deleter was in another file and ran on a schedule.

**Do instead.** When adding a hold, list every code path that deletes the thing (grep for the delete call and for cron jobs) and make each one respect it. Test the sweep, not only the paths you changed.

**Evidence.** A commit in a quiz app, found by a cheap review.
