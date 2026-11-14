#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/course/lessons"
printf '# Welcome\n\nStart here.\n' > "$tmp/course/lessons/001-welcome.md"
printf '# Practice\n\nBuild the small example.\n' > "$tmp/course/lessons/002-practice.md"

node "$repo/bin/course-import.js" "$tmp/course" --max-files 2 > "$tmp/course-snapshot.json"

node --input-type=module - "$tmp/course-snapshot.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 2);
assert.equal(snapshot.documents[0].title, 'Welcome');
assert.equal(snapshot.documents[1].title, 'Practice');
assert.deepEqual(snapshot.documents.map((document) => document.order), [0, 1]);
console.log('PASS: end-to-end course snapshot workflow');
NODE

tarball="$(npm pack --silent --pack-destination "$tmp")"
mkdir -p "$tmp/installed"
npm install --silent --no-audit --no-fund --prefix "$tmp/installed" "$tmp/$tarball"
"$tmp/installed/node_modules/.bin/course-import" "$tmp/course" --retrieved-at 2026-11-14T00:00:00.000Z > "$tmp/installed-snapshot.json"
node --input-type=module - "$tmp/installed-snapshot.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 2);
console.log('PASS: installed course-import command');
NODE
