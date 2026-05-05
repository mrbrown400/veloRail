#!/usr/bin/env bash
set -u

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$repo_root" ]; then
  echo "GitNexus post-commit refresh skipped: not inside a git repository." >&2
  exit 0
fi

cd "$repo_root" || exit 0

head_commit="$(git rev-parse HEAD 2>/dev/null || true)"
if [ -z "$head_commit" ]; then
  echo "GitNexus post-commit refresh skipped: cannot resolve HEAD." >&2
  exit 0
fi

git_common_dir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || git rev-parse --absolute-git-dir 2>/dev/null || true)"
if [ -z "$git_common_dir" ]; then
  echo "GitNexus post-commit refresh skipped: cannot resolve git common dir." >&2
  exit 0
fi

state_dir="$git_common_dir/gitnexus-after-commit"
last_file="$state_dir/last-analyzed-commit"
lock_dir="$state_dir/analyze.lock"
mkdir -p "$state_dir"

restore_dir=""
cleanup() {
  rmdir "$lock_dir" 2>/dev/null || true
  if [ -n "$restore_dir" ]; then
    rm -rf "$restore_dir" 2>/dev/null || true
  fi
}

if [ -f "$last_file" ] && [ "$(cat "$last_file" 2>/dev/null)" = "$head_commit" ]; then
  echo "GitNexus index already refreshed for $head_commit."
  exit 0
fi

if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "GitNexus refresh already running; skipping duplicate post-commit analyze."
  exit 0
fi
trap cleanup EXIT

if [ -f "$last_file" ] && [ "$(cat "$last_file" 2>/dev/null)" = "$head_commit" ]; then
  echo "GitNexus index already refreshed for $head_commit."
  exit 0
fi

restore_dir="$(mktemp -d "${TMPDIR:-/tmp}/gitnexus-context.XXXXXX")"
context_files=(
  "AGENTS.md"
  "CLAUDE.md"
  ".claude/skills/gitnexus/gitnexus-cli/SKILL.md"
  ".claude/skills/gitnexus/gitnexus-debugging/SKILL.md"
  ".claude/skills/gitnexus/gitnexus-exploring/SKILL.md"
  ".claude/skills/gitnexus/gitnexus-guide/SKILL.md"
  ".claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md"
  ".claude/skills/gitnexus/gitnexus-refactoring/SKILL.md"
)

snapshot_file="$restore_dir/files.txt"
: > "$snapshot_file"
for file in "${context_files[@]}"; do
  if [ -e "$file" ]; then
    mkdir -p "$restore_dir/$(dirname "$file")"
    cp -p "$file" "$restore_dir/$file"
    printf '%s\n' "$file" >> "$snapshot_file"
  fi
done

if command -v npx >/dev/null 2>&1; then
  echo "Refreshing GitNexus index after commit $head_commit..."
  npx gitnexus analyze
  status=$?
elif command -v gitnexus >/dev/null 2>&1; then
  echo "Refreshing GitNexus index after commit $head_commit..."
  gitnexus analyze
  status=$?
else
  echo "GitNexus post-commit refresh skipped: neither npx nor gitnexus is available." >&2
  echo "Fallback: run 'npx gitnexus analyze' from the repo root when GitNexus is installed." >&2
  exit 0
fi

if [ "$status" -eq 0 ]; then
  while IFS= read -r file; do
    if [ -n "$file" ] && [ -e "$restore_dir/$file" ]; then
      mkdir -p "$(dirname "$file")"
      cp -p "$restore_dir/$file" "$file"
    fi
  done < "$snapshot_file"
  printf '%s\n' "$head_commit" > "$last_file"
  echo "GitNexus index refreshed for $head_commit; generated context files restored."
else
  echo "GitNexus post-commit refresh failed with exit code $status." >&2
  echo "The commit was not reverted. Run 'npx gitnexus analyze' manually after resolving the failure." >&2
fi

exit 0
