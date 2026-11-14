#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/course"
printf '# Integration lesson\n' > "$tmp/course/lesson.md"

node "$repo/bin/course-import.js" "$tmp/course" > "$tmp/output.json"
node --input-type=module - "$tmp/output.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 1);
assert.equal(snapshot.documents[0].path, 'lesson.md');
console.log('PASS: course-import CLI emits valid JSON');
NODE

if node "$repo/bin/course-import.js" "$tmp/missing" > "$tmp/missing.json" 2>"$tmp/missing.err"; then
  echo 'FAIL: missing root should fail' >&2
  exit 1
fi
grep -Fq 'does not exist' "$tmp/missing.err"
echo 'PASS: missing root has actionable error'
