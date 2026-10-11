---
date: 2026-10-11
source: ogfrench/frogQuiz
tags: [testing, dev-server, agents]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/testing.md
---

# A second dev stack started from the same tree reloads the first one's pages

**What happened.** An agent started its own local stack on other ports to probe an API, while browser tests ran on the first. A test failed mid-way: its page had reloaded and lost what it had typed.

**Why.** The second stack ran `svelte-kit sync`, which rewrites generated files in the shared `frontend/`. The first stack's Vite saw them change and reloaded every open page. Separate ports do not mean separate trees.

**Do instead.** One stack per working tree. A second stack gets its own worktree, or waits. No edits under a watched tree while browser tests run.

**Evidence.** frogQuiz V1 step 3a: Vite's log showed `page reload .svelte-kit/generated/...` at the minute the second stack started.
