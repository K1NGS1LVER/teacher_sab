#!/usr/bin/env node

import fs from 'node:fs';

function usageError(message) {
  const error = new Error(message);
  error.code = 'USAGE';
  return error;
}

const usage = 'usage: course-refresh <old-snapshot.json> <new-snapshot.json>';

function loadSnapshot(file) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw usageError(`cannot read snapshot file: ${file} (${error.code === 'ENOENT' ? 'not found' : error.message})`);
  }
  if (parsed === null || typeof parsed !== 'object' || parsed.schemaVersion !== 1
    || typeof parsed.locator !== 'string'
    || !Array.isArray(parsed.documents)) {
    throw usageError(`not a schemaVersion 1 CourseSnapshot: ${file}`);
  }
  return parsed;
}

const byPath = (snapshot) => new Map(snapshot.documents.map((document) => [document.path, document]));

try {
  const argv = process.argv.slice(2);
  if (argv.length !== 2 || argv.includes('--help')) throw usageError(usage);
  const [oldFile, newFile] = argv;
  const old = loadSnapshot(oldFile);
  const fresh = loadSnapshot(newFile);

  const oldDocs = byPath(old);
  const freshDocs = byPath(fresh);

  const unchanged = [];
  const changed = [];
  const added = [];
  const removed = [];

  for (const [path, document] of freshDocs) {
    const prior = oldDocs.get(path);
    if (prior === undefined) added.push(path);
    else if (prior.sha256 === document.sha256) unchanged.push(path);
    else changed.push({ path, oldSha256: prior.sha256, newSha256: document.sha256, status: 'stale' });
  }
  for (const path of oldDocs.keys()) {
    if (!freshDocs.has(path)) removed.push(path);
  }

  const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
  unchanged.sort(compare);
  changed.sort((left, right) => compare(left.path, right.path));
  added.sort(compare);
  removed.sort(compare);

  const locatorMatched = old.locator === fresh.locator;
  const warnings = [];
  if (!locatorMatched) warnings.push(`locator changed between snapshots: ${old.locator} -> ${fresh.locator}`);
  if (old.sourceKind !== fresh.sourceKind) warnings.push(`sourceKind changed: ${old.sourceKind} -> ${fresh.sourceKind}`);

  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    kind: 'course-revision',
    oldLocator: old.locator,
    newLocator: fresh.locator,
    locatorMatched,
    oldRetrievedAt: old.retrievedAt,
    newRetrievedAt: fresh.retrievedAt,
    unchanged,
    changed,
    added,
    removed,
    summary: { unchanged: unchanged.length, changed: changed.length, added: added.length, removed: removed.length },
    warnings,
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error.code === 'USAGE' ? 2 : 1;
}
