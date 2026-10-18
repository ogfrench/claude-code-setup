---
date: 2026-10-11
source: a private project
tags: [security, games]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/security.md
---

# Strip the solution from what clients receive, on every path that sends it

**What happened.** Multiple-choice questions went to phones without their `right` flags, but free-text questions went with the answers they accept. After the fix, one more route built the payload itself and still leaked.

**Why.** The stripping lived in one function and one question type, and a second sender bypassed the function.

**Do instead.** One function builds every client payload; grep for every sender and route them through it. Test each question type.

**Evidence.** A quiz app's commits 06e4663 and 57a3445.
