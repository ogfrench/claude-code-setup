---
date: 2026-10-11
source: a private project
tags: [data, concurrency, redis]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/data-and-concurrency.md
---

# Claim a shared list in one step, or two consumers both act on it

**What happened.** Images held for a running game were released by reading the held set, deleting it, then freeing each. A game ended twice, or a job and a sweep together, both read the set first and refunded the storage twice.

**Why.** Read-then-delete is two steps; anything that runs between them sees the same items.

**Do instead.** Claim with one atomic operation (a Redis `MULTI` of read and delete, `SPOP`, or a conditional `UPDATE ... WHERE` that reports the rows it changed). Put items back if the work after the claim fails.

**Evidence.** A quiz app's image-release test: two releases at once freed twice on the old code.
