---
date: 2026-10-24
source: a private project
tags: [deploy, api]
status: raw
promoted_to: []
---

# When frontend and backend deploy separately, let the API say what it supports

**What happened.** A release added a question type. The frontend host publishes on every
merge, and the backend is deployed by hand a few minutes later. In that window a new editor
would offer a type the old API refuses, and every autosave of that quiz would fail.

**Why.** The two halves of one merge go live at different times, so either one can run
against the other's old version. A green PR proves nothing about that mix.

**Do instead.** The API adds a flag (say `new_question_type: true`) to its public config endpoint.
The frontend offers the feature only when it reads that flag, and treats a missing flag as
false. New events the frontend listens for are optional: without them it falls back to its
old behaviour. Then either half can go first. Test the config endpoint's key set, so a new
key is a decision, not a side effect.

**Evidence.** Shipped that way. A test guarding the endpoint's key set caught the new key
before merge.
