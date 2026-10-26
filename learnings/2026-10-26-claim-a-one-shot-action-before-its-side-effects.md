---
date: 2026-10-26
source: a private project
tags: [concurrency, api, idempotency]
status: raw
promoted_to: []
---

# Claim a one-shot action atomically before its side effects, and answer a retry with the first result

**What happened.** "Play again" on a finished game created a new game, pointed the old game at
it and told the old game's phones to move. A second press (a lost response on flaky Wi-Fi, or a
second tab) passed the same checks, created a third game and re-pointed the old one. The phones
had already moved to the first new game; the host landed alone in the second.

**Why.** The checks asked "is this allowed?", which stays true after the first success. Nothing
asked "has this already happened?", so the action was not idempotent, and the client could not
tell a lost success from a failure.

**Do instead.** Take the claim first with an atomic set-if-absent (`SET key pending NX EX 60`),
before any side effect. If the claim exists and holds a finished result, return that result to
the retry; if it is still pending, answer 409. Write the final value over the claim when the
work is done. Readers of the claim must skip the pending value.

**Evidence.** A test that pressed twice got two different games before the change; after it, the
same game id twice and one "moved" event.
