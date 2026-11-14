#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

for harness in opencode claude codex kilo cursor agy hermes pi universal chat pi-code oh-my-pi aider cline; do
  target="$tmp/$harness"
  node "$repo/bin/cli.js" -a "$harness" -d "$target" -y >/dev/null

  if [[ "$harness" == "chat" ]]; then
    test -f "$target/LEARNER.md"
    echo "PASS: $harness install and learner setup"
    continue
  fi

  found=0
  for candidate in \
    "$target/.agents/skills/teach/SKILL.md" \
    "$target/.opencode/skills/teach/SKILL.md" \
    "$target/.claude/skills/teach/SKILL.md" \
    "$target/.kilo/skills/teach/SKILL.md" \
    "$target/.cursor/rules/teach.mdc" \
    "$target/.hermes/skills/teach/SKILL.md" \
    "$target/.pi/skills/teach/SKILL.md" \
    "$target/.omp/skills/teach/SKILL.md" \
    "$target/.cline/skills/teach/SKILL.md"; do
    if [[ -f "$candidate" ]]; then
      found=1
      grep -Fq "delayed-transfer stable" "$candidate"
      grep -Fq "working foundation" "$candidate"
      grep -Fq "Active-course startup" "$candidate"
      break
    fi
  done

  if [[ "$found" -ne 1 ]]; then
    echo "No installed teach skill found for $harness" >&2
    exit 1
  fi
  echo "PASS: $harness install and policy propagation"
done
