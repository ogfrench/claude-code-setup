---
date: 2026-10-16
source: a private project
tags: [performance, css, animation]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/ui.md
---

# A custom property animated per frame costs one restyle per element that reads it

**What happened.** An animated slide deck drew a background of about 29,000 SVG cells, each
computing its opacity and scale from a playhead custom property. A key press took up to
1.9 s to answer, and style recalculation was 4.2 s across eight profiled slides.

**Why.** Every element whose style reads a changing custom property is restyled on every
frame it changes, and an inherited property reaches every descendant. The cost is the
number of readers, not the number of things that visibly move.

**Do instead.** Paint many small things on one canvas, and repaint only while its input
changes. Register the per-frame property with `inherits: false` and set it only on the
elements that read it. Skip rendering off-screen slides (`content-visibility`).

**Evidence.** Elements 32,349 to 3,316; style time 4,236 to 627 ms; median key press to
next frame 228 to 161 ms (headless, every transition).
