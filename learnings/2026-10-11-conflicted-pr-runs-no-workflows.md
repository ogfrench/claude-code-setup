---
date: 2026-10-11
source: ogfrench/frogQuiz
tags: [git, ci]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
---

# A pull request with a merge conflict runs none of its pull_request workflows

**What happened.** After a push, every check on a PR went missing rather than red. The base branch had moved and the PR conflicted.

**Why.** GitHub cannot build the merge commit for a conflicted PR, so `pull_request` workflows do not start.

**Do instead.** When checks go missing, look at the PR's mergeable state first; merge the base in and push.

**Evidence.** frogQuiz PR #57, step 1 close.
