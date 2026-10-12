---
id: work-that-survives-cut-short
type: practice
summary: Ask for work that survives being cut short.
concern: agents
stack: [any]
severity: should
last_verified: 2026-10-11
status: active
derived_from: [2026-10-11-background-agents-hit-usage-limits]
implemented_by: [plugins/agent-workflow/skills/model-delegation]
---

Agents share the session's usage limits; have them write findings as they go, resume rather
than restart, and clean up what they started.
