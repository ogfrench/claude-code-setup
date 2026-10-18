---
date: 2026-10-11
source: a private project
tags: [testing, ui]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/testing.md
---

# In a browser test, wait for the state you need, not for time

**What happened.** A keyboard test opened a dialog and pressed Enter to close it. It failed 2 or 3 times in 20: Enter sometimes landed on the button behind the dialog before focus had moved.

**Why.** The dialog moves focus to its close button a frame after it opens.

**Do instead.** Wait for the precondition itself (`toBeFocused`, `toBeVisible`, a poll on the value), never a fixed sleep. A flaky test is a race in the test or the app until shown otherwise.

**Evidence.** A quiz app's game-exit browser test; 40 of 40 after the fix.
