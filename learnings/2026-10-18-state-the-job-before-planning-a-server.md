---
date: 2026-10-18
source: a private project
tags: [planning, scope, agents]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
---

# A plan grew a server before anyone stated the job in one line

**What happened.** Asked for a full plan for a remote MCP server, Claude wrote eight steps:
a hosted function, OAuth on the site's sign-in, links to stored outputs, rate limits. The
user's actual need was "people can read the site and pull things into Claude". A sibling
project already met the same need with no server: a public `llms.txt` with markdown docs,
plus a local MCP server started with one package-runner command. The user had to point that
out.

**Why.** The plan started from the solution named in the request, not from the job behind it.

**Do instead.** Before a plan that adds a server, auth or storage, write the user's job in
one sentence, then list the lightest paths first: what already ships, what a sibling
project did, what the client app does natively (skills, file upload, web fetch). Plan
infrastructure only for the gap those leave, and name that gap.

**Evidence.** Seen once; the user, not the plan, found the lighter path.
