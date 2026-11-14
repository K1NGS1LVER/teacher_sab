#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir -p "$tmp/course/02-basics" "$tmp/course/.git" "$tmp/course/.GIT" "$tmp/course/private-notes" "$tmp/course/.aws" "$tmp/course/.SSH" "$tmp/outside"
printf '# First lesson\n' > "$tmp/course/01-intro.md"
printf 'console.log("text")\n' > "$tmp/course/02-basics/example.txt"
printf '<h1>HTML lesson</h1>\n' > "$tmp/course/03-page.html"
printf 'MIT License\n' > "$tmp/course/LICENSE"
printf 'TOKEN=do-not-import\n' > "$tmp/course/.env"
printf 'password: do-not-import\n' > "$tmp/course/credentials.md"
printf 'api-key: do-not-import\n' > "$tmp/course/api-key.txt"
printf 'TOKEN=do-not-import\n' > "$tmp/course/.ENV.md"
printf 'PRIVATE KEY=do-not-import\n' > "$tmp/course/id_RSA.md"
printf 'do-not-import\n' > "$tmp/course/private-notes/lesson.md"
printf 'access_key_id = do-not-import\n' > "$tmp/course/.aws/lesson.md"
printf 'known_hosts = do-not-import\n' > "$tmp/course/.SSH/lesson.md"
printf 'generated\n' > "$tmp/course/.GIT/lesson.md"
printf 'Apache License\n' > "$tmp/course/02-basics/LICENSE-APACHE"
printf 'outside\n' > "$tmp/outside/escape.md"
ln -s "$tmp/outside/escape.md" "$tmp/course/04-escape.md"

node "$repo/bin/course-import.js" "$tmp/course" --retrieved-at 2026-11-14T00:00:00.000Z > "$tmp/snapshot.json"

node --input-type=module - "$tmp/snapshot.json" "$tmp/course" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';

const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.sourceKind, 'local-directory');
assert.equal(snapshot.locator, fs.realpathSync(process.argv[3]));
assert.equal(snapshot.retrievedAt, '2026-11-14T00:00:00.000Z');
assert.deepEqual(snapshot.documents.map((document) => document.path), [
  '01-intro.md',
  '02-basics/LICENSE-APACHE',
  '02-basics/example.txt',
  '03-page.html',
  'LICENSE',
]);
assert.ok(snapshot.documents.every((document) => /^[0-9a-f]{64}$/.test(document.sha256)));
assert.ok(snapshot.documents.every((document) => document.content.length > 0));
assert.ok(!snapshot.documents.some((document) => document.path === '.env'));
assert.ok(!snapshot.documents.some((document) => document.path === 'credentials.md'));
assert.ok(!snapshot.documents.some((document) => document.path === 'api-key.txt'));
assert.ok(!snapshot.documents.some((document) => document.path === '.ENV.md'));
assert.ok(!snapshot.documents.some((document) => document.path === 'id_RSA.md'));
assert.ok(!snapshot.documents.some((document) => document.path === 'private-notes/lesson.md'));
assert.ok(!snapshot.documents.some((document) => document.path === '.aws/lesson.md'));
assert.ok(!snapshot.documents.some((document) => document.path === '.SSH/lesson.md'));
assert.ok(!snapshot.documents.some((document) => document.path === '.GIT/lesson.md'));
assert.ok(!snapshot.documents.some((document) => document.path === '04-escape.md'));
assert.ok(snapshot.warnings.some((warning) => warning.includes('.env')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('credentials.md')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('.aws')));
assert.ok(snapshot.warnings.some((warning) => warning.includes('symlink')));
assert.equal(snapshot.license.status, 'mixed');
assert.equal(snapshot.license.evidence.length, 2);
assert.equal(snapshot.limits.files, 1000);
console.log('PASS: local directory snapshot contract');
NODE

mkdir -p "$tmp/large"
printf '1234567890' > "$tmp/large/too-large.md"
if node "$repo/bin/course-import.js" "$tmp/large" --max-file-bytes 5 > "$tmp/limited.json"; then
  node --input-type=module - "$tmp/limited.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 0);
assert.ok(snapshot.warnings.some((warning) => warning.includes('too-large.md')));
console.log('PASS: local file-size budget');
NODE
else
  echo 'FAIL: size-limited import should return a partial snapshot' >&2
  exit 1
fi

mkdir -p "$tmp/deep/one/two/three/four"
printf '# Deep\n' > "$tmp/deep/one/two/three/four/lesson.md"
node "$repo/bin/course-import.js" "$tmp/deep" --max-depth 2 > "$tmp/depth.json"
node --input-type=module - "$tmp/depth.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 0);
assert.ok(snapshot.warnings.some((warning) => warning.includes('depth limit')));
console.log('PASS: traversal depth budget');
NODE

node "$repo/bin/course-import.js" "$tmp/course" > "$tmp/repeat-a.json"
node "$repo/bin/course-import.js" "$tmp/course" > "$tmp/repeat-b.json"
cmp "$tmp/repeat-a.json" "$tmp/repeat-b.json"
node --input-type=module - "$tmp/repeat-a.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.retrievedAt, null);
console.log('PASS: canonical snapshot output is repeatable');
NODE

mkdir -p "$tmp/entries"
printf '# A\n' > "$tmp/entries/a.md"
printf '# B\n' > "$tmp/entries/b.md"
node "$repo/bin/course-import.js" "$tmp/entries" --max-entries 1 > "$tmp/entries.json"
node --input-type=module - "$tmp/entries.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 1);
assert.ok(snapshot.warnings.some((warning) => warning.includes('entry limit')));
console.log('PASS: traversal entry budget');
NODE

node "$repo/bin/course-import.js" "$tmp/course" --max-warnings 1 > "$tmp/warnings.json"
node --input-type=module - "$tmp/warnings.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.warnings.length, 1);
console.log('PASS: warning budget');
NODE

mkdir -p "$tmp/.aws"
printf 'access_key_id = do-not-import\n' > "$tmp/.aws/config.txt"
if node "$repo/bin/course-import.js" "$tmp/.aws" > "$tmp/sensitive-root.json" 2>"$tmp/sensitive-root.err"; then
  echo 'FAIL: sensitive root should be rejected' >&2
  exit 1
fi
grep -Fq 'sensitive course root' "$tmp/sensitive-root.err"
echo 'PASS: sensitive root is rejected'

ln -s "$tmp/.aws" "$tmp/course-link"
if node "$repo/bin/course-import.js" "$tmp/course-link" > "$tmp/symlink-root.json" 2>"$tmp/symlink-root.err"; then
  echo 'FAIL: symlink to sensitive root should be rejected' >&2
  exit 1
fi
grep -Fq 'sensitive course root' "$tmp/symlink-root.err"
echo 'PASS: symlinked sensitive root is rejected'

mkdir -p "$tmp/.aws/course"
printf 'access_key_id = do-not-import\n' > "$tmp/.aws/course/config.md"
if node "$repo/bin/course-import.js" "$tmp/.aws/course" > "$tmp/nested-sensitive-root.json" 2>"$tmp/nested-sensitive-root.err"; then
  echo 'FAIL: root below sensitive directory should be rejected' >&2
  exit 1
fi
grep -Fq 'sensitive course root' "$tmp/nested-sensitive-root.err"
echo 'PASS: root below sensitive directory is rejected'

if node "$repo/bin/course-import.js" "$tmp/course" --retrieved-at 11/14/2026 > "$tmp/bad-date.json" 2>"$tmp/bad-date.err"; then
  echo 'FAIL: non-ISO timestamp should be rejected' >&2
  exit 1
fi
grep -Fq 'invalid ISO timestamp' "$tmp/bad-date.err"
echo 'PASS: strict ISO timestamp validation'

if node "$repo/bin/course-import.js" "$tmp/course" --retrieved-at 2026-02-30T00:00:00Z > "$tmp/impossible-date.json" 2>"$tmp/impossible-date.err"; then
  echo 'FAIL: impossible calendar date should be rejected' >&2
  exit 1
fi
grep -Fq 'invalid ISO timestamp' "$tmp/impossible-date.err"
echo 'PASS: impossible ISO calendar date is rejected'

mkdir -p "$tmp/total-bytes"
printf '123456' > "$tmp/total-bytes/a.md"
printf 'abcdef' > "$tmp/total-bytes/b.md"
node "$repo/bin/course-import.js" "$tmp/total-bytes" --max-total-bytes 6 > "$tmp/total-bytes.json"
node --input-type=module - "$tmp/total-bytes.json" <<'NODE'
import assert from 'node:assert/strict';
import fs from 'node:fs';
const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
assert.equal(snapshot.documents.length, 1);
assert.ok(snapshot.warnings.some((warning) => warning.includes('total byte limit')));
console.log('PASS: aggregate byte budget');
NODE
