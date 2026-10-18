---
date: 2026-10-18
source: a private project
tags: [security, secrets]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/security.md
---

# A pasted secret needs a home and a rotation reminder at once

**What happened.** Over one session the user pasted two GitHub tokens and an API key into
chat, saying everything would be rotated later. Nothing tracked "later", and each new session
had to rediscover where the key had been put.

**Why.** A secret in chat has no owner and no expiry. "Rotate later" is a task with no place
to live.

**Do instead.** When a secret arrives in chat, store it outside every repo (a mode-600 file
in the session's scratch space, or the environment's secret settings) and never echo it.
Open one issue listing each pasted credential by its last four characters, with the rotation
steps. Point future sessions at the environment variable, not at the chat.

**Evidence.** Seen once, over three credentials in one session.
