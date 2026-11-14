#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
node "$repo/test/fixtures/github-mock.js" > "$tmp/port" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT
port=""
for _ in $(seq 1 50); do
  port="$(cat "$tmp/port" 2>/dev/null || true)"
  [ -n "$port" ] && break
  sleep 0.1
done
[ -n "$port" ] || { echo 'FAIL: mock server did not start' >&2; exit 1; }

base="http://127.0.0.1:$port"
api="--api-base $base --raw-base $base --commit 1111222233334444555566667777888899990000"

node "$repo/bin/course-github.js" "https://github.com/course/course" $api > "$tmp/output.json"
node --input-type=module - "$tmp/output.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 4);
assert.equal(snapshot.commit.sha, '1111222233334444555566667777888899990000');
assert.ok(snapshot.documents.every((document) => /^[0-9a-f]{64}$/.test(document.sha256)));
console.log('PASS: course-github CLI emits valid JSON');
NODE

node "$repo/test/fixtures/github-mock.js" > "$tmp/port-cache" 2>&1 &
cache_pid=$!
trap 'kill "$server_pid" "$cache_pid" 2>/dev/null || true; rm -rf "$tmp"' EXIT
cache_port=""
for _ in $(seq 1 50); do
  cache_port="$(cat "$tmp/port-cache" 2>/dev/null || true)"
  [ -n "$cache_port" ] && break
  sleep 0.1
done
[ -n "$cache_port" ] || { echo 'FAIL: cache mock server did not start' >&2; exit 1; }

cache_api="--api-base http://127.0.0.1:$cache_port --raw-base http://127.0.0.1:$cache_port --commit 1111222233334444555566667777888899990000"
node "$repo/bin/course-github.js" "https://github.com/course/course" $cache_api --cache-dir "$tmp/cache" > "$tmp/cache-run1.json"
curl -s "http://127.0.0.1:$cache_port/__requests" > "$tmp/requests1.json"
node "$repo/bin/course-github.js" "https://github.com/course/course" $cache_api --cache-dir "$tmp/cache" > "$tmp/cache-run2.json"
curl -s "http://127.0.0.1:$cache_port/__requests" > "$tmp/requests2.json"
node --input-type=module - "$tmp/requests1.json" "$tmp/requests2.json" "$tmp/cache-run1.json" "$tmp/cache-run2.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const first = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).count;
const second = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')).count;
assert.ok(first > 0, 'first run should hit the network');
assert.equal(second, first, 'cached run should perform zero requests');
const run1 = fs.readFileSync(process.argv[4], 'utf8');
const run2 = fs.readFileSync(process.argv[5], 'utf8');
assert.equal(run1, run2, 'cached output should be byte-identical');
console.log('PASS: cached snapshot avoids network and stays deterministic');
NODE
