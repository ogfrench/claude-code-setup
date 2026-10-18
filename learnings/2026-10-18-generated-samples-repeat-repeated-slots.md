---
date: 2026-10-18
source: a private project
tags: [content, codegen]
status: raw
promoted_to: []
---

# A sample generated from a structure repeats what the structure repeats

**What happened.** A template's sample deck was generated from its outline, one slide per
step, each filled with the layout's placeholder words. The outline opened each of three
sections on the same divider, so the sample showed the same slide with the same words three
times, and slides from a second outline were appended after the closing slide. Five
independent graders called it padded, a deck that forgot to stop.

**Why.** The generator filled slots, not what a viewer sees: three identical slots made
three identical slides.

**Do instead.** When a generator fills repeated slots with the same placeholder, dedupe by
what the viewer sees (the layout plus its variant), and keep a structural end, such as the
close, last when appending.

**Evidence.** Seen once, flagged by all five graders.
