---
date: 2026-10-18
source: a private project
tags: [concurrency, data]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/data-and-concurrency.md
---

# A check and the write it guards go in one transaction that watches every key the check read

**What happened.** A live quiz recorded an answer in three steps: read the game and check the question was open, score the answer, then append it to the answer list in a transaction that watched only that list. The host's "stop" closed the question by writing the game key. An answer that passed the check before the close and wrote after it was counted in the totals but missing from the results everyone was shown. The results handler had the mirror bug: it read the answer list, then closed the question.

**Why.** The transaction protected the key it wrote, not the key the check read. Anything that changed the checked key between the check and the write went unnoticed. Closing after reading leaves the same gap from the other side.

**Do instead.** Do the check inside the transaction and WATCH every key it reads, so a concurrent change aborts the write and the retry sees the new state. Put dependent writes (here, the score total) in the same MULTI. On the reading side, close first, then read: anything written before the close is in the read, and anything after is refused.

**Evidence.** A quiz app's answer-close race tests: two tests land the competing step inside each gap; both failed on the old code (an answer recorded but not shown, an answer recorded after the close) and pass on the fix.
