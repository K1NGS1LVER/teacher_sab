#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skill="$repo/skills/teach/SKILL.md"
examples="$repo/skills/teach/references/examples.md"
buildref="$repo/skills/teach/references/build-mode.md"
buildskill="$repo/skills/build/SKILL.md"
ladder="$repo/skills/build/references/ladder.md"

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

echo "== course revision protocol =="
contains "$skill" "Course revision protocol"
contains "$skill" "course-refresh"
contains "$skill" "Never delete existing study artifacts"
contains "$skill" "requiring re-check"
contains "$skill" "orphaned"
contains "$skill" "static-website"
contains "$skill" "Never run imported repository code"
contains "$skill" "labeled inferred"
contains "$skill" "attempts the exercise"

echo "== build mode contract =="
contains "$skill" "Build mode - the learner builds, you inspect"
contains "$skill" "### The ban"
contains "$skill" "pseudocode"
contains "$skill" "Only the learner can lift the ban"
contains "$skill" "The stage loop"
contains "$skill" "### The gate"
contains "$skill" "explain-back"
contains "$skill" "### Hint ladder"
contains "$skill" "There is no rung after that"
contains "$skill" "### Blocker buckets"
contains "$skill" "### Project guide"
contains "$skill" "continues at the next unticked stage"
contains "$skill" "deliberately breaks"
absent "$skill" "here is the code"
absent "$skill" "copy this into"
contains "$buildref" "Default ladder"
contains "$buildref" "Building a ladder for any other project"
contains "$buildref" "Journal template"
contains "$buildref" "Worked exchange"

echo "== skill router =="
contains "$skill" "Start here: route the session"
contains "$skill" "references/build-mode.md"
contains "$skill" "references/examples.md"
contains "$skill" "Missing reference"
contains "$buildref" "## Contents"
contains "$examples" "## Contents"

echo "== shared vocabulary and design contract =="
contains "$skill" "## Terms (use these consistently)"
contains "$skill" "**Harness:**"
contains "$skill" "**Sandbox:**"
contains "$skill" "**Deep module:**"
contains "$skill" "Design principles to enforce in every review"
contains "$skill" "Buy versus build"
contains "$skill" "trying to learn"
contains "$skill" "Cut list"
contains "$skill" "Expansion packs"
contains "$skill" "Attempt first"

echo "== ladder order and decision stages =="
contains "$buildref" "S0: loop that carries its own messages"
contains "$buildref" "S1: tools and the natural stop condition"
contains "$buildref" "S3: the sandbox (decision stage)"
contains "$buildref" "S11: evaluation, safety, and operations"
contains "$buildref" "Decision the learner must argue"
contains "$buildref" "Swap test"
contains "$buildref" "first end-to-end data flow"
contains "$buildref" "Core flow (numbered prose)"
absent "$buildref" "S9: evaluation, safety, and operations"

echo "== standalone build skill =="
contains "$buildskill" "name: build"
contains "$buildskill" "The ban"
contains "$buildskill" "Attempt first"
contains "$buildskill" "references/ladder.md"
contains "$ladder" "S0: loop that carries its own messages"
contains "$ladder" "S11: evaluation, safety, and operations"

echo "Results: $pass passed, $fail failed"
exit "$fail"
