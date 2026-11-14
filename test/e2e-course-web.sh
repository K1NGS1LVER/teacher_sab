#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
node "$repo/test/fixtures/web-mock.js" > "$tmp/port" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT
port=""
for _ in $(seq 1 50); do
  port="$(cat "$tmp/port" 2>/dev/null || true)"
  [ -n "$port" ] && break
  sleep 0.1
done
[ -n "$port" ] || { echo 'FAIL: mock server did not start' >&2; exit 1; }

tarball="$(npm pack --silent --pack-destination "$tmp")"
mkdir -p "$tmp/installed"
npm install --silent --no-audit --no-fund --prefix "$tmp/installed" "$tmp/$tarball"
"$tmp/installed/node_modules/.bin/course-web" "http://127.0.0.1:$port/" \
  --allow-private-host --retrieved-at 2026-11-14T00:00:00.000Z > "$tmp/installed-snapshot.json"

node --input-type=module - "$tmp/installed-snapshot.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.sourceKind, 'static-website');
assert.equal(snapshot.documents.length, 3);
assert.equal(snapshot.retrievedAt, '2026-11-14T00:00:00.000Z');
assert.ok(snapshot.documents.some((document) => document.content.includes('First lesson content.')));
console.log('PASS: installed course-web command');
NODE
