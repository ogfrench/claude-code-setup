---
date: 2026-10-11
source: a private project
tags: [security, rate-limits]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/security.md
---

# A limit per identity multiplies the attacker's budget when identities cost nothing

**What happened.** An email sign-in gate capped code guesses for the whole site per day, so
a stranger could spend the cap and pause sign-in for everyone. The proposed fix was a budget
per email address. But the gate accepts any address at an allowed domain, real or not, and
issues a code for it, so a guesser could make up a hundred addresses and get a hundred budgets.

**Why.** A per-identity limit only bounds an attacker when a new identity costs something:
a verified inbox, an account, a payment. Here it cost one keystroke.

**Do instead.** Before splitting a global limit per identity, ask what a new identity costs
the attacker. If nothing, keep the global cap and accept that it can be spent, or remove the
need for it (a secret too long to guess within the budget).

**Evidence.** Caught in review before it was built; the global cap stayed.
