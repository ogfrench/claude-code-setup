---
date: 2026-10-18
source: a private project
tags: [ui, testing, css]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/ui.md
---

# Changing how a component looks can break a program that reads its styles

**What happened.** Highlighted phrases on a slide dropped their filled background
(`background-image: none`) and stood out by contrast instead. Every visual check passed. An
exporter to a slide format, which reads each highlight's background to color a text box,
threw on the first highlight with no fill, so any deck with that slide exported nothing. A
cheap code reviewer caught it from the diff; no screenshot could have.

**Why.** The computed style was an input to another program, and nothing tied the two
together but a value both assumed was present.

**Do instead.** Before changing a component's CSS, search for code that reads its computed
style (exporters, measurers, accessibility probes) and run one of them on the changed page.
Make such readers handle the "nothing there" case explicitly, with a test.

**Evidence.** Seen once, caught from the diff by a cheap reviewer before it shipped.
