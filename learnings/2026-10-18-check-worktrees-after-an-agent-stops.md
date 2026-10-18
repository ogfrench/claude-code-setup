---
date: 2026-10-18
source: a private project
tags: [agents, git, worktrees]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
---

# A subagent that hits its limit leaves finished work unpushed

**What happened.** A bug-fixing subagent stopped at a session limit after committing one
finished fix and leaving a second half done in its worktree. Neither was pushed, and nothing
listed them. The work surfaced only when a later review checked every worktree against the
remote.

**Why.** An agent that stops at a limit writes no report, and a local commit is invisible to
everyone but the machine it sits on.

**Do instead.** At the start of a session, and after any agent stops, run `git worktree
list` and compare each branch with its remote (`git log @{u}..`, or "no upstream"). Brief
agents to push their branch after every green commit.

**Evidence.** Seen once: one finished fix and one half-done fix, found only by a later
review of every worktree.
