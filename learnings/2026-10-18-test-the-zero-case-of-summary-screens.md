---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [testing, ui]
status: raw
promoted_to: []
---

# Give every summary screen a test where nobody did anything

**What happened.** A quiz's end screen built its podium from scored answers. A quiz of only information slides, or one nobody got right, ended on an empty floor line under confetti, on the projector and every phone. A player who scored nothing also lost the line telling them their place.

**Why.** The list of who took part was derived from activity (an answer that scored) instead of from membership (who joined). With no activity there was no one to show, and the celebration ran anyway. Every test played a game where someone scored.

**Do instead.** For each aggregate or summary screen (podium, leaderboard, dashboard, report), test the zero case: nobody acted, everyone tied at zero, one participant with nothing. Derive "who took part" from membership, and design the empty state on purpose instead of letting the full layout render with nothing in it.

**Evidence.** frogQuiz `frontend/e2e/final-edges.e2e.ts`: both tests failed on the old code (no "Thanks for playing" heading, no 0-point score line) and pass on the fix.
