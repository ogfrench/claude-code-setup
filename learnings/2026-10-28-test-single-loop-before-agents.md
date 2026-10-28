---
date: 2026-10-28
source: ogfrench/claude-code-setup
tags: [agents, orchestration, skills, evaluation]
status: practice
promoted_to: [plugins/agent-workflow/skills/best-practices/agents-and-models.md, plugins/agent-workflow/skills/model-delegation/SKILL.md]
---

# Test the main agent with skills before creating specialist agents

**What happened.** Delegation guidance selected cheaper subagents before
comparing the main loop. Anthropic reports cases where one loop did better.

**Why.** Handoffs, repeated context and routing add latency and can lose
details. Independent verification and genuine parallel work can still win.

**Do instead.** Fold one agent at a time, evaluate end-to-end completion,
regressions, cost and latency, and retain agents when justified.

**Evidence.** Anthropic, October 22, 2026:
https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop
External evidence, not a benchmark of this repository.
