import http from 'node:http';

const SHAS = {
  main: 'c1a2b3d4e5f60718293a4b5c6d7e8f9011223344',
  dev: 'd4a4d4a4d4a4d4a4d4a4d4a4d4a4d4a4d4a4d4a4',
  pin: '1111222233334444555566667777888899990000',
};
const SHA_SET = new Set(Object.values(SHAS));

const TREE = [
  { path: 'README.md', type: 'blob', size: 14 },
  { path: '01-intro.md', type: 'blob', size: 20 },
  { path: 'LICENSE', type: 'blob', size: 11 },
  { path: 'docs/lesson.md', type: 'blob', size: 18 },
  { path: '.env', type: 'blob', size: 20 },
  { path: 'credentials.md', type: 'blob', size: 25 },
  { path: 'node_modules/pkg/x.md', type: 'blob', size: 10 },
  { path: 'logo.png', type: 'blob', size: 100 },
  { path: 'big.md', type: 'blob', size: 3000000 },
];

const RAW = {
  'README.md': '# Mock course\n',
  '01-intro.md': '# First lesson\n',
  'LICENSE': 'MIT License\n',
  'docs/lesson.md': '# Docs lesson\n',
  '.env': 'TOKEN=do-not-import\n',
  'credentials.md': 'password: nope\n',
  'node_modules/pkg/x.md': 'nope\n',
  'logo.png': 'PNGDATA',
  'big.md': `# Big\n${'x'.repeat(2999995)}`,
};

const state = { requests: 0 };

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);

  if (url.pathname === '/__requests') return send(res, 200, { count: state.requests });
  if (url.pathname === '/__reset') {
    state.requests = 0;
    return send(res, 200, { ok: true });
  }

  state.requests += 1;

  if (parts[0] === 'repos') {
    const repoName = `${parts[1]}/${parts[2]}`;
    const rest = parts.slice(3);

    if (repoName === 'course/ratelimit') {
    return send(res, 403, { message: 'API rate limit exceeded' }, {
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '1700000000',
    });
  }
  if (repoName === 'course/notfound') return send(res, 404, { message: 'Not Found' });
  if (repoName === 'course/auth' && req.headers.authorization !== 'Bearer test-token') {
    return send(res, 401, { message: 'Bad credentials' });
  }

  if (rest.length === 0) {
    return send(res, 200, {
      default_branch: 'main',
      license: repoName === 'course/course' ? { spdx_id: 'MIT', name: 'MIT License' } : null,
    });
  }
  if (rest[0] === 'commits' && rest[1]) {
    const sha = SHAS[rest[1]] ?? (/^[0-9a-f]{40}$/.test(rest[1]) ? rest[1] : null);
    if (!sha) return send(res, 404, { message: 'Not Found' });
    return send(res, 200, { sha });
  }
  if (rest[0] === 'git' && rest[1] === 'trees') {
    if (!SHA_SET.has(rest[2])) return send(res, 404, { message: 'Not Found' });
    return send(res, 200, {
      sha: rest[2],
      truncated: repoName === 'course/truncated',
      tree: TREE.map((entry) => ({ ...entry })),
    });
  }
  return send(res, 404, { message: 'Not Found' });
}

// raw: /{owner}/{repo}/{sha}/{path...}
const sha = parts[2];
const filePath = parts.slice(3).join('/');
if (!SHA_SET.has(sha)) return send(res, 404, { message: 'Not Found' });
const content = RAW[filePath];
if (content === undefined) return send(res, 404, { message: 'Not Found' });
res.writeHead(200, { 'content-type': 'text/plain' });
res.end(content);
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  if (process.send) process.send({ port });
  else process.stdout.write(`${port}\n`);
});
