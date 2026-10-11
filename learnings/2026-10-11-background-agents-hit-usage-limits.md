---
date: 2026-10-11
source: ogfrench/frogQuiz
tags: [agents]
status: promoted
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
  - plugins/agent-workflow/skills/model-delegation/SKILL.md
---

# A background agent can stop mid-task at a usage limit and leave nothing

**What happened.** A security audit agent ran for many minutes, hit the session's usage limit, and stopped with one line of output and no report. Its stack was left running.

**Why.** Agents share the session's limits, and a long task that only reports at the end loses everything when cut.

**Do instead.** Ask for work that leaves something usable when cut short (findings written as found, a scratch file). Resume rather than restart. Clean up anything the agent started.

**Evidence.** frogQuiz V1 step 3a; the second run was briefed to finish only what the first had not reached.
