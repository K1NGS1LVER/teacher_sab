import crypto from 'node:crypto';
import path from 'node:path';

export const TEXT_EXTENSIONS = new Set(['.html', '.htm', '.md', '.markdown', '.txt']);
export const IGNORED_DIRECTORIES = new Set(['.git', '.hg', '.svn', 'node_modules']);

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

export function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function isSecret(name) {
  const normalized = name.toLowerCase();
  return SECRET_NAMES.has(normalized)
    || normalized.startsWith('.env.')
    || /^id_(?:rsa|ed25519|ecdsa)(?:[._-].*)?$/i.test(normalized)
    || SECRET_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isLicenseFile(name) {
  return /^(?:license|copying)(?:[._-].*)?$/i.test(name);
}

export function isSupportedFile(name) {
  return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase()) || isLicenseFile(name);
}

export function titleFor(relative, content) {
  const heading = content.match(/^\s*#\s+(.+?)\s*$/m);
  if (heading) return heading[1].replace(/\s+#*\s*$/, '').trim();
  return path.basename(relative, path.extname(relative));
}
