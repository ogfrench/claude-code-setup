---
date: 2026-10-18
source: a private project
tags: [ci, cost, hosting]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/netlify-cost/SKILL.md
---

# Find the plan's billing model before cutting a hosting bill

**What happened.** A static site on Netlify, behind a login edge function, was built for every
push to every pull request, and many agents push often. The brief was to cut its cost. Reading
the usage first showed about 70 production deploys, a few hundred previews and 5,500 edge
runs a week, all far inside a legacy Pro plan. On the newer credit plan the same week costs
about 4,500 credits a month, nearly all of it production deploys at 15 credits each, while
previews and build minutes are free there. The obvious targets (turning previews off, narrowing
the login gate) save close to nothing on either plan. Writing a build-skip script also hit a
trap: the usual one-line `git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF` skips a first
build, because with no cache Netlify sets the cached ref to the commit itself.

**Why.** Each plan meters different things, and a diff shows none of them. A cut aimed at the
wrong meter is work that changes nothing on the bill.

**Do instead.** Find the plan (the owner's Plan details page), measure a week with the
read-only tools, multiply by the plan's rates, and cut the meter that is large. Skip builds
only from an explicit list of files the build never reads, build when unsure, and test both.

**Evidence.** One site, one week of observability data and deploy records; the build-skip
script's tests failed first on the no-cache and merge-into-main cases.
