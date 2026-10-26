---
date: 2026-10-26
source: a private project
tags: [redis, state, testing]
status: raw
promoted_to: []
---

# Give every key a session writes one TTL, and test it by reading the TTLs back

**What happened.** A live game kept its state in about ten kinds of cache key. The game key
lived five hours, but the per-question answers, the session, the clock, the final results and
the media tokens were each written with a literal two-hour expiry, and two writers of the game
key itself used the same two hours. A game past two hours silently lost its first answers from
the podium and the export, its images, and its host session. A review of the code found it, not
a test or a user.

**Why.** Each expiry was chosen where its key was written, so nothing tied them to the life of
the thing they belonged to. A key written once at the start dies at write time plus its TTL,
however long the session runs. Code review reads one write at a time and cannot see the set.

**Do instead.** Name one constant for the session's life and use it for every key the session
writes; renew it with the parent key where that is cheap. Then test the set, not each write:
drive a short session against a real cache, list every key under its id, and assert each TTL is
at least the constant minus a margin. Make the test list the key kinds it expects, so a renamed
key cannot make it pass by not existing.

**Evidence.** A test that drove a one-question game and read every key's TTL failed with six key
kinds at 7200 seconds before the change and passed after it.
