---
date: 2026-10-11
source: ogfrench/frogQuiz
tags: [ci, security]
status: practice
promoted_to: 
  - plugins/agent-workflow/skills/best-practices/git-and-ci.md
---

# Reproduce a CI failure with the exact tool version CI runs

**What happened.** A secret scan failed in CI on a hostname list. The local scan passed, because it ran a newer gitleaks with different rules.

**Why.** Scanners and linters change their rules between versions; "latest" locally and a pinned or default version in CI disagree.

**Do instead.** Pin the version in CI, download that same version to reproduce, and scan the commits about to be pushed with it before every push.

**Evidence.** frogQuiz V1 step 1: gitleaks 8.24.3 in CI against 8.28 locally.
