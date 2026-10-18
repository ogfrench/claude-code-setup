---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [testing, e2e]
status: raw
promoted_to: []
---

# A fixture in a third-party format comes from that tool, not from memory

**What happened.** A spec needed an old drawn slide, stored as a canvas library's JSON export. It used a hand-written `{"shapes":[]}`. The library threw while drawing it, the page's other controls stopped responding some of the time, and the spec failed one run in three on a menu that never opened. A try/catch around the drawing looked like the fix and the spec passed, but the spec also passed with the guard reverted: the failure was intermittent, so one green run proved nothing.

**Why.** The made-up object lacked fields every real export has (`background.overlay`), and the library's error came from an async callback, so the page broke at random rather than at once. A single passing run after a change says nothing about a flaky failure.

**Do instead.** Build the fixture in the shape the tool really emits (its exported type, or a real export), and assert the page raises no `pageerror`. To credit a fix for a flaky failure, revert it and reproduce the failure over several runs (`--repeat-each`) first.

**Evidence.** frogQuiz `frontend/e2e/practice.e2e.ts`: with the made-up drawing, 1 of 3 repeats failed and the trace showed two page errors from the library. With a real-shaped export and a `pageerror` assertion, 4 of 4 passed and the try/catch was dropped as unneeded.
