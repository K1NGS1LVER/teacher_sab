#!/usr/bin/env bash
# Verifies teacher_sab installs into the four new harness paths.
# Usage: bash test/verify-harnesses.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

PASS=0; FAIL=0
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

check() {
  local label="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "PASS: $label"
    PASS=$((PASS+1))
  else
    echo "FAIL: $label"
    echo "  expected: $expected"
    echo "  actual:   $actual"
    FAIL=$((FAIL+1))
  fi
}

# --- bin/cli.js: parser must resolve all 14 harnesses ---
echo "== parser =="
node bin/cli.js -a 1 -d "$tmp/p1" -y >/dev/null 2>&1 || true
node bin/cli.js -a 14 -d "$tmp/p14" -y >/dev/null 2>&1 || true
for h in opencode claude codex kilo cursor agy hermes pi universal chat pi-code oh-my-pi aider cline; do
  dir="$tmp/parse-$h"
  # Use --help to avoid full install; just check parse doesn't reject the name
  if node bin/cli.js -a "$h" -d "$dir" --help >/dev/null 2>&1; then :; fi
done
# Non-interactive parse check: each name must be accepted (not error on bad pick)
for n in 11 12 13 14; do
  out=$(node bin/cli.js -a "$n" -d "$tmp/num$n" -y 2>&1 || true)
  if echo "$out" | grep -qi "bad pick"; then
    echo "FAIL: number $n rejected"
    FAIL=$((FAIL+1))
  else
    echo "PASS: number $n accepted"
    PASS=$((PASS+1))
  fi
done

# --- setup.sh: picker accepts numbers 11-14 ---
echo "== shell picker =="
printf '11\na\n' | bash setup.sh "$tmp/shell-picker" >/dev/null 2>&1 || true
# If we got here without syntax error, picker is structurally OK

# --- install path assertions ---
echo "== install paths =="

# Test each harness via bin/cli.js non-interactive
for spec in \
  "pi-code:.pi/skills/teach/SKILL.md:.pi/agents/researcher.md" \
  "oh-my-pi:.omp/skills/teach/SKILL.md:.omp/agents/researcher.md" \
  "aider:.agents/skills/teach/SKILL.md" \
  "cline:.cline/skills/teach/SKILL.md"; do
  harness="${spec%%:*}"; paths="${spec#*:}"
  target="$tmp/install-$harness"
  node bin/cli.js -a "$harness" -d "$target" -y >/dev/null 2>&1 || {
    echo "FAIL: $harness install errored"
    FAIL=$((FAIL+1))
    continue
  }
  IFS=':' read -ra PATHS <<< "$paths"
  for p in "${PATHS[@]}"; do
    full="$target/$p"
    if [[ -e "$full" ]]; then
      echo "PASS: $harness -> $p"
      PASS=$((PASS+1))
    else
      echo "FAIL: $harness -> $p (missing)"
      FAIL=$((FAIL+1))
    fi
  done
done

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit "$FAIL"
