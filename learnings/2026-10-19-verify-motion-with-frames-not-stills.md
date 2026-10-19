---
date: 2026-10-19
source: a private project
tags: [ui, testing, motion]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/visual-loop/SKILL.md
---

# Verify a motion fix with frames recorded across the change, not with stills

**What happened.** In a presentation, the background light reset on every slide change: it went dark and rose from the bottom again. An agent wrote a fix and reported it done. Its capture tool disabled transitions and shot only settled stills, so it could not see the change itself. A second pass recorded frames every 80 to 160 ms on a frozen clock, from the key press to 2.4 s after, and charted a luminance series. It did that before the fix, after the fix and after a corrected fix. The frames showed the first fix had removed the reset but added a hard-edged rectangle of light crossing the content, lost the composition on some slides and dimmed others. A still at rest showed none of it.

**Why.** A still is a sample of the end state. A tool that freezes on a settled frame, or turns transitions off, removes the one thing a motion fix changes. The fix can pass every still and still be wrong during the 2 seconds in between.

**Do instead.** Before you say a motion fix works, record frames across the real navigation and read them, with a luminance or energy series next to the contact sheet. Do it before the fix too, so the bad frames are on record. Cover the cases that break motion: forward, back to the start, an interrupted change (a press mid-transition), reduced motion, and a cut between two different light positions. Add a test that fails on the broken version, for example light energy must not drop below a fraction of its rest value across a cut.

**Evidence.** Three recorded runs (before, first fix, corrected fix) on a frozen clock. The first fix passed on stills and failed on frames.
