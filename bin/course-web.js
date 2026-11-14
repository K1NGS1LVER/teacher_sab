#!/usr/bin/env node

import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from './course-source-lib.js';

const DEFAULTS = {
  maxPages: 50,
  maxFileBytes: 1024 * 1024,
  maxWarnings: 100,
  maxTotalBytes: 50 * 1024 * 1024,
  maxDepth: 3,
  maxRedirectHops: 5,
  timeoutMs: 15000,
};

const PRIVATE_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

function usageError(message) {
  const error = new Error(message);
  error.code = 'USAGE';
  return error;
}

function usage() {
  return 'usage: course-web <http(s) URL> [--allow-private-host] [--retrieved-at ISO] [--max-pages N] [--max-depth N] [--max-file-bytes N] [--max-total-bytes N] [--max-warnings N] [--timeout-ms N]';
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

function parseNonNegativeInteger(value, flag) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw usageError(`invalid non-negative integer for ${flag}: ${value}`);
  return number;
}

function parseArgs(argv) {
  if (argv.length === 0 || argv[0] === '--help') throw usageError(usage());
  const options = {
    start: argv[0],
    allowPrivateHost: false,
    retrievedAt: null,
    maxPages: DEFAULTS.maxPages,
    maxDepth: DEFAULTS.maxDepth,
    maxFileBytes: DEFAULTS.maxFileBytes,
    maxWarnings: DEFAULTS.maxWarnings,
    maxTotalBytes: DEFAULTS.maxTotalBytes,
    maxRedirectHops: DEFAULTS.maxRedirectHops,
    timeoutMs: DEFAULTS.timeoutMs,
  };

  for (let index = 1; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--allow-private-host') {
      options.allowPrivateHost = true;
      index -= 1;
    } else if (value === undefined) {
      throw usageError(`missing value for ${flag}`);
    } else if (flag === '--retrieved-at') options.retrievedAt = value;
    else if (flag === '--max-pages') options.maxPages = parsePositiveInteger(value, flag);
    else if (flag === '--max-depth') options.maxDepth = parseNonNegativeInteger(value, flag);
    else if (flag === '--max-file-bytes') options.maxFileBytes = parsePositiveInteger(value, flag);
    else if (flag === '--max-total-bytes') options.maxTotalBytes = parsePositiveInteger(value, flag);
    else if (flag === '--max-warnings') options.maxWarnings = parsePositiveInteger(value, flag);
    else if (flag === '--timeout-ms') options.timeoutMs = parsePositiveInteger(value, flag);
    else throw usageError(`unknown option ${flag}`);
    index += 1;
  }

  if (options.retrievedAt !== null && !isStrictIsoTimestamp(options.retrievedAt)) {
    throw usageError(`invalid ISO timestamp: ${options.retrievedAt}`);
  }

  let start;
  try {
    start = new URL(options.start);
  } catch {
    throw usageError(usage());
  }
  if (start.protocol !== 'http:' && start.protocol !== 'https:') throw usageError(usage());
  start.hash = '';
  options.startUrl = start;
  return options;
}

async function assertPublicHost(hostname) {
  if (PRIVATE_HOSTNAMES.has(hostname)) {
    throw usageError(`refusing private or loopback host: ${hostname} (pass --allow-private-host to opt in)`);
  }
  if (/^(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) {
    throw usageError(`refusing private or loopback host: ${hostname} (pass --allow-private-host to opt in)`);
  }
  if (hostname.startsWith('[')) {
    // bracketed IPv6 literal: only global addresses allowed without the flag
    if (!optionsAllowPrivateHost && /^(?:::1|f[cd])/.test(hostname.slice(1, -1))) {
      throw usageError(`refusing private or loopback host: ${hostname} (pass --allow-private-host to opt in)`);
    }
    return;
  }
  if (!/\./.test(hostname) && hostname !== 'localhost') {
    // bare single-label host that is not localhost: resolve it below
  }
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (error) {
    throw new Error(`cannot resolve host: ${hostname} (${error.code ?? error.message})`);
  }
  for (const { address } of addresses) {
    if (PRIVATE_HOSTNAMES.has(address)
      || /^(?:10\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|127\.)/.test(address)
      || /^(?:::1|f[cd][0-9a-f]{2}:)/i.test(address)) {
      throw usageError(`refusing private or loopback host: ${hostname} resolves to ${address} (pass --allow-private-host to opt in)`);
    }
  }
}

let optionsAllowPrivateHost = false;

function sameOrigin(a, b) {
  return a.protocol === b.protocol && a.host === b.host;
}

function stripTagBlock(html, tag) {
  return html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}\\s*>`, 'gi'), '');
}

function extractTitle(html, fallback) {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (title) return decodeEntities(title[1]).trim();
  const heading = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (heading) return decodeEntities(heading[1].replace(/<[^>]+>/g, '')).trim();
  return fallback;
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (match, code) => String.fromCodePoint(Number(code)));
}

function extractLinks(html, base) {
  const links = [];
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["']/gi;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      links.push(new URL(match[1], base));
    } catch {
      // unresolvable href; skip
    }
  }
  return links;
}

function parseRobots(text) {
  const rules = { allow: [], disallow: [], star: false };
  let appliesToStar = false;
  let sawGroup = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const agent = /^user-agent\s*:\s*(.+)$/i.exec(line);
    if (agent) {
      appliesToStar = agent[1].trim() === '*';
      if (appliesToStar) sawGroup = true;
      continue;
    }
    if (!appliesToStar) continue;
    const allow = /^allow\s*:\s*(\S*)$/i.exec(line);
    const disallow = /^disallow\s*:\s*(\S*)$/i.exec(line);
    if (allow) rules.allow.push(decodeURIComponent(allow[1]));
    if (disallow) rules.disallow.push(decodeURIComponent(disallow[1]));
  }
  rules.star = sawGroup;
  return rules;
}

function robotsAllows(rules, pathname) {
  if (!rules.star) return true;
  let best = { length: -1, allowed: true };
  for (const prefix of rules.disallow) {
    if (prefix === '') continue;
    if (pathname.startsWith(prefix) && prefix.length > best.length) {
      best = { length: prefix.length, allowed: false };
    }
  }
  for (const prefix of rules.allow) {
    if (pathname.startsWith(prefix) && prefix.length >= best.length) {
      best = { length: prefix.length, allowed: true };
    }
  }
  return best.length < 0 ? true : best.allowed;
}

async function fetchPage(url, options) {
  let current = new URL(url);
  for (let hops = 0; hops <= options.maxRedirectHops; hops += 1) {
    let response;
    try {
      response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(options.timeoutMs),
        headers: { 'user-agent': 'teacher-sab-course-import' },
      });
    } catch (error) {
      return { error: error.cause?.code ?? error.message };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) return { error: `HTTP ${response.status} without location` };
      let next;
      try {
        next = new URL(location, current);
      } catch {
        return { error: 'invalid redirect location' };
      }
      if (!sameOrigin(next, options.startUrl)) return { error: 'cross-origin redirect' };
      current = next;
      continue;
    }
    if (!response.ok) return { error: `HTTP ${response.status}` };
    const contentType = response.headers.get('content-type') ?? '';
    if (!/^text\/html\b/i.test(contentType)) return { error: `unsupported content type: ${contentType}` };
    return { url: current, html: await response.text() };
  }
  return { error: `too many redirect hops (> ${options.maxRedirectHops})` };
}

function comparePaths(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function crawl(options) {
  const warnings = [];
  const documents = [];
  const state = { pages: 0, truncated: false, totalBytes: 0 };
  const visited = new Set();
  const queue = [{ url: new URL(options.startUrl), depth: 0 }];

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

  let robots = { star: false, allow: [], disallow: [] };
  const robotsUrl = new URL('/robots.txt', options.startUrl);
  try {
    const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(options.timeoutMs), headers: { 'user-agent': 'teacher-sab-course-import' } });
    if (response.status === 200) robots = parseRobots(await response.text());
    else if (response.status !== 404) warn(`robots.txt unreachable (HTTP ${response.status}); proceeding conservatively`);
  } catch (error) {
    warn(`robots.txt unreachable (${error.cause?.code ?? error.message}); proceeding conservatively`);
  }

  while (queue.length > 0) {
    if (state.truncated) break;
    const { url, depth } = queue.shift();
    const key = url.pathname;
    if (visited.has(key)) continue;
    visited.add(key);

    if (state.pages >= options.maxPages) {
      warn(`page limit reached; traversal truncated at ${options.maxPages} pages`);
      break;
    }

    if (!robotsAllows(robots, url.pathname)) {
      warn(`skipped robots-disallowed page: ${url.pathname}`);
      continue;
    }

    const result = await fetchPage(url, options);
    if (result.error !== undefined) {
      warn(`skipped unreachable page: ${url.pathname} (${result.error})`);
      continue;
    }

    state.pages += 1;
    const finalPath = result.url.pathname;
    visited.add(finalPath);
    const sanitized = stripTagBlock(stripTagBlock(result.html, 'script'), 'style');
    const size = Buffer.byteLength(sanitized, 'utf8');
    if (size > options.maxFileBytes) {
      warn(`file-size limit reached; skipped: ${finalPath}`);
      continue;
    }
    if (state.totalBytes + size > options.maxTotalBytes) {
      warn(`total byte limit reached; traversal truncated at ${options.maxTotalBytes} bytes`);
      state.truncated = true;
      break;
    }
    state.totalBytes += size;
    const title = extractTitle(sanitized, finalPath);
    documents.push({ path: finalPath, title, content: sanitized, sha256: sha256(sanitized) });

    if (depth >= options.maxDepth) continue;
    for (const link of extractLinks(sanitized, result.url)) {
      if (link.protocol !== 'http:' && link.protocol !== 'https:') continue;
      if (!sameOrigin(link, options.startUrl)) {
        if (link.hostname === options.startUrl.hostname) continue;
        warn(`skipped cross-origin link: ${link.href}`);
        continue;
      }
      if (visited.has(link.pathname)) continue;
      queue.push({ url: link, depth: depth + 1 });
    }
  }

  documents.sort((a, b) => comparePaths(a.path, b.path));
  documents.forEach((document, order) => { document.order = order; });
  return { documents, warnings };
}

try {
  const parsed = parseArgs(process.argv.slice(2));
  optionsAllowPrivateHost = parsed.allowPrivateHost;
  const snapshot = await (async () => {
    if (!parsed.allowPrivateHost) await assertPublicHost(parsed.startUrl.hostname);
    const { documents, warnings } = await crawl(parsed);
    return {
      schemaVersion: 1,
      sourceKind: 'static-website',
      locator: parsed.startUrl.href,
      retrievedAt: parsed.retrievedAt,
      documents,
      warnings,
      license: { status: 'unknown', evidence: [], spdxId: null },
      limits: {
        pages: parsed.maxPages,
        depth: parsed.maxDepth,
        fileBytes: parsed.maxFileBytes,
        warnings: parsed.maxWarnings,
        totalBytes: parsed.maxTotalBytes,
      },
    };
  })();
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = error.code === 'USAGE' ? 2 : 1;
}
