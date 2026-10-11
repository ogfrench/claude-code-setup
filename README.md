# claude-code-setup

My Claude Code setup, kept in one place and pushed to every repo I own: skills, plugins, hooks, MCP servers and settings. It works in local sessions and in cloud sessions on claude.ai/code.

## How it reaches a repo

There are two paths, because cloud sessions and local sessions load different things.

- **Cloud sessions never install plugins from a repo's settings.** They do load whatever the repo has committed under `.claude/` (skills, agents, commands, settings with hooks) and its `.mcp.json`. So `sync-to-repos.sh` copies the skills into each repo and merges the settings.
- **Local sessions** also pick up the plugin marketplace that the merged settings register. That is how the third-party plugins (caveman, ponytail, 21st) and the official ones arrive.

The source of truth is this repo. The copies in each project are overwritten on the next sync, so edit here.

## Layout

| Path | What it is | Lands in each repo as |
| --- | --- | --- |
| `plugins/<plugin>/skills/<name>/SKILL.md` | A skill | `.claude/skills/<name>/` (copied) |
| `plugins/<plugin>/agents/<name>.md` | A subagent | `.claude/agents/<name>.md` (copied) |
| `plugins/<plugin>/commands/<name>.md` | A slash command | `.claude/commands/<name>.md` (copied) |
| `project/settings.json` | Hooks, permissions, enabled plugins, env | merged into `.claude/settings.json` |
| `project/mcp.json` | MCP servers | merged into `.mcp.json` |
| `.claude-plugin/marketplace.json` | The `ogfrench` marketplace | registered by the merged settings |
| `repos.txt` | Which repos get all this | |

Merging keeps everything a repo already has. Objects merge key by key, arrays gain the entries they lack, and nothing is removed, so a repo's own permissions and hooks survive. Copies are listed in `.claude/claude-code-setup.json` inside each repo. A skill deleted or renamed here is therefore removed there on the next sync, while skills a repo wrote itself are never touched.

## Adding things

**A skill.** Create `plugins/frog-writing/skills/<name>/SKILL.md` with `name` and `description` in its frontmatter. If it belongs to a different theme, start a new plugin in `plugins/<plugin>/` and add an entry to `.claude-plugin/marketplace.json` with `"source": "./plugins/<plugin>"`.

**A hook.** Add it under `hooks` in `project/settings.json`, in the same shape as a normal settings file. Hooks belong here and not inside a plugin, because plugin hooks never run in cloud sessions. A hook runs in every repo, on Linux in the cloud and on Windows locally, so keep the command portable.

**An MCP server.** Add it under `mcpServers` in `project/mcp.json`. Never commit a secret. Write `"Authorization": "Bearer ${SOME_API_KEY}"` and set `SOME_API_KEY` in the cloud environment's settings on claude.ai/code and in your shell locally. Servers that only run on one machine, such as the Neon wrapper scripts or the local frogconvert build, don't belong here.

**A third-party plugin.** Add an entry to `.claude-plugin/marketplace.json` pinned by `sha`, then enable it in `project/settings.json` as `<name>@ogfrench`. To update a pinned plugin, read the upstream diff and bump the `sha`. Note that third-party plugins reach local sessions only, for the reason above.

**A repo.** Add `owner/name` to `repos.txt`.

## Checking and shipping a change

```sh
node --test                                 # unit tests, no dependencies
claude plugin validate . --strict           # marketplace manifest
DRY_RUN=1 bash sync-to-repos.sh             # prepare every repo, push nothing
MERGE=1 bash sync-to-repos.sh               # one PR per repo, squash-merged
bash sync-to-repos.sh ogfrench/frogQuiz     # just one repo
```

CI runs the first two plus an apply into an empty folder on every push and PR.

## Plugins

| Plugin | Source |
| --- | --- |
| `frog-writing` | This repo. `frogify` and `deslopify` are mine. `humanizer` is vendored from [blader/humanizer](https://github.com/blader/humanizer) at `9600f2b`, MIT, with its license kept in its folder. |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman), pinned by SHA |
| `ponytail` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), pinned by SHA |
| `21st` | [21st-dev/claude-code-plugin](https://github.com/21st-dev/claude-code-plugin), pinned by SHA |

The official plugins (superpowers, context7, playwright and the rest) come from `claude-plugins-official`, which Claude Code already knows. `project/settings.json` enables them directly.
