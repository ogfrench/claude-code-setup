---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [testing]
status: raw
promoted_to: []
---

# Run one test suite at a time against a shared local stack

**What happened.** The backend suite was run against the local stack's database and cache while browser specs were running on the same stack. Every repeat of the browser spec timed out on a page that normally loads in a second.

**Why.** Both suites share the stack's services and its per-address rate limits, and the backend suite resets state it owns. The browser spec's failures said nothing about the code under test.

**Do instead.** Never overlap two suites on one stack. If they must run together, give the second its own stack, database and cache. Discard any result from an overlapped run and rerun it alone before believing it.

**Evidence.** The same spec, rerun alone on a fresh stack, behaved normally.
