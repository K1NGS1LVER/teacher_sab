#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/course"
cat > "$tmp/course/01-intro.md" <<'EOF'
# Intro
First lesson.
EOF

tarball="$(npm pack --silent --pack-destination "$tmp")"
mkdir -p "$tmp/installed"
npm install --silent --no-audit --no-fund --prefix "$tmp/installed" "$tmp/$tarball"

(cd "$tmp/course" && "$tmp/installed/node_modules/.bin/course-import" .) > "$tmp/first.json"
echo "Updated intro." >> "$tmp/course/01-intro.md"
(cd "$tmp/course" && "$tmp/installed/node_modules/.bin/course-import" .) > "$tmp/second.json"

"$tmp/installed/node_modules/.bin/course-refresh" "$tmp/first.json" "$tmp/second.json" > "$tmp/revision.json"

node --input-type=module - "$tmp/revision.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const revision = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(revision.kind, 'course-revision');
assert.equal(revision.changed.length, 1);
assert.equal(revision.changed[0].path, '01-intro.md');
assert.equal(revision.changed[0].status, 'stale');
console.log('PASS: installed course-refresh command');
NODE
