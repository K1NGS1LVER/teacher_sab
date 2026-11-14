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
allow="--allow-private-host"

node "$repo/bin/course-web.js" "$start" $allow --retrieved-at 2026-11-14T00:00:00.000Z > "$tmp/snapshot.json"
node --input-type=module - "$tmp/snapshot.json" "$port" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const [file, port] = process.argv.slice(2);
const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.equal(snapshot.sourceKind, 'static-website');
assert.equal(snapshot.locator, `http://127.0.0.1:${port}/`);
assert.equal(snapshot.retrievedAt, '2026-11-14T00:00:00.000Z');
assert.deepEqual(snapshot.documents.map((document) => document.path), [
  '/',
  '/lessons/one.html',
  '/lessons/two.html',
]);
assert.ok(snapshot.documents.every((document) => /^[0-9a-f]{64}$/.test(document.sha256)));
assert.equal(snapshot.documents[0].title, 'Mock course home');
assert.equal(snapshot.documents[1].title, 'Lesson one');
assert.ok(!snapshot.documents.some((document) => document.content.includes('console.log')));
assert.ok(!snapshot.documents.some((document) => document.content.includes('color: red')));
assert.ok(snapshot.documents.some((document) => document.content.includes('First lesson content.')));
// robots: /secret.html and /admin/panel.html never fetched
assert.ok(snapshot.warnings.some((warning) => warning.includes('robots-disallowed')));
assert.ok(snapshot.documents.every((document) => !document.content.includes('disallowed')));
assert.equal(snapshot.license.status, 'unknown');
console.log('PASS: static website snapshot contract');
NODE

node "$repo/bin/course-web.js" "$start" $allow > "$tmp/repeat-a.json"
node "$repo/bin/course-web.js" "$start" $allow > "$tmp/repeat-b.json"
cmp "$tmp/repeat-a.json" "$tmp/repeat-b.json"
echo 'PASS: static website snapshot is deterministic'

node "$repo/bin/course-web.js" "$start" $allow --max-pages 2 > "$tmp/paged.json"
node --input-type=module - "$tmp/paged.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 2);
assert.ok(snapshot.warnings.some((warning) => warning.includes('page limit')));
console.log('PASS: page budget is enforced');
NODE

node "$repo/bin/course-web.js" "http://127.0.0.1:$port/big.html" $allow --max-file-bytes 1024 > "$tmp/big.json"
node --input-type=module - "$tmp/big.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 0);
assert.ok(snapshot.warnings.some((warning) => warning.includes('file-size limit')));
console.log('PASS: file-size budget is enforced');
NODE

node "$repo/bin/course-web.js" "$start" $allow --max-depth 0 > "$tmp/depth.json"
node --input-type=module - "$tmp/depth.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.deepEqual(snapshot.documents.map((document) => document.path), ['/']);
console.log('PASS: depth budget is enforced');
NODE

# redirects: same-origin followed and deduplicated
node "$repo/bin/course-web.js" "http://127.0.0.1:$port/old.html" $allow > "$tmp/redirect.json"
node --input-type=module - "$tmp/redirect.json" "$port" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const [file, port] = process.argv.slice(2);
const snapshot = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.deepEqual(snapshot.documents.map((document) => document.path), [`/lessons/one.html`]);
console.log('PASS: same-origin redirect is followed and deduplicated');
NODE

# cross-origin redirect refused
node "$repo/bin/course-web.js" "http://127.0.0.1:$port/hop.html" $allow > "$tmp/hop.json"
node --input-type=module - "$tmp/hop.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 0);
assert.ok(snapshot.warnings.some((warning) => warning.includes('cross-origin')));
console.log('PASS: cross-origin redirect is refused');
NODE

# content type filter
node "$repo/bin/course-web.js" "$start" $allow > "$tmp/types.json"
node --input-type=module - "$tmp/types.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.ok(!snapshot.documents.some((document) => document.path === '/binary.bin'));
console.log('PASS: non-HTML content type is skipped');
NODE

# SSRF defenses
for bad in "file:///etc/passwd" "ftp://example.com/x" "http://localhost/x" "http://127.0.0.1/x" "http://10.0.0.1/x" "http://192.168.1.1/x" "http://169.254.169.254/x" "http://[::1]/x"; do
  if node "$repo/bin/course-web.js" "$bad" > "$tmp/bad.json" 2>"$tmp/bad.err"; then
    echo "FAIL: private/non-http URL should be rejected: $bad" >&2
    exit 1
  fi
  grep -FqE 'private or loopback|usage: course-web' "$tmp/bad.err"
done
echo 'PASS: private and non-http targets are rejected'

node "$repo/bin/course-web.js" "http://127.0.0.1:$port/" --allow-private-host > "$tmp/allow.json"
node --input-type=module - "$tmp/allow.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 3);
console.log('PASS: --allow-private-host opts into loopback sources');
NODE
