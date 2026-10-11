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
SUBJECT="Sync shared Claude Code setup"

# One repo, in its own process, so a failure aborts that repo and nothing else.
sync_one() {
  local repo="$1" base dir renamed="" odd managed rel out url remote_sha
  local work; work="$(mktemp -d)"; trap 'rm -rf "$work"' RETURN
  base="$(gh repo view "$repo" --json defaultBranchRef -q .defaultBranchRef.name)"
  dir="$work/${repo##*/}"
  gh repo clone "$repo" "$dir" -- --quiet --depth 1 --branch "$base" 2>/dev/null
  git -C "$dir" checkout -q -b "$BRANCH"

  # `.CLAUDE` works on Windows and macOS but Claude on Linux (cloud sessions)
  # only reads `.claude`. Rename through git, in two steps, or a case-insensitive
  # filesystem treats it as a no-op.
  odd="$(git -C "$dir" ls-files | sed -n 's#^\([^/]*\)/.*#\1#p' | sort -u | grep -ix '\.claude' || true)"
  if [[ -n "$odd" && "$odd" != ".claude" ]]; then
    if [[ "$(wc -l <<<"$odd")" -gt 1 ]]; then
      echo "   both of these are tracked, merge them by hand first: $(tr '\n' ' ' <<<"$odd")" >&2
      return 1
    fi
    git -C "$dir" mv "$odd" .claude-case-fix && git -C "$dir" mv .claude-case-fix .claude
    renamed="Renamed \`$odd/\` to \`.claude/\`: Claude on Linux, which cloud sessions run on, only reads the lowercase name."
  fi

  # Run apply outside a process substitution so its failure stops this repo.
  managed="$(node "$HERE/lib/apply.mjs" "$dir")"
  # -f because some repos gitignore .claude/; only the paths apply.mjs manages are forced in.
  while read -r rel; do
    [[ -z "$rel" ]] && continue
    if [[ -e "$dir/$rel" ]]; then git -C "$dir" add -f -- "$rel"
    else git -C "$dir" rm -r -q --cached --ignore-unmatch -- "$rel"; fi
  done <<<"$managed"

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
    return 0
  fi
  git -C "$dir" commit -q -m "$SUBJECT

From ogfrench/claude-code-setup. Skills are committed under .claude/
because cloud sessions load those but never install plugins from
project settings.${renamed:+

$renamed}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  if [[ "${DRY_RUN:-0}" == 1 ]]; then
    git -C "$dir" show --stat --format=%s HEAD | sed 's/^/   /'
    [[ -n "${KEEP:-}" ]] && cp -r "$dir" "$KEEP/"
    return 0
  fi

  # The branch is ours to overwrite only if its tip is one of our sync commits.
  remote_sha="$(git -C "$dir" ls-remote origin "refs/heads/$BRANCH" | cut -f1)"
  if [[ -n "$remote_sha" ]]; then
    git -C "$dir" fetch -q --depth 1 origin "$BRANCH"
    if [[ "$(git -C "$dir" log -1 --format=%s FETCH_HEAD)" != "$SUBJECT" ]]; then
      echo "   $BRANCH has someone else's commit on it, not overwriting" >&2
      return 1
    fi
  fi
  git -C "$dir" push -q --force-with-lease="$BRANCH:$remote_sha" origin "$BRANCH"

  local body="Synced from [ogfrench/claude-code-setup](https://github.com/ogfrench/claude-code-setup) by \`sync-to-repos.sh\`.

- \`.claude/skills/\`: committed copies of the shared skills. Cloud sessions load these, but they never install plugins from project settings.
- \`.claude/settings.json\`: registers the \`ogfrench\` marketplace and enables the plugins, for local sessions. Keys the repo already had are kept as they were.
- \`.claude/claude-code-setup.json\`: lists the synced copies, so a skill removed upstream is removed here too.${renamed:+
- $renamed}

Edit these in claude-code-setup, not here: the next sync overwrites the copies.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
  if ! out="$(gh pr create --repo "$repo" --base "$base" --head "$BRANCH" --title "$SUBJECT" --body "$body" 2>&1)"; then
    grep -q "already exists" <<<"$out" || { echo "$out" >&2; return 1; }
    out="$(gh pr list --repo "$repo" --head "$BRANCH" --state open --json url -q '.[0].url')"
  fi
  url="$(grep -o 'https://github.com/[^ ]*/pull/[0-9]*' <<<"$out" | tail -1)"
  echo "   $url"
  if [[ "${MERGE:-0}" == 1 ]]; then
    gh pr merge "$url" --squash --delete-branch >/dev/null
    echo "   merged"
  fi
}

if [[ "${1:-}" == "--one" ]]; then
  sync_one "$2"
  exit
fi

# Only ship what CI tested: the checkout must be exactly origin/main, and the
# check workflow must have passed on that commit. A dry run skips the gate.
if [[ "${DRY_RUN:-0}" != 1 ]]; then
  git -C "$HERE" fetch -q origin main
  head="$(git -C "$HERE" rev-parse HEAD)"
  if [[ -n "$(git -C "$HERE" status --porcelain)" || "$head" != "$(git -C "$HERE" rev-parse origin/main)" ]]; then
    echo "Refusing: commit and push first, the checkout must equal origin/main." >&2
    exit 1
  fi
  ci="$(gh run list -R ogfrench/claude-code-setup --workflow check.yml --commit "$head" --json conclusion -q '.[0].conclusion')"
  if [[ "$ci" != "success" ]]; then
    echo "Refusing: CI on ${head:0:7} is '${ci:-not run yet}', not success." >&2
    exit 1
  fi
fi

if (($#)); then repos=("$@"); else mapfile -t repos < <(grep -v -e '^#' -e '^\s*$' "$HERE/repos.txt"); fi
failed=()
for repo in "${repos[@]}"; do
  repo="${repo%$'\r'}"
  echo "== $repo"
  bash "$HERE/sync-to-repos.sh" --one "$repo" || failed+=("$repo")
done
if ((${#failed[@]})); then
  echo "Failed: ${failed[*]}" >&2
  exit 1
fi
