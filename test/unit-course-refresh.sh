#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

node --input-type=module - "$tmp" <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
const [tmp] = process.argv.slice(2);
const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
const document = (path, content, order) => ({ path, title: path, content, sha256: sha(content), order });
const snapshot = (locator, retrievedAt, documents) => ({
  schemaVersion: 1,
  sourceKind: 'local-directory',
  locator,
  retrievedAt,
  documents,
  warnings: [],
  repository: null,
  commit: null,
  license: { status: 'unknown', evidence: [], spdxId: null },
  limits: {},
});
fs.mkdirSync(`${tmp}/old`);
fs.mkdirSync(`${tmp}/new`);
fs.writeFileSync(`${tmp}/old/snapshot.json`, JSON.stringify(snapshot('course-old/', '2026-11-13T00:00:00.000Z', [
  document('/a.html', 'alpha', 0),
  document('/b.html', 'bravo', 1),
  document('/gone.html', 'golf', 2),
]), null, 2));
fs.writeFileSync(`${tmp}/new/snapshot.json`, JSON.stringify(snapshot('course-old/', '2026-11-14T00:00:00.000Z', [
  document('/a.html', 'alpha', 0),
  document('/b.html', 'bravo v2', 1),
  document('/fresh.html', 'foxtrot', 2),
]), null, 2));
fs.writeFileSync(`${tmp}/other.json`, JSON.stringify(snapshot('other/', '2026-11-14T00:00:00.000Z', [
  document('/a.html', 'alpha', 0),
]), null, 2));
NODE

node "$repo/bin/course-refresh.js" "$tmp/old/snapshot.json" "$tmp/new/snapshot.json" > "$tmp/revision.json"
node --input-type=module - "$tmp/revision.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const revision = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(revision.schemaVersion, 1);
assert.deepEqual(revision.unchanged, ['/a.html']);
assert.equal(revision.changed.length, 1);
assert.equal(revision.changed[0].path, '/b.html');
assert.equal(revision.changed[0].status, 'stale');
assert.notEqual(revision.changed[0].oldSha256, revision.changed[0].newSha256);
assert.deepEqual(revision.added, ['/fresh.html']);
assert.deepEqual(revision.removed, ['/gone.html']);
assert.equal(revision.oldRetrievedAt, '2026-11-13T00:00:00.000Z');
assert.equal(revision.newRetrievedAt, '2026-11-14T00:00:00.000Z');
assert.deepEqual(revision.summary, { unchanged: 1, changed: 1, added: 1, removed: 1 });
console.log('PASS: revision manifest classifies all four document states');
NODE

node "$repo/bin/course-refresh.js" "$tmp/new/snapshot.json" "$tmp/new/snapshot.json" > "$tmp/same.json"
node --input-type=module - "$tmp/same.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const revision = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.deepEqual(revision.unchanged, ['/a.html', '/b.html', '/fresh.html']);
assert.equal(revision.changed.length, 0);
assert.equal(revision.added.length, 0);
assert.equal(revision.removed.length, 0);
console.log('PASS: identical snapshots produce an empty diff');
NODE

node "$repo/bin/course-refresh.js" "$tmp/old/snapshot.json" "$tmp/other.json" > "$tmp/locator.json"
node --input-type=module - "$tmp/locator.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const revision = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(revision.locatorMatched, false);
assert.ok(revision.warnings.some((warning) => warning.includes('locator changed')));
console.log('PASS: locator change is surfaced, not silently compared');
NODE

if node "$repo/bin/course-refresh.js" "$tmp/new/snapshot.json" "$tmp/missing.json" > /dev/null 2>"$tmp/err"; then
  echo 'FAIL: missing snapshot file should be rejected' >&2
  exit 1
fi
grep -Fq 'cannot read' "$tmp/err"
echo 'PASS: invalid snapshot input is rejected'
