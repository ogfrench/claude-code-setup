---
date: 2026-10-18
source: a private project
tags: [web, ai, auth]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
---

# llms.txt helps nothing behind a sign-in

**What happened.** A site already served `llms.txt`, a registry and per-item markdown, but
all of it sat behind an email sign-in. Claude's web fetch carries no session, so it got the
sign-in page. The files existed and were useless to the reader they were written for.

**Why.** An AI fetcher is an anonymous visitor. Whatever an anonymous visitor gets is what
it reads.

**Do instead.** Check what an AI client actually receives: fetch the URL with no cookies.
For a private site, the routes that work are content the user carries in (an uploaded skill
or archive, copy and paste) or a scoped, expiring read link. Say the trade-off of each: a
link pasted in chat grants read access to anyone holding it until it expires.

**Evidence.** Seen once: Claude's web fetch of the file returned the sign-in page.
