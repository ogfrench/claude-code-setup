---
date: 2026-10-11
source: a private project
tags: [data, concurrency, orm]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/data-and-concurrency.md
---

# An ORM's whole-row update from a stale read reverts other people's writes

**What happened.** A view counter, a game launch, a rating, a moderation flag and even the editor's own save each loaded a row early and called `update()`, which wrote every column. Whatever landed in between was put back, including a claim that made a quiz anonymous again.

**Why.** `update()` with no column list writes the object as it was read, not just what changed.

**Do instead.** Counters are one SQL statement (`SET n = n + 1`). Other writers name their columns (`update(_columns=[...])` in ormar). A whole-row write is a bug unless the writer really sets every field.

**Evidence.** Two commits in a quiz app, with tests that fail on the old writes.
