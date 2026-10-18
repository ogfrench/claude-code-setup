---
date: 2026-10-18
source: a private project
tags: [git, worktrees, testing]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
---

# A worktree that borrows another worktree's node_modules tests the other's code

**What happened.** To save an install, each new git worktree got a symlink to an existing
worktree's `node_modules`. The workspace packages inside it are relative symlinks to the
owning checkout's `packages/`, so they resolved to the worktree that ran the install, an
older branch. For a day, tests, type checks and builds in four worktrees ran some of another
branch's package code. It surfaced only when a type check failed on a signature the branch
had just changed.

**Why.** A workspace link in `node_modules` points at its own checkout's packages, not at
whoever imports it. Sharing the folder shares the links.

**Do instead.** Give every worktree its own install (`npm ci` took 11 s). If you must share,
check first: `node -e "console.log(require.resolve('<workspace package>'))"` from inside
the worktree must print a path inside that worktree. Delete old shared links outright, so a
worktree without its own install fails loudly.

**Evidence.** Seen twice. First, `require.resolve` from a new worktree printed a path in
another worktree two branches behind; CI, which installs clean, was the only check that had
tested the right code. A day later a leftover link did it again, and a test failed for it.
