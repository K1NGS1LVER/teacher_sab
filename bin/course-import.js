#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULTS = {
  maxFiles: 1000,
  maxFileBytes: 1024 * 1024,
  maxDepth: 32,
  maxEntries: 10000,
  maxWarnings: 100,
  maxTotalBytes: 50 * 1024 * 1024,
};

const TEXT_EXTENSIONS = new Set(['.html', '.htm', '.md', '.markdown', '.txt']);
const IGNORED_DIRECTORIES = new Set(['.git', '.hg', '.svn', 'node_modules']);
const SENSITIVE_DIRECTORIES = new Set(['.aws', '.gnupg', '.kube', '.ssh']);
const SECRET_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'id_rsa',
  'id_ed25519',
]);
const SECRET_PATTERNS = [
  /^(?:credentials?|secrets?|private|passwords?|tokens?|auth|api[-_.]?keys?)(?:[._-].*)?$/i,
];

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

function titleFor(relative, content) {
  const heading = content.match(/^\s*#\s+(.+?)\s*$/m);
  if (heading) return heading[1].replace(/\s+#*\s*$/, '').trim();
  return path.basename(relative, path.extname(relative));
}

function isSecret(name) {
  const normalized = name.toLowerCase();
  return SECRET_NAMES.has(normalized)
    || normalized.startsWith('.env.')
    || /^id_(?:rsa|ed25519|ecdsa)(?:[._-].*)?$/i.test(normalized)
    || SECRET_PATTERNS.some((pattern) => pattern.test(normalized));
}

function isSupportedFile(name) {
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase()) || isLicenseFile(name);
}

function isLicenseFile(name) {
  return /^(?:license|copying)(?:[._-].*)?$/i.test(name);
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

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
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

  return {
    schemaVersion: 1,
    sourceKind: 'local-directory',
    locator: fs.realpathSync(options.root),
    retrievedAt: options.retrievedAt,
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
