---
date: 2026-10-26
source: a private project
tags: [security, analytics, privacy]
status: raw
promoted_to: []
---

# Do not key a stored record by a value that is also a credential: hash it first

**What happened.** An anonymous usage table, one row per game, was keyed by the game's id. The
same id was what the server accepted, with a PIN shown on a projector, as proof of being the
game's host. The table promised to hold nothing identifying, and it held a live credential for
every game in progress, copied into every backup and database branch for as long as the game
ran. An independent review caught it before the migration shipped.

**Why.** An id looks like an identifier, not a secret, so it is reused as a join key without a
second thought. Whether a value is a credential depends on what accepts it elsewhere, which the
author of the new table is not looking at.

**Do instead.** Before storing an id somewhere new, search for where the system accepts that id
as proof of anything. If it does, store a one-way hash of it (a truncated SHA-256 is enough to
join on), and name the column for what it is (`game_key`, not `game_id`). Check the dumps,
logs and reports that read the table too.

**Evidence.** Caught in review; the column became a hash before the migration ran anywhere, and
a test asserts the stored key is neither the id nor contained in it.
