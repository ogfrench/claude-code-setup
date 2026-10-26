#!/usr/bin/env bash
# Push this repo's shared setup into every repo in repos.local.txt, one PR per repo.
# That list stays out of git: this repo is public, and a repo's name can name a client.
#
# Why copies at all: cloud sessions (claude.ai/code) never install plugins from
# a repo's settings, but they do load its committed .claude/skills/, its hooks
# and its .mcp.json. Local sessions also get the plugins through the marketplace.
#
# Usage: bash sync-to-repos.sh                 # open PRs
#        MERGE=1 bash sync-to-repos.sh         # open (or find) them, mark them ready and squash-merge
#        DRY_RUN=1 bash sync-to-repos.sh       # commit in a temp clone, push nothing
#        KEEP=<dir> DRY_RUN=1 ...              # also keep each prepared clone in <dir>
#        bash sync-to-repos.sh owner/name      # only these repos, not the list
#        DRAFT=1 ...                           # open the PRs as drafts
#        SYNC_LABELS=skip-e2e ...              # add these labels where the repo has them
#
# The sync workflow (.github/workflows/sync.yml) runs it with the list in SYNC_REPOS
# (a secret, same format as the file) and SYNC_QUIET=1. This repo is public and so are
# its Actions logs: quiet mode prints list positions and counts, never a repo's name,
# a PR link or a command's error text.
#
# repos.local.txt: one repo per line, optionally followed by the stacks it uses, which
# decide the practices it gets (see kb/_vocab.json). No stacks means the general ones only:
#   owner/name nextjs,postgres,shadcn
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
BRANCH="chore/claude-code-setup"
SUBJECT="Sync shared Claude Code setup"

# A sync PR may still be a draft, and a draft cannot be merged: mark it ready first.
merge_pr() {
  gh pr ready "$1" >/dev/null 2>&1 || true
  gh pr merge "$1" --squash --delete-branch >/dev/null
  echo "   merged"
}

# One repo, in its own process, so a failure aborts that repo and nothing else.
sync_one() {
  local repo="$1" stacks="${2:-}" base dir renamed="" odd managed rel out url remote_sha
  local work; work="$(mktemp -d)"; trap 'rm -rf "$work"' RETURN
  base="$(gh repo view "$repo" --json defaultBranchRef -q .defaultBranchRef.name)"
  dir="$work/${repo##*/}"
  gh repo clone "$repo" "$dir" -- --quiet --depth 1 --branch "$base" 2>/dev/null
  git -C "$dir" checkout -q -b "$BRANCH"
  # What the repo held before this sync: a hand-edited copy is about to be overwritten.
  local before
  before="$(node --input-type=module -e '
    const { pathToFileURL } = await import("node:url");
    const { checkSync } = await import(pathToFileURL(process.argv[1]).href);
    console.log(checkSync(process.argv[2]).status);
  ' "$HERE/lib/sync-status.mjs" "$dir" 2>/dev/null || echo unknown)"

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

  # A tracked symlink here would make the copy write outside the clone.
  local link
  for link in .claude .claude/skills .claude/agents .claude/commands .claude/knowledge CHANGELOG.md; do
    if [[ -L "$dir/$link" ]]; then echo "   $link is a symlink, not syncing this repo" >&2; return 1; fi
  done

  # Run apply outside a process substitution so its failure stops this repo.
  managed="$(node "$HERE/lib/apply.mjs" "$dir" "$stacks")"
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
  [[ "$before" == modified ]] && echo "   a managed copy had been edited in the repo; this sync overwrites it"

  git -C "$dir" commit -q -m "$SUBJECT

From ogfrench/claude-code-setup. Skills are committed under .claude/
because cloud sessions load those but never install plugins from
project settings.${renamed:+

$renamed}

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
  if [[ "${DRY_RUN:-0}" == 1 ]]; then
    [[ "${SYNC_QUIET:-0}" == 1 ]] || git -C "$dir" show --stat --format=%s HEAD | sed 's/^/   /'
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
    # Same files as the sync already pushed: pushing again would only re-run that repo's
    # CI. Only the managed paths count, so a moved base branch alone does not re-push.
    local paths=()
    mapfile -t paths < <(grep -v '^$' <<<"$managed"; [[ -f "$dir/CHANGELOG.md" ]] && echo CHANGELOG.md)
    if git -C "$dir" diff --quiet FETCH_HEAD HEAD -- "${paths[@]}"; then
      echo "   the open sync PR already has this"
      if [[ "${MERGE:-0}" == 1 ]]; then
        merge_pr "$(gh pr list --repo "$repo" --head "$BRANCH" --state open --json url -q '.[0].url')"
      fi
      return 0
    fi
  fi
  git -C "$dir" push -q --force-with-lease="$BRANCH:$remote_sha" origin "$BRANCH"

  local edited="" flags=() labels=() label have num
  [[ "$before" == modified ]] && edited="**A managed copy here had been edited by hand.** This sync overwrites it. If the edit should stay, make it in claude-code-setup and sync again."
  [[ "${DRAFT:-0}" == 1 ]] && flags+=(--draft)
  if [[ -n "${SYNC_LABELS:-}" ]]; then
    have="$(gh label list --repo "$repo" --limit 1000 --json name -q '.[].name' 2>/dev/null || true)"
    IFS=, read -ra labels <<<"$SYNC_LABELS"
    for label in "${labels[@]}"; do
      if grep -qxF -- "$label" <<<"$have"; then flags+=(--label "$label"); fi
    done
  fi
  local body="Synced from [ogfrench/claude-code-setup](https://github.com/ogfrench/claude-code-setup) by \`sync-to-repos.sh\`.

- \`.claude/skills/\`: committed copies of the shared skills. Cloud sessions load these, but they never install plugins from project settings.
- \`.claude/settings.json\`: registers the \`ogfrench\` marketplace and enables the plugins, for local sessions. Keys the repo already had are kept as they were.
- \`.claude/knowledge/\`: the practices for this repo's stacks (\`bundle.md\`, one card per practice, a search index). A SessionStart hook prints \`must.md\` from it, a few lines.
- \`.claude/claude-code-setup.json\`: lists the synced copies, so a skill removed upstream is removed here too. Records the source commit and a fingerprint, so drift can be detected read-only.${renamed:+
- $renamed}

Edit these in claude-code-setup, not here: the next sync overwrites the copies.${edited:+

$edited}

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
  local ready=() f
  for f in ${flags[@]+"${flags[@]}"}; do [[ "$f" == --draft ]] || ready+=("$f"); done
  create() { gh pr create --repo "$repo" --base "$base" --head "$BRANCH" --title "$SUBJECT" --body "$body" "$@" 2>&1; }
  if out="$(create ${flags[@]+"${flags[@]}"})"; then
    echo "   opened a PR"
  elif [[ "${DRAFT:-0}" == 1 ]] && grep -qi "draft" <<<"$out" \
       && out="$(create ${ready[@]+"${ready[@]}"})"; then
    # Draft PRs are not on every plan for a private repo: open it ready instead.
    echo "   opened a PR (drafts not available there)"
  elif grep -q "already exists" <<<"$out"; then
    # Dependabot's way: the open PR now carries this sync, so refresh its description too.
    # REST, which needs only Pull requests write; `gh pr edit` also reads project fields.
    num="$(gh pr list --repo "$repo" --head "$BRANCH" --state open --json number -q '.[0].number')"
    gh api -X PATCH "repos/$repo/pulls/$num" -f body="$body" >/dev/null
    out="https://github.com/$repo/pull/$num"
    echo "   updated the open PR"
  else
    echo "$out" >&2
    return 1
  fi
  url="$(grep -o 'https://github.com/[^ ]*/pull/[0-9]*' <<<"$out" | tail -1 || true)"
  [[ "${SYNC_QUIET:-0}" == 1 ]] || echo "   $url"
  if [[ "${MERGE:-0}" == 1 ]]; then
    merge_pr "$url"
  fi
}

if [[ "${1:-}" == "--one" ]]; then
  sync_one "$2" "${3:-}"
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
  # In the workflow, GH_TOKEN can only reach the target repos; this repo's own token reads CI.
  ci="$(GH_TOKEN="${GATE_GH_TOKEN:-${GH_TOKEN:-}}" gh run list -R ogfrench/claude-code-setup --workflow check.yml --commit "$head" --json conclusion -q '.[0].conclusion')"
  if [[ "$ci" != "success" ]]; then
    echo "Refusing: CI on ${head:0:7} is '${ci:-not run yet}', not success." >&2
    exit 1
  fi
fi

LIST="$HERE/repos.local.txt"
if ((! $#)) && [[ -z "${SYNC_REPOS:-}" && ! -f "$LIST" ]]; then
  # The list used to be tracked as repos.txt. Recover it once from this clone's history.
  for c in $(git -C "$HERE" reflog --format=%H 2>/dev/null) $(git -C "$HERE" rev-list --all 2>/dev/null); do
    if git -C "$HERE" cat-file -e "$c:repos.txt" 2>/dev/null; then
      git -C "$HERE" show "$c:repos.txt" > "$LIST"
      echo "Moved the repo list out of git, into repos.local.txt (from ${c:0:7})."
      break
    fi
  done
fi
if (($#)); then repos=("$@")
elif [[ -n "${SYNC_REPOS:-}" ]]; then mapfile -t repos < <(grep -v -e '^#' -e '^\s*$' <<<"$SYNC_REPOS")
elif [[ -f "$LIST" ]]; then mapfile -t repos < <(grep -v -e '^#' -e '^\s*$' "$LIST")
else
  echo "No repos.local.txt: list the repos to sync in it, one owner/name per line." >&2
  exit 1
fi
if ((! ${#repos[@]})); then
  echo "The repo list is empty." >&2
  exit 1
fi
quiet="${SYNC_QUIET:-0}"
failed=() n=0 changed=0 merged=0
for line in "${repos[@]}"; do
  line="${line%$'\r'}"
  read -r repo stacks _ <<<"$line"
  n=$((n + 1))
  if [[ "$quiet" == 1 ]]; then
    # Position in the list only. A command's error text can name the repo, so it is dropped.
    echo "== repo $n of ${#repos[@]}"
    if out="$(bash "$HERE/sync-to-repos.sh" --one "$repo" "${stacks:-}" 2>/dev/null)"; then
      grep -E '^   (already in sync|the open sync PR already has this|opened a PR|updated the open PR|merged|a managed copy)' <<<"$out" || true
      grep -qE '^   (opened|updated)' <<<"$out" && changed=$((changed + 1))
      grep -qx '   merged' <<<"$out" && merged=$((merged + 1))
    else
      echo "   failed (run it from a laptop to see why)"
      failed+=("$n")
    fi
  else
    echo "== $repo${stacks:+ ($stacks)}"
    bash "$HERE/sync-to-repos.sh" --one "$repo" "${stacks:-}" || failed+=("$repo")
  fi
done
if [[ "$quiet" == 1 ]]; then
  echo "${#repos[@]} repos: $changed with a sync PR opened or updated, $merged merged, ${#failed[@]} failed."
fi
if ((${#failed[@]})); then
  echo "Failed: ${failed[*]}" >&2
  exit 1
fi
