---
date: 2026-10-12
source: a private project
tags: [design, review, agents]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/visual-loop/SKILL.md
---

# Show design options on the real artifact, read every shot first, and loop until one is picked

**What happened.** A footer redesign took three rounds. The first sheet showed seven
variants of one idea as full screenshots, where the detail was too small to judge, and
it was rejected as ugly and redundant. The round that landed rendered the options inside
the real page, cropped the changing region at 1:1 on both themes, offered a live
switcher to check at leisure, and used the line the user actually writes. Reading each
sheet before showing it caught overlaps and an element at two heights before the user
saw them.

**Why.** People judge a design in context and at real size. Variants of a rejected idea
repeat what was wrong with it, and an unread sheet hands the user bugs to find.

**Do instead.** Inject options into the real artifact, crop to 1:1 across every state,
read every image first, offer a live switcher, rethink after a rejection instead of
varying it, build the pick and shoot the build again. Brief agents to make and read their
own contact sheets, and review the sheet.

**Evidence.** Three option rounds in one session; the picked design shipped the same day.
