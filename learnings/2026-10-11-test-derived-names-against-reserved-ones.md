---
date: 2026-10-11
source: a private project
tags: [codegen, testing]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/testing.md
---

# A name generated from another name needs a test against the reserved ones

**What happened.** Each shader effect turned its parameters into uniforms by a rule (`tint`
becomes `uTint`). A shared block later declared its own `uTint`, and one effect stopped
compiling everywhere. Every unit test stayed green until a browser visit printed the error.

**Why.** The rule made a collision possible the day the shared list grew, and nothing
compared the generated names with the reserved ones.

**Do instead.** When code derives identifiers from names (uniforms, CSS variables, routes,
columns), add a test that derives them all and fails on any that collides with the reserved
set. Read the reserved set from its source of truth; do not copy it into the test.

**Evidence.** The guard test fails on the old name and passes after the rename.
