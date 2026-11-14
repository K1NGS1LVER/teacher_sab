#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { IGNORED_DIRECTORIES, isLicenseFile, isSecret, isSupportedFile, sha256, titleFor } from './course-source-lib.js';

const DEFAULTS = {
  maxFiles: 1000,
  maxFileBytes: 1024 * 1024,
  maxWarnings: 100,
  maxTotalBytes: 50 * 1024 * 1024,
};

const COMMIT_PATTERN = /^[0-9a-f]{40}$/;

function usageError(message) {
  const error = new Error(message);
  error.code = 'USAGE';
  return error;
}

function usage() {
  return 'usage: course-github <https://github.com/owner/repo[/tree/<ref>]> [--commit SHA] [--retrieved-at ISO] [--token TOKEN] [--cache-dir DIR] [--max-files N] [--max-file-bytes N] [--max-total-bytes N] [--max-warnings N] [--api-base URL] [--raw-base URL]';
}

function isStrictIsoTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, milliseconds = '000'] = match;
  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  date.setUTCHours(Number(hour), Number(minute), Number(second), Number(milliseconds));
  return date.getUTCFullYear() === Number(year)
    && date.getUTCMonth() === Number(month) - 1
    && date.getUTCDate() === Number(day)
    && date.getUTCHours() === Number(hour)
    && date.getUTCMinutes() === Number(minute)
    && date.getUTCSeconds() === Number(second)
    && date.getUTCMilliseconds() === Number(milliseconds);
}

function parseGithubUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw usageError(usage());
  }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || /\/\//.test(url.pathname)) {
    throw usageError(usage());
  }
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 2) throw usageError(usage());
  const [owner, repoRaw, third] = segments;
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repoRaw)) throw usageError(usage());
  const repo = repoRaw.replace(/\.git$/, '');
  if (segments.length === 2) return { owner, repo, ref: null };
  if (third !== 'tree') throw usageError(usage());
  const ref = segments.slice(3).join('/');
  if (!ref) throw usageError(usage());
  return { owner, repo, ref };
}

function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === '--help') throw usageError(usage());
  const parsed = parseGithubUrl(argv[0]);
  const options = {
    ...parsed,
    commit: null,
    token: null,
    cacheDir: null,
    retrievedAt: null,
    maxFiles: DEFAULTS.maxFiles,
    maxFileBytes: DEFAULTS.maxFileBytes,
    maxWarnings: DEFAULTS.maxWarnings,
    maxTotalBytes: DEFAULTS.maxTotalBytes,
    apiBase: 'https://api.github.com',
    rawBase: 'https://raw.githubusercontent.com',
  };

  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value) throw usageError(`missing value for ${flag}`);
    if (flag === '--commit') options.commit = value;
    else if (flag === '--token') options.token = value;
    else if (flag === '--cache-dir') options.cacheDir = path.resolve(value);
    else if (flag === '--retrieved-at') options.retrievedAt = value;
    else if (flag === '--max-files') options.maxFiles = parsePositiveInteger(value, flag);
    else if (flag === '--max-file-bytes') options.maxFileBytes = parsePositiveInteger(value, flag);
    else if (flag === '--max-total-bytes') options.maxTotalBytes = parsePositiveInteger(value, flag);
    else if (flag === '--max-warnings') options.maxWarnings = parsePositiveInteger(value, flag);
    else if (flag === '--api-base') options.apiBase = value.replace(/\/$/, '');
    else if (flag === '--raw-base') options.rawBase = value.replace(/\/$/, '');
    else throw usageError(`unknown option ${flag}`);
    index += 1;
  }

  if (options.commit !== null && !COMMIT_PATTERN.test(options.commit)) {
    throw usageError(`commit must be a 40-character sha: ${options.commit}`);
  }
  if (options.retrievedAt !== null && !isStrictIsoTimestamp(options.retrievedAt)) {
    throw usageError(`invalid ISO timestamp: ${options.retrievedAt}`);
  }
  return options;
}

function parsePositiveInteger(value, flag) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw usageError(`invalid positive integer for ${flag}: ${value}`);
  return number;
}

function comparePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isInIgnoredDirectory(relative) {
  return relative.split('/').slice(0, -1).some((segment) => IGNORED_DIRECTORIES.has(segment.toLowerCase()));
}

async function apiFetch(url, token) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'teacher-sab-course-import' };
  if (token) headers.authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(url, { headers });
  } catch (error) {
    throw new Error(`GitHub API unreachable: ${url} (${error.cause?.code ?? error.message})`);
  }
  if (response.ok) return response.json();
  if (response.status === 401) {
    throw new Error(`GitHub API rejected credentials; check --token (status 401): ${url}`);
  }
  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining === '0' || response.status === 429) {
      const reset = Number(response.headers.get('x-ratelimit-reset') ?? 0);
      const resetAt = reset ? new Date(reset * 1000).toISOString() : 'unknown';
      throw new Error(`GitHub API rate limit exhausted; resets at ${resetAt}; retry later or pass --token: ${url}`);
    }
    throw new Error(`GitHub API request forbidden (status 403): ${url}`);
  }
  if (response.status === 404) throw new Error(`not found on GitHub: ${url}`);
  throw new Error(`GitHub API error (status ${response.status}): ${url}`);
}

async function readRawFile(url) {
  let response;
  try {
    response = await fetch(url, { headers: { 'user-agent': 'teacher-sab-course-import' } });
  } catch (error) {
    return { error: error.cause?.code ?? error.message };
  }
  if (!response.ok) return { error: `HTTP ${response.status}` };
  return { content: await response.text() };
}

async function resolveCommit(options, meta) {
  if (options.commit) return options.commit;
  const ref = options.ref ?? meta.default_branch;
  const commit = await apiFetch(`${options.apiBase}/repos/${options.owner}/${options.repo}/commits/${encodeURIComponent(ref)}`, options.token);
  if (!COMMIT_PATTERN.test(commit.sha)) {
    throw new Error(`GitHub returned an unexpected commit sha: ${commit.sha}`);
  }
  return commit.sha;
}

function selectBlobs(treeEntries, warnings, options) {
  const blobs = treeEntries
    .filter((entry) => entry.type === 'blob')
    .sort((a, b) => comparePaths(a.path, b.path));
  const state = { truncated: false, totalBytes: 0, files: 0 };

  function warn(message) {
    if (warnings.length < options.maxWarnings && !state.truncated) {
      warnings.push(message);
      return;
    }
    if (!state.truncated) {
      const notice = `warning limit reached; traversal truncated at ${options.maxWarnings} warnings`;
      if (warnings.length === 0) warnings.push(notice);
      else warnings[warnings.length - 1] = notice;
    }
    state.truncated = true;
  }

  const selected = [];
  for (const blob of blobs) {
    const name = path.posix.basename(blob.path);
    if (isSecret(name)) {
      warn(`skipped secret-looking file: ${blob.path}`);
      continue;
    }
    if (isInIgnoredDirectory(blob.path)) {
      warn(`skipped ignored directory file: ${blob.path}`);
      continue;
    }
    if (!isSupportedFile(name)) {
      warn(`skipped unsupported file: ${blob.path}`);
      continue;
    }
    if (state.files >= options.maxFiles) {
      warn(`file limit reached; skipped: ${blob.path}`);
      continue;
    }
    if (blob.size > options.maxFileBytes) {
      warn(`file-size limit reached; skipped: ${blob.path}`);
      continue;
    }
    if (state.totalBytes + blob.size > options.maxTotalBytes) {
      warn(`total byte limit reached; traversal truncated at ${options.maxTotalBytes} bytes`);
      state.truncated = true;
      break;
    }
    selected.push(blob);
    state.files += 1;
    state.totalBytes += blob.size;
  }
  return { selected, state };
}

async function fetchDocuments(options, commitSha, warnings, tree) {
  const { selected, state } = selectBlobs(tree.tree, warnings, options);
  const documents = [];
  for (const blob of selected) {
    const raw = await readRawFile(`${options.rawBase}/${options.owner}/${options.repo}/${commitSha}/${blob.path}`);
    if (raw.error !== undefined) {
      warnings.push(`skipped unreachable file: ${blob.path} (${raw.error})`);
      continue;
    }
    if (raw.content.length > options.maxFileBytes) {
      warnings.push(`file-size limit reached; skipped: ${blob.path}`);
      continue;
    }
    documents.push({ path: blob.path, title: titleFor(blob.path, raw.content), content: raw.content, sha256: sha256(raw.content) });
  }
  documents.sort((a, b) => comparePaths(a.path, b.path));
  documents.forEach((document, order) => { document.order = order; });
  return documents;
}

function buildLicense(meta, documents) {
  const evidence = documents
    .filter((document) => isLicenseFile(path.posix.basename(document.path)))
    .map((document) => ({ path: document.path, sha256: document.sha256 }));
  const status = evidence.length === 0 ? 'unknown' : evidence.length === 1 ? 'detected' : 'mixed';
  return { status, evidence, spdxId: meta.license?.spdx_id ?? null };
}

function output(snapshot) {
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

function snapshotShape(options, commitSha, documents, warnings, license) {
  return {
    schemaVersion: 1,
    sourceKind: 'github-repository',
    locator: `https://github.com/${options.owner}/${options.repo}`,
    retrievedAt: options.retrievedAt,
    commit: { sha: commitSha, ref: options.ref },
    documents,
    warnings,
    license,
    limits: {
      files: options.maxFiles,
      fileBytes: options.maxFileBytes,
      warnings: options.maxWarnings,
      totalBytes: options.maxTotalBytes,
    },
  };
}

async function run(options) {
  const cachePath = options.cacheDir
    ? path.join(options.cacheDir, `github-${sha256(`${options.owner}/${options.repo}@${options.commit ?? options.ref ?? 'default'}`)}.json`)
    : null;
  if (cachePath && fs.existsSync(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    output(snapshotShape(options, cached.commitSha, cached.documents, cached.warnings, cached.license));
    return;
  }

  const meta = await apiFetch(`${options.apiBase}/repos/${options.owner}/${options.repo}`, options.token);
  const commitSha = await resolveCommit(options, meta);
  const tree = await apiFetch(`${options.apiBase}/repos/${options.owner}/${options.repo}/git/trees/${commitSha}?recursive=1`, options.token);

  const warnings = [];
  if (tree.truncated) warnings.push('GitHub tree listing was truncated; some files may be missing from this snapshot');
  const documents = await fetchDocuments(options, commitSha, warnings, tree);
  const license = buildLicense(meta, documents);
  const snapshot = snapshotShape(options, commitSha, documents, warnings, license);

  if (cachePath) {
    fs.mkdirSync(options.cacheDir, { recursive: true });
    fs.writeFileSync(cachePath, `${JSON.stringify({ commitSha, documents, warnings, license }, null, 2)}\n`);
  }
  output(snapshot);
}

try {
  const options = parseArgs(process.argv.slice(2));
  run(options).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = error.code === 'USAGE' ? 2 : 1;
  });
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error.code === 'USAGE' ? 2 : 1;
}
