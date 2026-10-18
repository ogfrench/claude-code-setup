---
date: 2026-10-11
source: a private project
tags: [testing, concurrency]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/testing.md
---

# Test a race by landing the second write inside the window, not by timing

**What happened.** A page view loaded a row, added one to a counter and wrote the whole row back, undoing any save in between. A timing-based test would pass or fail by luck.

**Why.** The handler calls a small function between its load and its write. Wrapping that function to perform the competing write puts it exactly inside the window, every run.

**Do instead.** Find a call that sits between the read and the write, monkeypatch it to land the other write, assert the result. Say in the test's comment that the window is forced on purpose.

**Evidence.** A quiz app's counter-write test: reproduced the lost save on the old code, passes on the fix.
