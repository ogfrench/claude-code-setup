---
date: 2026-10-18
source: a private project
tags: [shell, tooling]
status: raw
promoted_to: []
---

# `pkill -f name` kills the shell that runs it

**What happened.** To restart a background queue script, one shell command ran
`pkill -f queue.sh; ./queue.sh &`. The shell's own command line contained `queue.sh`, so
`pkill -f` matched and killed it (exit 144) before the relaunch ran.

**Why.** `-f` matches against full command lines, and the shell running the command line is
one of them.

**Do instead.** Save the PID at launch and `kill` that PID, or use the harness's own task
stop. If you must match by name, run `pgrep -f` first and exclude `$$`, or use a pattern the
killing command does not contain (`pkill -f '[q]ueue.sh'`).

**Evidence.** Seen once: exit 144, and the queue was not relaunched.
