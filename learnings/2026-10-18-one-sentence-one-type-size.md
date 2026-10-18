---
date: 2026-10-18
source: a private project
tags: [design, typography, ui]
status: raw
promoted_to: []
---

# One sentence, one type size: a highlight marks a phrase inside it, not a second line

**What happened.** A slide template set a claim at display size and then repeated its
turning point beneath it, as a separate highlighted line at half the size. Every check
passed. The first person to look at a generated deck called it unacceptable. It read as two
competing sentences, and the design system's own rule says the highlight marks one phrase
of the sentence.

**Why.** The template had been ported from an exploration, so its slot model ("claim" plus
"mark") turned the marked phrase into a second element. The checks measured size, overlap
and contrast, never hierarchy.

**Do instead.** When a design system says a highlight marks a phrase, model it as a span
inside the sentence, at the sentence's own size, and reject a mark that is not in the text.
In a review, count the type sizes on each slide or screen: two sizes of the same voice
stacked on top of each other is a finding.

**Evidence.** It was caught by a person reviewing a simulated user's output, not by any of
the twelve automated checks.
