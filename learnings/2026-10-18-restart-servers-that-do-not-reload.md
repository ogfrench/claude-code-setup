---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [testing]
status: raw
promoted_to: []
---

# After a server change, restart a dev server that does not reload before trusting an end-to-end run

**What happened.** A server-side race was fixed and its unit tests passed. The end-to-end spec for the same race then ran against a local stack whose API had been started before the fix, without auto-reload, so it exercised the old code.

**Why.** The frontend dev server hot-reloads, which makes the whole stack feel live. The API process did not, and nothing on screen says which code a server is running.

**Do instead.** After changing server code, restart any process that does not reload, or check its start time against the change, before reading anything into an end-to-end result.

**Evidence.** Caught before any result was trusted: the stack log showed the API's start predating the commit. The spec was rerun on a restarted stack.
