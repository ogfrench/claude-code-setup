---
id: estimate-runner-minutes
type: practice
summary: Estimate a workflow's runner-minutes before merging what triggers it.
concern: ci
stack: [any]
severity: should
last_verified: 2026-10-18
status: active
derived_from: [2026-10-17-estimate-runner-minutes-before-merging-a-trigger]
implemented_by: [plugins/agent-workflow/skills/actions-cost]
---

Jobs times minutes times triggers. Prefer on demand and cached to a prebuilt matrix. A job failing in seconds with no log is billing: stop.
