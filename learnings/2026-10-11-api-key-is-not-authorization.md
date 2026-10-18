---
date: 2026-10-11
source: a private project
tags: [security, auth]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/security.md
---

# "Behind an API key" is not a gate when any account can mint a key

**What happened.** Three read routes for live games checked that the key existed, not that it was the game host's. Any signed-in user could mint a key and read anybody's running game by its 6-digit PIN, the right answer included. A doc said the routes checked the owner.

**Why.** Authentication (a valid key) was mistaken for authorization (this key's owner owns this resource), and the sibling routes that did check made it look covered.

**Do instead.** Every route that reads per-account data compares the caller with the owner. Test it with a second account's credential, not only a missing one. Probe live as anonymous and as two accounts.

**Evidence.** A quiz app's `docs/security-audit-2026-10-11.md`, finding 1; `tests/test_live_owner.py` failed first.
