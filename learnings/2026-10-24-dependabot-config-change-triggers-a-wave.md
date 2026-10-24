---
date: 2026-10-24
source: a private project
tags: [ci, cost]
status: raw
promoted_to: []
---

# Editing dependabot.yml makes Dependabot scan at once: expect a wave of PRs and their CI

**What happened.** A CI-cost change edited `.github/dependabot.yml` (it grouped security
updates). Within minutes of the merge, on a Saturday, Dependabot opened five version-update
PRs. Three of them each started the repo's roughly 40-minute end-to-end suite, about two
hours of paid minutes, from the change meant to save them.

**Why.** Dependabot re-runs its update jobs whenever its configuration changes, whatever
the configured schedule says. Each PR opens ready, which is the trigger for the expensive
suite.

**Do instead.** Before editing `dependabot.yml`, assume a scan follows right away. Make the
edit in a week when the scheduled scan is due anyway, or keep the expensive suite off
Dependabot PRs until a person marks one ready (a label or `if:` on the actor). Say so in
the PR that changes the config.

**Evidence.** The five PRs were opened between 18:33 and 18:39 UTC, right after the merge,
and three of them started e2e runs at 18:33 and 18:39.
