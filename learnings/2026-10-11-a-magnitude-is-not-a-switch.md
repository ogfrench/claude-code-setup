---
date: 2026-10-11
source: a private project
tags: [correctness, flags]
status: raw
promoted_to: []
---

# A magnitude used as an on/off switch breaks when the magnitude is legitimately small

**What happened.** A shader took a blend strength and also used it as a mode switch,
`if (strength > 0.5)`. One theme set the strength to exactly 0.5, so it silently drew the
wrong mode.

**Why.** One value carried two meanings, and the threshold was a guess about the range of
the other meaning.

**Do instead.** Switch on `> 0` (absent versus present), or pass a separate flag, and test
the smallest real value.

**Evidence.** A test now pins the threshold, and checks that every theme's strength is
above zero.
