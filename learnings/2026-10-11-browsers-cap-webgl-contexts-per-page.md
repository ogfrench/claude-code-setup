---
date: 2026-10-11
source: a private project
tags: [ui, webgl, browser-limits]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/ui.md
---

# A page gets about sixteen WebGL contexts, and the browser drops the oldest without a word

**What happened.** A gallery gave every animated card its own WebGL canvas. Past about
sixteen, cards went blank and a shader reported that it did not compile, with no log. It
looked like a shader bug.

**Why.** Browsers cap the live WebGL contexts on a page and silently lose the oldest when a
new one is created. The empty compile log was a lost context, not bad code.

**Do instead.** Share a few contexts (four worked): a card takes a slot when it nears the
screen, paints, keeps its frame as an image (`canvas.toDataURL()`), and gives the context
back. Count contexts whenever a page shows many canvases.

**Evidence.** With the pool, 22 of 22 cards painted and froze with no console error, on
desktop and phone.
