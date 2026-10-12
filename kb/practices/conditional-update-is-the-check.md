---
id: conditional-update-is-the-check
type: practice
summary: A conditional update is the check.
concern: data
stack: [any]
severity: should
source: judgment
last_verified: 2026-10-11
status: active
---

"Check, then write" lets two callers both pass the check. Put the condition in the `WHERE`
and act only if a row changed.
