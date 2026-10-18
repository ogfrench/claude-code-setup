---
date: 2026-10-16
source: a private project
tags: [testing, browser, css]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/testing.md
---

# Headless Chrome matches hover: none, so a touch fallback keyed on it shows in every capture

**What happened.** A control bar showed its labels only on hover, with
`@media (hover: none)` showing them always for touch screens. Every headless screenshot
showed the labels at rest, which looked like a bug in the hover rule.

**Why.** Headless Chrome matches `hover: none` and `pointer: none`. It never matches
`pointer: coarse`.

**Do instead.** Key a touch fallback on `(pointer: coarse)`, and check `matchMedia` in the
test browser before trusting a capture that depends on a media query.

**Evidence.** `matchMedia` in headless Chrome: `hover: none` true, `pointer: none` true,
`pointer: coarse` false.
