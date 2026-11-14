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

start="http://127.0.0.1:$port/"

node "$repo/bin/course-web.js" "$start" --allow-private-host --retrieved-at 2026-11-14T00:00:00.000Z > "$tmp/output.json"
node --input-type=module - "$tmp/output.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.sourceKind, 'static-website');
assert.equal(snapshot.documents.length, 3);
assert.equal(snapshot.documents[0].path, '/');
assert.equal(snapshot.retrievedAt, '2026-11-14T00:00:00.000Z');
assert.ok(snapshot.documents.every((document) => /^[0-9a-f]{64}$/.test(document.sha256)));
console.log('PASS: course-web CLI emits valid JSON');
NODE

node "$repo/bin/course-web.js" "http://127.0.0.1:$port/missing-page.html" --allow-private-host > "$tmp/missing.json"
node --input-type=module - "$tmp/missing.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 0);
assert.ok(snapshot.warnings.some((warning) => warning.includes('unreachable page')));
console.log('PASS: unreachable start page yields an empty warning snapshot');
NODE
