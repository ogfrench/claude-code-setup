---
date: 2026-10-18
source: a private project
tags: [agents, skills, testing, distribution]
status: practice
promoted_to:
  - plugins/agent-workflow/skills/best-practices/agents-and-models.md
---

# Before shipping a skill, have an agent use it inside the user's sandbox

**What happened.** A skill zip meant for the chat app was only ever tested in a terminal
with the repo, a browser and the network at hand. An agent was then made to play the chat
app: the zip unzipped into an empty folder, every command run through a wrapper with no
network, only the sandbox's documented libraries, and the user's real prompt. In one run it
found:
- a final step that pointed at a server and an input file the skill's own workflow never
  produces;
- logos shipped only as SVG, which nothing in that sandbox can rasterize;
- steps that assume a laptop ("open it", "save to the Desktop");
- a zip of 35 MB against a 25 MB upload limit.

The deck it made, once looked at, also showed a layout flaw no check had caught.

**Why.** Tests ran where the author works, not where the user works. A skill's
instructions are code that runs in someone else's environment, with its own limits on
network, binaries, file size and context.

**Do instead.**
- Write a small runner that copies the target environment: `unshare -n` for no network,
  a `PATH` holding only the libraries the platform documents, and a working folder with
  nothing but the unzipped package.
- Brief an agent to stay inside it and play the product, using a real user prompt.
- Ask for four things back: its in-character reply, its files, where the instructions got
  in the way, and what it had to guess.
- Look at the output yourself.
- Check the platform's upload and size limits before building the package.
- Run several kinds of user, from a precise ask to a vague one, not one happy path.

**Evidence.** The first simulated run found four blocking gaps and a design flaw, in about
six minutes and 170k tokens. None of them had shown up in the repo's own tests.
