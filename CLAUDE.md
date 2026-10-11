# claude-code-setup

My Claude Code setup (skills, plugins, hooks, MCP servers, settings) and a living record of
what working with Claude has taught me. The README explains the setup and the sync. This
file is how to keep the knowledge part alive.

## This repo is public: a hard rule

Everything here is readable by anyone: files, history, commit messages, file names and CI
logs. None of it may contain:

- a client's name, a project codename, or a real brand used as an example
- anything from a private repo, including its name: a repo's name can name a client
- an employer's confidential work, or text copied from a confidential document
- secrets, tokens, internal hostnames, IPs, email addresses or people's names

Write the lesson so it stands on its own: "a quiz app's image job", not the client's product;
"a running-shoe brand", not the brand. If a lesson cannot be told without the confidential
part, it stays out. A learning's `source` is a repo listed in `public-repos.txt`, or
"a private project" with no other detail.

**Enforced, not just written.** `scripts/check-public.mjs` runs before every push (the
`.githooks/pre-push` hook), in `node --test`, and in CI. Run it yourself before committing.
In a fresh clone, enable the hook first: `git config core.hooksPath .githooks`. Names that
must never appear live outside the repo, in `.private-terms` (gitignored), the
`PRIVATE_TERMS` CI secret and the same variable in the cloud environment, so never add them
to a tracked file, even to forbid them. The hook and CI refuse to run without them: a
session that has no terms does not push here, it leaves the learning in the other repo's
inbox instead.
If the check fails, fix the text; never loosen the check to get a commit through.

Removing a leak from the files does not remove it from history. Say so, and ask before
rewriting `main`.

## How knowledge moves here

```
learning (raw) -> practice (curated) -> promoted (a skill, agent, hook, command, plugin...) -> retired
```

- **A learning** is one dated note in `learnings/`: what happened, why, what to do instead,
  and the evidence. Raw, cheap to write, never synced to other repos. Template and statuses
  in `learnings/README.md`.
- **A practice** is a curated rule in the `best-practices` skill
  (`plugins/agent-workflow/skills/best-practices/`), one file per topic. That skill is synced
  into every repo and installed on the laptop, so Claude reads it everywhere.
- **A promotion** turns a practice into something Claude runs or loads by itself. The ladder
  below says which.

The `learning-loop` skill does the capturing, curating, promoting and harvesting. Use it.

## The promotion ladder

Pick the lightest form that does the job.

| Promote to | When | Lives in |
| --- | --- | --- |
| **A line in one repo's CLAUDE.md** | It only holds in that repo | that repo |
| **A practice** | It holds across repos, and was seen twice, or once at a high cost | `best-practices/<topic>.md` |
| **A skill** | It is a procedure with steps, triggered by a kind of task, longer than a few lines | `plugins/<plugin>/skills/<name>/` |
| **A hook** | It must always hold and a script can check it (a scan before a push) | `project/settings.json` |
| **A subagent** | It is a recurring delegated role with its own prompt and model (a cheap reviewer) | `plugins/<plugin>/agents/<name>.md` |
| **A slash command** | It is a recurring prompt the user starts by name | `plugins/<plugin>/commands/<name>.md` |
| **A plugin** | Two or more related skills, agents or commands worth enabling as a unit | `plugins/<plugin>/` and the marketplace |
| **An MCP server** | It needs a live outside system | `project/mcp.json` |
| **Retired** | It stopped being true, or the tool fixed it | its learning keeps the reason |

## Rules for edits

- **Every practice cites its learnings** by file name, and every promoted learning names
  where it went (`promoted_to`). `node --test` checks both.
- **One idea per learning.** Two ideas are two files.
- **Merge, don't pile up.** Before adding a practice, look for one it extends.
- **Keep the voice:** plain US English, short sentences, no em dashes, no flattery.
- **Ship as the README says:** `node --test` (which includes the public check),
  `claude plugin validate . --strict`, then push to `main`. The sync to other repos is a separate, explicit step.
