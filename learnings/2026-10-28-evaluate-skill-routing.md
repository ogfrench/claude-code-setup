---
date: 2026-10-28
source: ogfrench/claude-code-setup
tags: [skills, evaluation, regression]
status: practice
promoted_to: [plugins/agent-workflow/skills/best-practices/agents-and-models.md, plugins/agent-workflow/skills/learning-loop/SKILL.md]
---

# Check skill routing and task completion before promotion

**What happened.** The promotion pipeline validates structure and token
budgets, but lacks live skill-behavior evaluations.

**Why.** A valid skill can trigger unnecessarily, fail to trigger, or degrade
a task. Static tests miss these errors.

**Do instead.** Compare positive, negative and ambiguous tasks with and
without the skill. Re-run after tool or model changes.

**Evidence.** Anthropic's skill authoring guidance:
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
https://code.claude.com/docs/en/skills
External guidance, not a completed behavioral evaluation.
