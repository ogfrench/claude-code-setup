---
name: best-practices
description: >-
  Curated engineering practices learned across ogfrench's repos, one file per
  topic: testing, data and concurrency, security, UI, git and CI, agents and
  models. Read the topic that matches the work before writing a test for a race
  or a browser flow, an ORM write or a cleanup job, an auth check or a client
  payload, a form field or a third-party widget, a CI change, or before
  delegating to subagents. Each practice says why, and cites the learning it
  came from. Triggers: "best practice", "how should I", "what did we learn",
  "/best-practices".
---

# Best practices

Practices that held up in real work, curated from dated learnings in
`ogfrench/claude-code-setup/learnings/`. Each one cites the learning it came from, by file
name. Read only the topic you need:

| Topic | Read it before |
| --- | --- |
| [testing.md](testing.md) | writing a test for a race, a browser flow or a flaky case; running a local stack |
| [data-and-concurrency.md](data-and-concurrency.md) | an ORM write, a counter, a claim, a hold, a cleanup job |
| [security.md](security.md) | an auth or ownership check, anything sent to a client, a security probe |
| [ui.md](ui.md) | a form field, a third-party widget, accessible names |
| [git-and-ci.md](git-and-ci.md) | a CI failure, a scanner or linter version, a PR whose checks went missing |
| [agents-and-models.md](agents-and-models.md) | delegating to subagents or cheaper models |

A practice here can be wrong for a given repo. A repo's own `CLAUDE.md` wins. To add or
change one, use the `learning-loop` skill: capture a learning first, then curate.
