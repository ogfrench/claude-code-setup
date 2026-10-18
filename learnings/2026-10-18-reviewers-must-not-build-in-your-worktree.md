---
date: 2026-10-18
source: a private project
tags: [agents, review, testing]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
---

# A reviewer that runs builds in your worktree breaks your gate

**What happened.** A read-only review agent, checking a change, started the site's test
suite in the same worktree, which rebuilds the built site folder. A visual-matrix test
running at the same time read that folder and failed 22 cells with 404s and pages that never
signaled ready, all in one alphabetical window. It looked like a regression in the change
under review.

**Why.** "Read-only" described what the reviewer would edit, not what its commands would
write. The suite rewrote shared output under a gate that was reading it.

**Do instead.** Tell a reviewer which commands it may run, and never a build or a suite that
writes shared output while a gate runs; or give it its own worktree. A cluster of load
failures in one contiguous window is a shared-folder collision until shown otherwise: rerun
alone first.

**Evidence.** Seen once: 22 failed cells, all in one contiguous window, while the
reviewer's suite was rebuilding the folder.
