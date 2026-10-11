---
date: 2026-10-11
source: ogfrench/frogQuiz
tags: [ui, accessibility, css]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/ui.md
---

# A rich-text library's own CSS and attributes win unless you match how it sets them

**What happened.** CKEditor fields were square with a thin focus line beside rounded fields with a 2px ring, and they lost their accessible names on the first keystroke.

**Why.** Its stylesheet used more specific selectors (`.ck.ck-editor__editable:not(...)`) than ours, and its editing view rewrote `aria-label` on every render, so a label set after creation was overwritten.

**Do instead.** Pass settings through the library's config (CKEditor 5 `label`) instead of patching the DOM after creation. Match or exceed its selectors in your overrides. Re-check the element after an edit, not only on load.

**Evidence.** frogQuiz commit 2ba9a95; the conflict e2e could not find the field by name after typing until the fix.
