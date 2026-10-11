---
date: 2026-10-11
source: ogfrench/claude-code-setup
tags: [security, privacy, git]
status: promoted
promoted_to:
  - plugins/agent-workflow/skills/best-practices/security.md
  - scripts/check-public.mjs
  - .githooks/pre-push
---

# In a public repo, a list of names is private data

**What happened.** A public setup repo kept the list of repos it syncs to. Several repo
names were client and tender names, and two skills used a real brand as an example. Nothing
in it was a secret, so the secret scanner had nothing to say, and it sat public for hours.

**Why.** Secret scanners look for keys and tokens. A client's name is not a credential, but
it is confidential, and it hides in places nobody reads as content: repo lists, file names,
branch names, commit messages, examples.

**Do instead.** Keep lists of private names out of the public repo (a gitignored file). Check
every push for the names themselves, kept outside the repo (a gitignored list, a CI secret),
and make the check refuse to run without them. Match loosely: case, separators, a name glued
to a suffix or wrapped over a line. Never print the matched text, since CI logs are public.
Removing a leak from the files leaves it in history: rewriting history is a separate,
confirmed step, and GitHub keeps old commits reachable by hash until Support purges them.

**Evidence.** The check found the leak on its first run, and blocked its own author's push
twice (a test fixture email, a fixture repo name). A review then found it passed silently
with no terms loaded, and missed `acme-bank`; both fixed.
