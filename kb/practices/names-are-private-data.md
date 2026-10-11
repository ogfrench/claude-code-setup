---
id: names-are-private-data
type: practice
summary: In a public repo, names are private data.
concern: security
stack: [any]
severity: must
last_verified: 2026-10-11
status: active
derived_from: [2026-10-11-names-are-private-data]
implemented_by: [scripts/check-public.mjs, .githooks/pre-push]
---

A secret scanner misses a client's name in a repo list, a file name, a branch or an example.
Check every push for the names themselves, kept outside the repo, refuse to check without
them, and never echo a match into a public log.
