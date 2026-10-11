# claude-code-setup

My Claude Code setup, kept in one place and pushed to every repo I own: skills, plugins, hooks, MCP servers and settings. It works in local sessions and in cloud sessions on claude.ai/code.

It is also a living record of what working with Claude has taught me. Lessons are captured as dated learnings, curated into practices that Claude reads in every repo, and promoted into skills, subagents, hooks, commands or plugins when they earn it. See [Learnings and practices](#learnings-and-practices). The repo is public, so nothing in it names a client or comes from a private repo. A check enforces that: see [Public by design](#public-by-design).

## Two layers

**Me, everywhere: `setup-user.sh`.** It installs every plugin in `user/plugins.txt` and copies the skills into `~/.claude/skills`, at user scope. Run it once on a laptop. For cloud sessions, paste this as the setup script of the environment on claude.ai/code. It runs before Claude starts, in every repo that uses the environment:

```sh
curl -fsSL https://raw.githubusercontent.com/ogfrench/claude-code-setup/main/setup-user.sh | bash
```

Without it, a cloud session has no plugins at all, because cloud sessions never install plugins from a repo's settings.

**Each repo, for anyone: `sync-to-repos.sh`.** It commits the skills into each repo's `.claude/skills/` and merges `project/settings.json`, so a teammate's session, or a cloud session without the setup script, still gets them. Repos only enable team-useful plugins. Personal modes such as caveman and ponytail stay in `user/plugins.txt`, so nobody else is switched into them.

The source of truth is this repo. The copies in each project are overwritten on the next sync, so edit here.

## Layout

| Path | What it is | Lands in each repo as |
| --- | --- | --- |
| `plugins/<plugin>/skills/<name>/SKILL.md` | A skill | `.claude/skills/<name>/` (copied) |
| `plugins/<plugin>/agents/<name>.md` | A subagent | `.claude/agents/<name>.md` (copied) |
| `plugins/<plugin>/commands/<name>.md` | A slash command | `.claude/commands/<name>.md` (copied) |
| `project/settings.json` | Hooks, permissions, enabled plugins, env | merged into `.claude/settings.json` |
| `project/mcp.json` | MCP servers | merged into `.mcp.json` |
| `project/retired.json` | Settings keys to take back out | removed from `.claude/settings.json` |
| `user/plugins.txt` | My plugins, laptop and cloud | not synced; installed by `setup-user.sh` |
| `.claude-plugin/marketplace.json` | The `ogfrench` marketplace | registered by the merged settings |
| `repos.local.txt` | Which repos get all this. Gitignored: a repo's name can name a client | |
| `public-repos.txt` | My repos that are public, so they may be named here | |
| `learnings/` | Dated raw lessons, one per file | not synced |
| `plugins/agent-workflow/skills/best-practices/` | Curated practices, one file per topic | `.claude/skills/best-practices/` (copied) |
| `CLAUDE.md` | How Claude keeps the knowledge base: the public-repo rule and the promotion ladder | not synced |

Merging keeps everything a repo already has. Objects merge key by key, arrays gain the entries they lack, and a value the repo already set wins, so a repo's own permissions, hooks and disabled plugins survive. Merging never removes anything, so to take a key back out, list it in `project/retired.json`. Copies are listed in `.claude/claude-code-setup.json` inside each repo. A skill deleted or renamed here is therefore removed there on the next sync, while skills a repo wrote itself are never touched.

## Adding things

**A skill.** Create `plugins/frog-writing/skills/<name>/SKILL.md` (or `plugins/agent-workflow/skills/` for how work is run) with `name` and `description` in its frontmatter. If it belongs to a different theme, start a new plugin in `plugins/<plugin>/` and add an entry to `.claude-plugin/marketplace.json` with `"source": "./plugins/<plugin>"`.

**A hook.** Add it under `hooks` in `project/settings.json`, in the same shape as a normal settings file. Hooks belong here and not inside a plugin, because plugin hooks never run in cloud sessions. A hook runs in every repo, on Linux in the cloud and on Windows locally, so keep the command portable.

**An MCP server.** Add it under `mcpServers` in `project/mcp.json`. Never commit a secret. Write `"Authorization": "Bearer ${SOME_API_KEY}"` and set `SOME_API_KEY` in the cloud environment's settings on claude.ai/code and in your shell locally. Servers that only run on one machine, such as local wrapper scripts or a local build, don't belong here.

**A plugin.** For a third-party one, add an entry to `.claude-plugin/marketplace.json` pinned by `sha`. To update a pinned plugin, read the upstream diff and bump the `sha`. Then add it to `user/plugins.txt` if it is just for you, or enable it in `project/settings.json` if every repo should have it. Re-run `setup-user.sh` locally; cloud sessions pick it up on their next start.

**A repo.** Add `owner/name` to `repos.local.txt`, which stays on the laptop. The first sync after the list left git recovers it from the clone's history by itself.

## Learnings and practices

```
learning (raw) -> practice (curated) -> promoted (skill, subagent, hook, command, plugin, MCP) -> retired
```

- **Capture** a lesson as `learnings/YYYY-MM-DD-slug.md` with the template in `learnings/README.md`. From another repo, the `learning-loop` skill writes it here, or to that repo's `.claude/learnings-inbox.md` to be harvested later.
- **Curate** it into a topic of the `best-practices` skill, citing the learning. That skill is synced everywhere, so every session can read it.
- **Promote** a practice when it earns a heavier form: the ladder in `CLAUDE.md` says when a practice should be a skill, a subagent, a hook, a command, a plugin or an MCP server. `model-delegation` and the `cheap-reviewer` subagent are the first ones promoted.
- **Retire** what stops being true; the learning keeps the reason.

`node --test` checks the links both ways: every learning's `promoted_to` exists, and every practice cites a learning that exists.

## Public by design

Anyone can read this repo, its history and its CI logs. So it never names a client, an employer's confidential work, a private repo or a person, and it carries no secrets, hostnames, IPs or email addresses. `CLAUDE.md` has the full rule.

`scripts/check-public.mjs` enforces it, in three places:

- **Before a push**, from `.githooks/pre-push`, on the commits being pushed: their lines, file names and messages. `setup-user.sh` enables the hook for the clone it runs from; elsewhere, run `git config core.hooksPath .githooks` once.
- **In `node --test`**, on every tracked file.
- **In CI**, on the commits of each push or PR, as a backstop. By then the commit is already public, so the hook is the guard that counts.

It flags any `ogfrench/` repo missing from `public-repos.txt`, any email address but the no-reply and `example.com` ones, and any IP address outside loopback and the documentation ranges. Names that must never appear (clients, codenames) can't be listed in a public repo, so they live outside it, one per line, in three places:

- **The laptop:** `.private-terms` in the clone (gitignored).
- **CI:** the `PRIVATE_TERMS` repository secret (Settings, Secrets and variables, Actions).
- **Cloud sessions that push here:** `PRIVATE_TERMS` as an environment variable of the claude.ai/code environment.

The hook and CI refuse to run without them, so a fresh clone cannot push unchecked. A term matches from the start of a word, in any case, whatever separates its words: `acme bank` also catches `AcmeBank`, `acme-bank`, `acmebanks` and a name wrapped over two lines, but not a longer word that merely contains it. A finding names the place and the rule, never the matched text, and a file whose name is flagged is shown by number.

## Checking and shipping a change

```sh
node --test                                 # unit tests and the public check, no dependencies
claude plugin validate . --strict           # marketplace manifest
DRY_RUN=1 bash sync-to-repos.sh             # prepare every repo, push nothing
MERGE=1 bash sync-to-repos.sh               # one PR per repo, squash-merged
bash sync-to-repos.sh ogfrench/frogQuiz     # just one repo
```

CI runs the first two plus an apply into an empty folder on every push and PR. A real sync refuses to run unless the checkout is exactly `origin/main` and CI passed on that commit, so only what CI tested reaches the repos.

## Plugins

| Plugin | Source |
| --- | --- |
| `frog-writing` | This repo. `frogify` and `deslopify` are mine. `humanizer` is vendored from [blader/humanizer](https://github.com/blader/humanizer) at `9600f2b`, MIT, with its license kept in its folder. |
| `agent-workflow` | This repo. How work is run: `model-delegation` (which model does which work), `best-practices` (the curated practices), `learning-loop` (capture, curate, promote) and the `cheap-reviewer` subagent. |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman), pinned by SHA |
| `ponytail` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), pinned by SHA |
| `21st` | [21st-dev/claude-code-plugin](https://github.com/21st-dev/claude-code-plugin), pinned by SHA |

The official plugins (superpowers, context7, playwright and the rest) come from `claude-plugins-official`, which Claude Code already knows. `project/settings.json` enables them directly.
