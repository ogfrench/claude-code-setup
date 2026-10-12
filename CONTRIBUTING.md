# Contributing

This repo is public. These rules apply to everyone, including Claude sessions.

## Rules

1. **Only pull requests. Never push to `main`.** Work on a branch, open a PR, merge it when
   CI is green. This holds for fixes, docs and learnings alike.
2. **Run the public check before every push:** `node scripts/check-public.mjs`. In a fresh
   clone, turn on the hook that does this for you: `git config core.hooksPath .githooks`. The
   check cannot know a client's name, so read your own diff for names too.
3. **Run the tests:** `node --test`, and `claude plugin validate . --strict`.
4. **Nothing private, ever:** no client or project names, no private repo names, no
   secrets, hostnames, IPs, emails or people's names. See `CLAUDE.md`.
5. **Do not loosen a check to get a PR through.** If a check fails, fix the text.
6. **Edit nodes, not generated files.** Change `kb/practices/` or `kb/tools/`, then run
   `node scripts/build-kb.mjs`.
7. **One idea per learning, one change per PR.** Keep PRs small enough to read.

## Merging

- CI must be green. A PR that is red is not merged.
- Squash or merge commit both fine; never rewrite history on a shared branch.

## Settings to turn on (repo owner)

In GitHub, Settings, Branches, add a rule for `main`: require a pull request before merging,
require the `check` status to pass, and block force pushes and deletion.
