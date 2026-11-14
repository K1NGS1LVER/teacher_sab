#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { IGNORED_DIRECTORIES, isLicenseFile, isSecret, isSupportedFile, sha256, titleFor } from './course-source-lib.js';

const DEFAULTS = {
  maxFiles: 1000,
  maxFileBytes: 1024 * 1024,
  maxDepth: 32,
  maxEntries: 10000,
  maxWarnings: 100,
  maxTotalBytes: 50 * 1024 * 1024,
};

const SENSITIVE_DIRECTORIES = new Set(['.aws', '.gnupg', '.kube', '.ssh']);

function usageError(message) {
  const error = new Error(message);
  error.code = 'USAGE';
  return error;
}
function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === '--help') {
    throw usageError('usage: course-import <directory> [--retrieved-at ISO] [--max-files N] [--max-file-bytes N] [--max-depth N] [--max-entries N] [--max-warnings N] [--max-total-bytes N]');
  }

  const options = {
    root: path.resolve(argv[0]),
    retrievedAt: null,
    maxFiles: DEFAULTS.maxFiles,
    maxFileBytes: DEFAULTS.maxFileBytes,
    maxDepth: DEFAULTS.maxDepth,
    maxEntries: DEFAULTS.maxEntries,
    maxWarnings: DEFAULTS.maxWarnings,
    maxTotalBytes: DEFAULTS.maxTotalBytes,
  };

  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value) throw usageError(`missing value for ${flag}`);
    if (flag === '--retrieved-at') options.retrievedAt = value;
    else if (flag === '--max-files') options.maxFiles = parsePositiveInteger(value, flag);
    else if (flag === '--max-file-bytes') options.maxFileBytes = parsePositiveInteger(value, flag);
    else if (flag === '--max-depth') options.maxDepth = parsePositiveInteger(value, flag);
    else if (flag === '--max-entries') options.maxEntries = parsePositiveInteger(value, flag);
    else if (flag === '--max-warnings') options.maxWarnings = parsePositiveInteger(value, flag);
    else if (flag === '--max-total-bytes') options.maxTotalBytes = parsePositiveInteger(value, flag);
    else throw usageError(`unknown option ${flag}`);
    index += 1;
  }

  if (options.retrievedAt !== null && !isStrictIsoTimestamp(options.retrievedAt)) {
    throw usageError(`invalid ISO timestamp: ${options.retrievedAt}`);
  }
  return options;
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

function parsePositiveInteger(value, flag) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw usageError(`invalid positive integer for ${flag}: ${value}`);
  return number;
}

function relativePath(root, candidate) {
  return path.relative(root, candidate).split(path.sep).join('/');
}

function compareNames(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function readDocuments(root, options) {
  const warnings = [];
  const files = [];
  const state = { entries: 0, truncated: false, totalBytes: 0 };

  function warn(message) {
    if (warnings.length < options.maxWarnings && !state.truncated) {
      warnings.push(message);
      return;
    }
    if (!state.truncated) {
      const warning = `warning limit reached; traversal truncated at ${options.maxWarnings} warnings`;
      if (warnings.length === 0) warnings.push(warning);
      else warnings[warnings.length - 1] = warning;
    }
    state.truncated = true;
  }

  function visit(directory, depth) {
    if (state.truncated) return;
    if (depth > options.maxDepth) {
      warn(`depth limit reached; skipped directory: ${relativePath(root, directory)}`);
      return;
    }
    if (state.entries >= options.maxEntries) {
      warn(`entry limit reached; traversal truncated at ${options.maxEntries} entries`);
      return;
    }
    const entries = [];
    let overflow = false;
    let directoryHandle;
    try {
      directoryHandle = fs.opendirSync(directory);
      while (true) {
        const entry = directoryHandle.readSync();
        if (entry === null) break;
        if (entries.length >= options.maxEntries - state.entries) {
          overflow = true;
          break;
        }
        entries.push(entry);
      }
    } catch (error) {
      warn(`skipped unreadable directory: ${relativePath(root, directory)} (${error.code ?? 'read error'})`);
    } finally {
      directoryHandle?.closeSync();
    }
    entries.sort((a, b) => compareNames(a.name, b.name));
    for (const entry of entries) {
      if (state.truncated) return;
      if (state.entries >= options.maxEntries) {
        warn(`entry limit reached; traversal truncated at ${options.maxEntries} entries`);
        return;
      }
      state.entries += 1;
      const candidate = path.join(directory, entry.name);
      const relative = relativePath(root, candidate);
      if (entry.isSymbolicLink()) {
        warn(`skipped symlink: ${relative}`);
        continue;
      }
      if (entry.isDirectory()) {
        if (SENSITIVE_DIRECTORIES.has(entry.name.toLowerCase())) {
          warn(`skipped sensitive directory: ${relative}`);
          continue;
        }
        if (isSecret(entry.name)) {
          warn(`skipped secret-looking directory: ${relative}`);
          continue;
        }
        if (IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) {
          warn(`skipped ignored directory: ${relative}`);
          continue;
        }
        visit(candidate, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;
      if (isSecret(entry.name)) {
        warn(`skipped secret-looking file: ${relative}`);
        continue;
      }
      if (!isSupportedFile(entry.name)) {
        warn(`skipped unsupported file: ${relative}`);
        continue;
      }
      if (files.length >= options.maxFiles) {
        warn(`file limit reached; skipped: ${relative}`);
        continue;
      }
      let descriptor;
      try {
        const flags = fs.constants.O_RDONLY
          | (fs.constants.O_NOFOLLOW ?? 0)
          | (fs.constants.O_NONBLOCK ?? 0);
        descriptor = fs.openSync(candidate, flags);
        const stat = fs.fstatSync(descriptor);
        if (!stat.isFile()) {
          warn(`skipped non-regular file: ${relative}`);
          continue;
        }
        const size = stat.size;
        if (size > options.maxFileBytes) {
          warn(`file-size limit reached; skipped: ${relative}`);
          continue;
        }
        if (state.totalBytes + size > options.maxTotalBytes) {
          warn(`total byte limit reached; traversal truncated at ${options.maxTotalBytes} bytes`);
          state.truncated = true;
          continue;
        }
        const buffer = Buffer.alloc(size);
        let offset = 0;
        while (offset < buffer.length) {
          const bytesRead = fs.readSync(descriptor, buffer, offset, buffer.length - offset, offset);
          if (bytesRead === 0) break;
          offset += bytesRead;
        }
        state.totalBytes += offset;
        files.push({ relative, content: buffer.subarray(0, offset).toString('utf8') });
      } catch (error) {
        warn(`skipped unreadable file: ${relative} (${error.code ?? 'read error'})`);
      } finally {
        if (descriptor !== undefined) fs.closeSync(descriptor);
      }
    }
    if (overflow && !state.truncated) warn(`entry limit reached; traversal truncated at ${options.maxEntries} entries`);
  }

  visit(root, 0);
  return { files, warnings };
}

function detectLicense(root, files) {
  const licenseFiles = files.filter(({ relative }) => isLicenseFile(path.basename(relative)));
  if (licenseFiles.length === 0) return { status: 'unknown', evidence: [] };
  return {
    status: licenseFiles.length === 1 ? 'detected' : 'mixed',
    evidence: licenseFiles.map((licenseFile) => ({ path: licenseFile.relative, sha256: sha256(licenseFile.content) })),
  };
}

function redactRemoteUrl(url) {
  return url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/@]+@/i, (match) => match.replace(/[^/@]+@/, ''));
}

function readGitMetadata(root) {
  const gitDir = path.join(root, '.git');
  let gitStats;
  try {
    gitStats = fs.statSync(gitDir);
  } catch {
    return null;
  }
  if (!gitStats.isDirectory()) return null;

  let head = null;
  let headRef = null;
  try {
    const headContent = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    const refMatch = /^ref:\s*(\S+)$/.exec(headContent);
    if (refMatch) {
      headRef = refMatch[1];
      try {
        const loose = fs.readFileSync(path.join(gitDir, headRef), 'utf8').trim();
        if (/^[0-9a-f]{40}$/.test(loose)) head = loose;
      } catch {
        // loose ref missing; fall through to packed refs
      }
      if (head === null) {
        try {
          const packed = fs.readFileSync(path.join(gitDir, 'packed-refs'), 'utf8');
          for (const line of packed.split('\n')) {
            const match = /^([0-9a-f]{40})\s+(\S+)$/.exec(line.trim());
            if (match && match[2] === headRef) {
              head = match[1];
              break;
            }
          }
        } catch {
          // packed-refs missing
        }
      }
    } else if (/^[0-9a-f]{40}$/.test(headContent)) {
      head = headContent;
    }
  } catch {
    // HEAD unreadable; leave head unresolved
  }

  const remotes = {};
  try {
    const config = fs.readFileSync(path.join(gitDir, 'config'), 'utf8');
    let current = null;
    for (const rawLine of config.split('\n')) {
      const line = rawLine.trim();
      if (/^\[/.test(line)) {
        const remoteMatch = /^\[remote\s+"([^"]+)"\]$/.exec(line);
        current = remoteMatch ? remoteMatch[1] : null;
        continue;
      }
      if (current === null) continue;
      const urlMatch = /^url\s*=\s*(.+)$/.exec(line);
      if (urlMatch) remotes[current] = { url: redactRemoteUrl(urlMatch[1].trim()) };
    }
  } catch {
    // config unreadable; leave remotes empty
  }

  return { head, headRef, remotes };
}

function buildSnapshot(options) {
  let rootStats;
  try {
    options.root = fs.realpathSync(options.root);
    rootStats = fs.statSync(options.root);
  } catch {
    throw new Error(`course root does not exist: ${options.root}`);
  }
  if (!rootStats.isDirectory()) throw new Error(`course root is not a directory: ${options.root}`);
  const rootComponents = options.root.split(path.sep).filter(Boolean);
  if (rootComponents.some((component) => SENSITIVE_DIRECTORIES.has(component.toLowerCase()))) {
    throw new Error(`sensitive course root is not allowed: ${options.root}`);
  }

  const { files, warnings } = readDocuments(options.root, options);
  files.sort((a, b) => compareNames(a.relative, b.relative));
  const documents = files.map(({ relative, content }, order) => ({
    path: relative,
    title: titleFor(relative, content),
    content,
    sha256: sha256(content),
    order,
  }));
  const repository = readGitMetadata(options.root);

  return {
    schemaVersion: 1,
    sourceKind: 'local-directory',
    locator: fs.realpathSync(options.root),
    retrievedAt: options.retrievedAt,
    repository,
    documents,
    warnings,
    license: detectLicense(options.root, files),
    limits: {
      files: options.maxFiles,
      fileBytes: options.maxFileBytes,
      depth: options.maxDepth,
      entries: options.maxEntries,
      warnings: options.maxWarnings,
      totalBytes: options.maxTotalBytes,
    },
  };
}

try {
  const options = parseArgs(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(buildSnapshot(options), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error.code === 'USAGE' ? 2 : 1;
}
