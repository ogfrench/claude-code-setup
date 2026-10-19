---
id: estimate-runner-minutes
type: practice
summary: Estimate a workflow's runner-minutes before merging what triggers it.
concern: ci
stack: [any]
severity: should
last_verified: 2026-10-19
status: active
derived_from: [2026-10-17-estimate-runner-minutes-before-merging-a-trigger, 2026-10-19-run-the-slow-ci-job-once-per-pr]
implemented_by: [plugins/agent-workflow/skills/actions-cost]
---

Jobs times minutes times triggers. Build on demand, not a matrix. Slow job once per PR, at ready; per-push job near a minute, watched for creep. Failing in seconds with no log is billing: stop.
