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
api="--api-base $base --raw-base $base"
url="https://github.com/course/course"

node "$repo/bin/course-github.js" "$url" $api --retrieved-at 2026-11-14T00:00:00.000Z > "$tmp/snapshot.json"
node --input-type=module - "$tmp/snapshot.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.sourceKind, 'github-repository');
assert.equal(snapshot.locator, 'https://github.com/course/course');
assert.equal(snapshot.retrievedAt, '2026-11-14T00:00:00.000Z');
assert.equal(snapshot.commit.sha, 'c1a2b3d4e5f60718293a4b5c6d7e8f9011223344');
assert.equal(snapshot.commit.ref, null);
assert.deepEqual(snapshot.documents.map((document) => document.path), [
  '01-intro.md',
  'LICENSE',
  'README.md',
  'docs/lesson.md',
]);
assert.deepEqual(snapshot.documents.map((document) => document.order), [0, 1, 2, 3]);
assert.equal(snapshot.documents[0].title, 'First lesson');
assert.equal(snapshot.documents[1].title, 'LICENSE');
assert.equal(snapshot.documents[2].title, 'Mock course');
assert.ok(snapshot.documents.every((document) => /^[0-9a-f]{64}$/.test(document.sha256)));
for (const secretPath of ['.env', 'credentials.md', 'node_modules/pkg/x.md', 'logo.png', 'big.md']) {
  assert.ok(!snapshot.documents.some((document) => document.path === secretPath), secretPath);
}
assert.ok(snapshot.warnings.some((warning) => warning.includes('.env')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('credentials.md')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('node_modules')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('logo.png')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('big.md')));
assert.equal(snapshot.license.status, 'detected');
assert.equal(snapshot.license.spdxId, 'MIT');
assert.deepEqual(snapshot.license.evidence.map((evidence) => evidence.path), ['LICENSE']);
assert.equal(snapshot.limits.files, 1000);
console.log('PASS: github repository snapshot contract');
NODE

node "$repo/bin/course-github.js" "$url/tree/dev" $api > "$tmp/ref.json"
node --input-type=module - "$tmp/ref.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.commit.sha, 'd4a4d4a4d4a4d4a4d4a4d4a4d4a4d4a4d4a4d4a4');
assert.equal(snapshot.commit.ref, 'dev');
console.log('PASS: URL ref pins the commit');
NODE

node "$repo/bin/course-github.js" "$url" $api --commit 1111222233334444555566667777888899990000 > "$tmp/pinned.json"
node --input-type=module - "$tmp/pinned.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.commit.sha, '1111222233334444555566667777888899990000');
assert.equal(snapshot.commit.ref, null);
console.log('PASS: explicit commit pinning is honored');
NODE

if node "$repo/bin/course-github.js" "https://github.com/course/ratelimit" $api > "$tmp/ratelimit.json" 2>"$tmp/ratelimit.err"; then
  echo 'FAIL: rate-limited repo should fail' >&2
  exit 1
fi
grep -Fq 'rate limit' "$tmp/ratelimit.err"
grep -Fq -- '--token' "$tmp/ratelimit.err"
echo 'PASS: rate limit produces actionable error'

if node "$repo/bin/course-github.js" "https://github.com/course/notfound" $api > "$tmp/notfound.json" 2>"$tmp/notfound.err"; then
  echo 'FAIL: missing repo should fail' >&2
  exit 1
fi
grep -Fq 'not found' "$tmp/notfound.err"
echo 'PASS: missing repo produces actionable error'

if node "$repo/bin/course-github.js" "https://github.com/course/auth" $api > "$tmp/auth.json" 2>"$tmp/auth.err"; then
  echo 'FAIL: private-mock repo without token should fail' >&2
  exit 1
fi
grep -Fq 'credentials' "$tmp/auth.err"

node "$repo/bin/course-github.js" "https://github.com/course/auth" $api --token test-token > "$tmp/auth-ok.json"
node --input-type=module - "$tmp/auth-ok.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.commit.sha, 'c1a2b3d4e5f60718293a4b5c6d7e8f9011223344');
console.log('PASS: token is sent as bearer auth');
NODE

node "$repo/bin/course-github.js" "https://github.com/course/truncated" $api > "$tmp/truncated.json"
node --input-type=module - "$tmp/truncated.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.ok(snapshot.warnings.some((warning) => warning.includes('tree listing was truncated')));
console.log('PASS: truncated tree produces a warning');
NODE

node "$repo/bin/course-github.js" "$url" $api --max-files 2 > "$tmp/max-files.json"
node --input-type=module - "$tmp/max-files.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 2);
assert.ok(snapshot.warnings.some((warning) => warning.includes('file limit')));
console.log('PASS: github file budget is enforced');
NODE

node "$repo/bin/course-github.js" "$url" $api --max-total-bytes 20 > "$tmp/total.json"
node --input-type=module - "$tmp/total.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 1);
assert.ok(snapshot.warnings.some((warning) => warning.includes('total byte limit')));
console.log('PASS: github aggregate byte budget is enforced');
NODE

for bad in "https://gitlab.com/a/b" "http://github.com/a/b" "https://github.com/a" "https://github.com/a/b/extra" "https://github.com/a/b//x"; do
  if node "$repo/bin/course-github.js" "$bad" > "$tmp/bad.json" 2>"$tmp/bad.err"; then
    echo "FAIL: non-canonical URL should be rejected: $bad" >&2
    exit 1
  fi
  grep -Fq 'usage:' "$tmp/bad.err"
done
if node "$repo/bin/course-github.js" "$url" $api --commit zzz > "$tmp/bad-commit.json" 2>"$tmp/bad-commit.err"; then
  echo 'FAIL: short commit sha should be rejected' >&2
  exit 1
fi
grep -Fq '40-character sha' "$tmp/bad-commit.err"
echo 'PASS: canonical URL and commit validation'
