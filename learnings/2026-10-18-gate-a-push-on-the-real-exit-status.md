---
date: 2026-10-18
source: a private project
tags: [git, shell, ci]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
---

# A push chained after a test runs even when the test fails, unless the chain reads its exit status

**What happened.** Twice in one day a red branch was pushed. First, `npm test; git push`:
the tests failed and the push went out, because `;` does not stop on failure. Then, after
switching to `&&`, `npm run check | tail -3 && npx vitest run | tail -3 && git push`: a
test failed and the push still went out.

**Why.** `;` ignores exit codes. A pipeline's exit status is its last command's, so
`| tail` returns 0 whatever the test did.

**Do instead.** Never pipe a gate into `tail` or `grep` in a chain that ends in a push. Run
with `set -o pipefail`, or write the gate's output to a file and test its exit code, then
push as a separate step after reading the result.

**Evidence.** Seen twice in one day: each push went out with a failing test.
