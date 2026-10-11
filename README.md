# claude-code-setup

My Claude Code setup as a plugin marketplace. Projects point at this repo from their committed `.claude/settings.json`, and Claude Code installs from it, locally and in cloud sessions alike. Change a skill here once and every project picks it up.

## Plugins

| Plugin | Source |
|---|---|
| `frog-writing` | This repo. `frogify` and `deslopify` are mine. `humanizer` is vendored from [blader/humanizer](https://github.com/blader/humanizer) at `9600f2b`, MIT, license kept in its folder. |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman), pinned by SHA |
| `ponytail` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), pinned by SHA |
| `21st` | [21st-dev/claude-code-plugin](https://github.com/21st-dev/claude-code-plugin), pinned by SHA |

Third-party plugins are pinned to a commit, so an upstream push changes nothing until the SHA here is bumped. To update one, review the upstream diff, then change its `sha` in `.claude-plugin/marketplace.json`.

Official plugins (superpowers, context7, playwright and the rest) come from `claude-plugins-official`, which Claude Code already knows about. Projects enable them directly.

## Using it in a project

`.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "ogfrench": { "source": { "source": "github", "repo": "ogfrench/claude-code-setup" } }
  },
  "enabledPlugins": {
    "frog-writing@ogfrench": true,
    "caveman@ogfrench": true
  }
}
```

## Checking changes

```sh
claude plugin validate .
```
