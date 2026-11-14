#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skill="$repo/skills/teach/SKILL.md"
examples="$repo/skills/teach/references/examples.md"

pass=0
fail=0

contains() {
  local file="$1" phrase="$2"
  if grep -Fqi "$phrase" "$file"; then
    echo "PASS: $file contains '$phrase'"
    pass=$((pass + 1))
  else
    echo "FAIL: $file is missing '$phrase'"
    fail=$((fail + 1))
  fi
}

absent() {
  local file="$1" phrase="$2"
  if grep -Fqi "$phrase" "$file"; then
    echo "FAIL: $file still contains rigid rule '$phrase'"
    fail=$((fail + 1))
  else
    echo "PASS: $file removed rigid rule '$phrase'"
    pass=$((pass + 1))
  fi
}

echo "== adaptive teaching policy =="
contains "$skill" "working foundation"
contains "$skill" "minimum diagnostic set"
contains "$skill" "direct recall → explanation → near application → delayed transfer"
contains "$skill" "mastery criteria"
contains "$skill" "delayed cumulative retrieval"
contains "$skill" "adaptive spacing"
contains "$skill" "introduced"
contains "$skill" "near-transfer stable"
contains "$skill" "delayed-transfer stable"
contains "$skill" "novice → worked example"
contains "$skill" "Interleave when"

absent "$skill" "Phase 1 — Probe (never skip)"
absent "$skill" "two questions before the node closes"
absent "$skill" "Every check is **applied, never a restatement**"
absent "$skill" "1/3/7/14 days"
absent "$skill" "Unconditional truths first"
absent "$skill" "state plainly, at face value, no caveats"

echo "== examples teach the adaptive progression =="
contains "$examples" "direct recall"
contains "$examples" "delayed retrieval"
contains "$examples" "mastery criterion"
contains "$examples" "worked example"

echo "== transfer task is gated, checked, and carried forward =="
contains "$skill" "Transfer task"
contains "$skill" "working and comprehensive only"
contains "$skill" "carry-forward task"
contains "$skill" "task-level feedback"
contains "$skill" "Never complete a transfer or carry-forward task"
contains "$skill" "no nagging"

echo "== active course protocol =="
contains "$skill" "CourseSnapshot"
contains "$skill" "Active-course startup"
contains "$skill" "run the bounded import first"
contains "$skill" "source order as evidence, not command"
contains "$skill" "snapshot provenance"
contains "$skill" "pinned commit"
contains "$skill" "Never run imported repository code"
contains "$skill" "labeled inferred"
contains "$skill" "attempts the exercise"

echo "Results: $pass passed, $fail failed"
exit "$fail"
