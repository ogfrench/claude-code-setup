---
date: 2026-10-18
source: a private project
tags: [testing, algorithms]
status: raw
promoted_to: []
---

# An optimizer that cuts every suspect drives them all to the floor

**What happened.** A tool measured how many words each text slot of a slide layout can hold,
by filling every slot to its limit and lowering limits until nothing overflowed. Each round
it lowered every slot named in an overflow. Many limits landed at one word: when a long line
pushed into the small label above it, both were named and both were cut, round after round,
though only the long line needed room. A layout that overflowed even with its own sample
words had every slot cut to one, because no word count could fix it.

**Why.** Blame was shared equally among every slot an overflow touched, and nothing
separated "too many words" from "broken whatever the words".

**Do instead.** Run a baseline first (the content as shipped) and report what breaks there
as a layout bug, outside the search. Then cut one suspect per round, the one with the most
room to give, and allow more rounds.

**Evidence.** First run: one-word limits on 12 slots across 7 layouts, and one layout
flagged by a false overlap. After the baseline and one-at-a-time cuts, the one stuck layout
was a real bug, and the false flag was gone.
