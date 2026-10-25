---
date: 2026-10-24
source: a private project
tags: [workflow, editing]
status: raw
promoted_to: []
---

# A scripted find-and-replace edit can silently delete the line it anchored on

**What happened.** A Python script edited a validator: replace `old` with `new`, after
`assert old in text`. `old` ended with an `if ...:` line, and `new` left that line out. The
assert passed and the file parsed, but the empty-list check was gone. A formatter's
`--check --diff` showed it: it wanted to re-indent the orphaned `raise`.

**Why.** The assert only proves the anchor exists, not that the replacement keeps what it
covered. A deleted guard still leaves valid Python, so a syntax check doesn't catch it.

**Do instead.** End the anchor at a line you are rewriting, not at one you mean to keep. After
any scripted edit, read `git diff` for that hunk, and run the formatter's check: an
indentation it wants to change is often a line that went missing above it. Prefer an editor
tool that shows the exact before and after.

**Evidence.** The black diff on the edited file showed the stranded `raise`; restoring the
`if` line fixed it, before any commit.
