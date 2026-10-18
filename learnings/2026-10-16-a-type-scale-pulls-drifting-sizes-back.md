---
date: 2026-10-16
source: a private project
tags: [design, typography]
status: raw
promoted_to: []
---

# Per-slide font sizes drift into dozens; a type scale and a before/after sheet pull them back

**What happened.** A 28-slide deck used 45 text sizes and 93 size-and-leading pairs, because
each slide fitted its own headline and lead. It read as messy, though no single slide was
wrong.

**Why.** Fitting text to its box one slide at a time optimizes each box and nothing across
them; neighbors end up at 44, 46 and 50 points.

**Do instead.** Measure every computed size first (a script over the rendered deck), map
each declaration to a small scale of size-and-leading tokens, then compare every slide
before and after on one sheet. The breakages are few and visible: text that now wraps into a
neighbor. Give long text whose wording is fixed a dense step, rather than shrinking the scale.

**Evidence.** 45 sizes became 11 steps; the sheet showed three breakages, all fixed.
