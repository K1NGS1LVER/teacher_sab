#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/course" "$tmp/lessons"
cat > "$tmp/course/01-intro.md" <<'EOF'
# Intro
First lesson.
EOF
cat > "$tmp/course/02-basics.md" <<'EOF'
# Basics
Second lesson.
EOF
cp "$tmp/course/"*.md "$tmp/lessons/"

node "$repo/bin/course-import.js" "$tmp/course" > "$tmp/old.json"
echo "Third lesson." > "$tmp/course/03-advanced.md"
rm "$tmp/course/02-basics.md"
node "$repo/bin/course-import.js" "$tmp/course" > "$tmp/new.json"

node "$repo/bin/course-refresh.js" "$tmp/old.json" "$tmp/new.json" > "$tmp/revision.json"
node --input-type=module - "$tmp/revision.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const revision = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.deepEqual(revision.unchanged, ['01-intro.md']);
assert.deepEqual(revision.changed, []);
assert.deepEqual(revision.added, ['03-advanced.md']);
assert.deepEqual(revision.removed, ['02-basics.md']);
assert.deepEqual(revision.summary, { unchanged: 1, changed: 0, added: 1, removed: 1 });
assert.equal(revision.locatorMatched, true);
console.log('PASS: refreshed import classifies real changes');
NODE
