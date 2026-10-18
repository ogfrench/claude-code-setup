---
date: 2026-10-11
source: a private project
tags: [agents, review]
status: promoted
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
  - plugins/agent-workflow/agents/cheap-reviewer.md
  - plugins/agent-workflow/skills/model-delegation/SKILL.md
---

# A read-only review of each commit on a mid-size model catches real bugs, cheaply

**What happened.** Each commit got a review by a sonnet agent with a fixed brief: correctness and safety only, `file:line`, a concrete scenario, under a word cap. Over one afternoon they found a file-deleting sweep that ignored a hold, a route still leaking answers after a fix, and a lost backup for unsaved text.

**Why.** A fresh reader with a narrow brief looks where the author stopped looking: the other callers, the cron job, the second branch.

**Do instead.** Review every commit before pushing it, read-only, with the brief above. Verify each finding before acting on it.

**Evidence.** Three commits in a quiz app each fix review findings, with tests that fail on the reviewed commit.
