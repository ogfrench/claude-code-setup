#!/usr/bin/env bash
# Push this repo's shared setup into every repo in repos.txt, one PR per repo.
#
# Why copies at all: cloud sessions (claude.ai/code) never install plugins from
# a repo's settings, but they do load its committed .claude/skills/, its hooks
# and its .mcp.json. Local sessions also get the plugins through the marketplace.
#
# Usage: bash sync-to-repos.sh                 # open PRs
#        MERGE=1 bash sync-to-repos.sh         # open and squash-merge them
#        DRY_RUN=1 bash sync-to-repos.sh       # commit in a temp clone, push nothing
#        KEEP=<dir> DRY_RUN=1 ...              # also keep each prepared clone in <dir>
#        bash sync-to-repos.sh owner/name      # only these repos, not repos.txt
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
BRANCH="chore/claude-code-setup"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if (($#)); then repos=("$@"); else mapfile -t repos < <(grep -v -e '^#' -e '^\s*$' "$HERE/repos.txt"); fi

for repo in "${repos[@]}"; do
  repo="${repo%$'\r'}"
  echo "== $repo"
  base="$(gh repo view "$repo" --json defaultBranchRef -q .defaultBranchRef.name)"
  dir="$WORK/${repo##*/}"
  gh repo clone "$repo" "$dir" -- --quiet --depth 1 --branch "$base" 2>/dev/null
  git -C "$dir" checkout -q -b "$BRANCH"
  renamed=""

  # `.CLAUDE` works on Windows and macOS but Claude on Linux (cloud sessions)
  # only reads `.claude`. Rename through git, in two steps, or a case-insensitive
  # filesystem treats it as a no-op.
  odd="$(git -C "$dir" ls-files | sed -n 's#^\([^/]*\)/.*#\1#p' | sort -u | grep -ix '\.claude' | grep -vx '\.claude' || true)"
  if [[ -n "$odd" ]]; then
    git -C "$dir" mv "$odd" .claude-case-fix && git -C "$dir" mv .claude-case-fix .claude
    renamed="Renamed \`$odd/\` to \`.claude/\`: Claude on Linux, which cloud sessions run on, only reads the lowercase name."
  fi

  # -f because some repos gitignore .claude/; only the paths apply.mjs manages are forced in.
  while read -r rel; do
    if [[ -e "$dir/$rel" ]]; then git -C "$dir" add -f -- "$rel"
    else git -C "$dir" rm -r -q --cached --ignore-unmatch -- "$rel"; fi
  done < <(node "$HERE/lib/apply.mjs" "$dir")

  if [[ -f "$dir/CHANGELOG.md" ]] && grep -q '^## Unreleased' "$dir/CHANGELOG.md" \
     && ! grep -q 'ogfrench/claude-code-setup' "$dir/CHANGELOG.md"; then
    node -e '
      const fs = require("fs"), f = process.argv[1];
      const day = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const entry = `### Claude Code setup, ${day}\n\n- Added the shared Claude Code skills under \`.claude/skills/\` and pointed \`.claude/settings.json\` at the ogfrench/claude-code-setup plugin marketplace, synced from that repo.\n\n`;
      fs.writeFileSync(f, fs.readFileSync(f, "utf8").replace(/^## Unreleased\r?\n\r?\n/m, (m) => m + entry));
    ' "$dir/CHANGELOG.md"
    git -C "$dir" add CHANGELOG.md
  fi

  if git -C "$dir" diff --cached --quiet; then
    echo "   already in sync"
    continue
  fi
  git -C "$dir" commit -q -m "Sync shared Claude Code setup

From ogfrench/claude-code-setup. Skills are committed under .claude/
because cloud sessions load those but never install plugins from
project settings.${renamed:+

$renamed}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  if [[ "${DRY_RUN:-0}" == 1 ]]; then
    git -C "$dir" show --stat --format=%s HEAD | sed 's/^/   /'
    [[ -n "${KEEP:-}" ]] && cp -r "$dir" "$KEEP/"
    continue
  fi
  git -C "$dir" push -q --force origin "$BRANCH"
  body="Synced from [ogfrench/claude-code-setup](https://github.com/ogfrench/claude-code-setup) by \`sync-to-repos.sh\`.

- \`.claude/skills/\`: committed copies of the shared skills. Cloud sessions load these, but they never install plugins from project settings.
- \`.claude/settings.json\`: registers the \`ogfrench\` marketplace and enables the plugins, for local sessions. Existing keys are kept.
- \`.claude/claude-code-setup.json\`: lists the synced copies, so a skill removed upstream is removed here too.${renamed:+
- $renamed}

Edit these in claude-code-setup, not here: the next sync overwrites the copies.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
  url="$(gh pr create --repo "$repo" --base "$base" --head "$BRANCH" \
           --title "Sync shared Claude Code setup" --body "$body" 2>/dev/null \
         || gh pr view "$BRANCH" --repo "$repo" --json url -q .url)"
  echo "   $url"
  if [[ "${MERGE:-0}" == 1 ]]; then
    gh pr merge "$url" --squash --delete-branch >/dev/null
    echo "   merged"
  fi
done
