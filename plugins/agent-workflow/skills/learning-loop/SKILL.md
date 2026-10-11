---
name: learning-loop
description: >-
  Capture, curate and promote lessons into ogfrench/claude-code-setup, the
  living record of practices that becomes skills, agents, hooks, commands and
  plugins. Use when a session learns something non-obvious (a class of bug, a
  tool quirk, a process lesson, a correction from the user), at the end of a
  step or milestone, and when the user says "remember this", "note this
  learning", "add to best practices", "promote this", "make this a skill",
  "harvest learnings". Triggers: "learning", "lesson learned", "best practice",
  "promote", "harvest", "/learning-loop".
---

# Learning loop

```
learning (raw) -> practice (curated) -> promoted (skill, agent, hook, command, plugin...) -> retired
```

The record lives in `ogfrench/claude-code-setup`: raw notes in `learnings/`, curated
practices in the `best-practices` skill, and the promotion ladder in that repo's
`CLAUDE.md`. **That repo is public, and this is a hard rule:** no client names or real
brands, nothing from a private repo (not even its name), no employer-confidential work, no
secrets, hostnames, IPs, emails or people. Write the lesson so it stands on its own. In a
private repo, `source` is "a private project" and the evidence names no file, commit or
issue from it.

## Capture, from any repo

**Worth a learning:** something cost real time; a review or a test found a class of bug,
not just a bug; a tool behaved unlike its docs; the user corrected the approach; a guess
turned out wrong. **Not worth one:** a fact about one repo (that goes in its `CLAUDE.md`),
or anything already a practice.

1. Write it with the template in `learnings/README.md`: a one-line lesson, then What
   happened, Why, Do instead, Evidence. One idea per file, `status: raw`.
2. **Where:**
   - If `claude-code-setup` is cloned or can be attached to the session, and the private
     terms are there (`.private-terms`, or `PRIVATE_TERMS` in the environment), run
     `git config core.hooksPath .githooks` in it, add `learnings/YYYY-MM-DD-slug.md`,
     run `node --test` and `node scripts/check-public.mjs --require-terms`, and commit to
     `main` as "Learning: <the lesson>".
   - If not, or without the terms, append the same text to `.claude/learnings-inbox.md` in
     the current repo, and tell the user it is waiting to be harvested.
3. Say in one line what was captured, and where.

## Curate, in claude-code-setup

1. Look for a practice it extends in `plugins/agent-workflow/skills/best-practices/`. Extend
   that one rather than adding a near-duplicate.
2. Otherwise add a bullet to the right topic file: the rule in bold, the why, then the
   citation in italics, `*(YYYY-MM-DD-slug)*`.
3. Set the learning to `status: practice` with the topic file in `promoted_to`.
4. A learning that only holds in one repo goes to that repo's `CLAUDE.md` instead.

## Promote

Use the ladder in the repo's `CLAUDE.md`, and pick the lightest form that works:

- **Skill:** a procedure with steps, triggered by a kind of task.
- **Hook:** must always hold, and a script can check it.
- **Subagent:** a recurring delegated role with its own prompt and model.
- **Slash command:** a recurring prompt started by name.
- **Plugin:** two or more related pieces, enabled as a unit.
- **MCP server:** needs a live outside system.

Then add the files where the README's Layout table says. Update the plugin's `plugin.json`,
`.claude-plugin/marketplace.json` and the README's Plugins table if a plugin is new. Set the
learning to `status: promoted` and list every path in `promoted_to`. Check with
`node --test` and `claude plugin validate . --strict` before pushing.

## Harvest

For each repo in `repos.local.txt` (on the laptop, never committed), read its
`.claude/learnings-inbox.md` (a shallow clone, or the GitHub API). An inbox in a private repo
is written freely, so scrub every entry for the public repo before it becomes a learning
here: no names, no paths, no quotes. Run `node scripts/check-public.mjs --require-terms` before committing,
then empty that inbox with a commit in its repo.

## Retire

A practice that stopped being true, or that a tool now handles, is removed from its topic
file. Its learning stays, with `status: retired` and a line saying why.
