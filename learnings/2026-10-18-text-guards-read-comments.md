---
date: 2026-10-18
source: ogfrench/frogQuiz
tags: [testing, ci]
status: raw
promoted_to: []
---

# A text-matching guard test reads comments too

**What happened.** A test greps the source for a bare `rounded` class, which compiles to the wrong corner radius. A comment explaining a fix said "the rounded corners clipped the finder squares", and CI failed on the comment.

**Why.** The guard matches text, not markup, so prose in a comment can look exactly like the pattern it forbids. The local run that would have caught it was skipped after the comment was added.

**Do instead.** After editing comments in files a text guard scans, run that guard. When a comment must mention the forbidden thing, word it so the pattern does not match ("the corner radius"), rather than weakening the guard.

**Evidence.** frogQuiz CI's frontend lint failed on the comment; rewording it turned the check green with the guard unchanged.
