#!/usr/bin/env bash
# Install my personal Claude Code setup at user scope: the plugins in
# user/plugins.txt, and the skills under plugins/*/skills as personal skills.
#
# Laptop:  bash setup-user.sh
# Cloud:   paste this as the environment's setup script on claude.ai/code,
#          which runs before Claude starts, in every repo using that environment:
#            curl -fsSL https://raw.githubusercontent.com/ogfrench/claude-code-setup/main/setup-user.sh | bash
#
# Safe to re-run. Skills are copied as personal skills, not loaded through a
# plugin: a personal and a project skill with the same name resolve to one,
# whereas a plugin skill is namespaced and would show up a second time in every
# repo that already has the synced copy.
set -uo pipefail

CONFIG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd)"
if [[ ! -f "$SRC/user/plugins.txt" ]]; then
  # Piped through curl: fetch the repo first.
  SRC="$(mktemp -d)"
  git clone -q --depth 1 https://github.com/ogfrench/claude-code-setup.git "$SRC"
fi

failed=()
# A fresh machine (every cloud session) knows no marketplace, not even the official one.
for m in ogfrench=ogfrench/claude-code-setup claude-plugins-official=anthropics/claude-plugins-official; do
  claude plugin marketplace add "${m#*=}" >/dev/null 2>&1 \
    || claude plugin marketplace update "${m%%=*}" >/dev/null 2>&1 \
    || failed+=("marketplace ${m%%=*}")
done

while read -r p; do
  p="${p%$'\r'}"
  [[ -z "$p" || "$p" == \#* ]] && continue
  claude plugin install "$p" --scope user >/dev/null 2>&1 || failed+=("$p")
done < "$SRC/user/plugins.txt"

# This repo is public: in a real clone, turn on the hook that refuses to push anything private.
if git -C "$SRC" rev-parse --git-dir >/dev/null 2>&1 && [[ -d "$SRC/.githooks" ]]; then
  git -C "$SRC" config core.hooksPath .githooks
fi

mkdir -p "$CONFIG/skills"
for s in "$SRC"/plugins/*/skills/*/; do
  name="$(basename "$s")"
  rm -rf "${CONFIG:?}/skills/$name"
  cp -r "$s" "$CONFIG/skills/$name"
done

echo "plugins: $(claude plugin list 2>/dev/null | grep -c '❯') installed"
echo "skills:  $(ls "$CONFIG/skills" | tr '\n' ' ')"
if ((${#failed[@]})); then
  echo "failed:  ${failed[*]}" >&2
  exit 1
fi
