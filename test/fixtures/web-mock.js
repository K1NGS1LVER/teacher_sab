import http from 'node:http';

const state = { requests: 0 };

function page(title, body, links = []) {
  return `<!DOCTYPE html>
<html><head><title>${title}</title></head>
<body>
<h1>${title}</h1>
${body}
${links.map((href) => `<a href="${href}">link</a>`).join('\n')}
<script>console.log("stripped")</script>
<style>.x { color: red }</style>
</body></html>`;
}

const PAGES = {
  '/': {
    title: 'Mock course home',
    html: page('Mock course home', '<p>Welcome.</p>', ['/lessons/one.html', '/lessons/two.html', '/secret.html', 'https://example.com/outside.html']),
  },
  '/lessons/one.html': {
    title: 'Lesson one',
    html: page('Lesson one', '<p>First lesson content.</p>'),
  },
  '/lessons/two.html': {
    title: 'Lesson two',
    html: page('Lesson two', '<p>Second lesson.</p>', ['/admin/panel.html']),
  },
  '/secret.html': {
    title: 'Secret',
    html: page('Secret', '<p>disallowed</p>'),
  },
  '/admin/panel.html': {
    title: 'Admin',
    html: page('Admin', '<p>disallowed</p>'),
  },
  '/old.html': { redirect: '/lessons/one.html' },
  '/hop.html': { redirect: 'https://example.com/escape.html' },
  '/big.html': {
    title: 'Big page',
    html: `<html><head><title>Big page</title></head><body><p>${'x'.repeat(3000000)}</p></body></html>`,
  },
  '/binary.bin': { body: 'BINARYDATA', contentType: 'application/octet-stream' },
};

const ROBOTS = 'User-agent: *\nAllow: /lessons\nDisallow: /secret\nDisallow: /admin\n';

const server = http.createServer((req, res) => {
  state.requests += 1;
  const url = new URL(req.url, 'http://127.0.0.1');
  const pathname = url.pathname;

  if (pathname === '/__requests') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ count: state.requests }));
    return;
  }
  if (pathname === '/__reset') {
    state.requests = 0;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  if (pathname === '/robots.txt') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(ROBOTS);
    return;
  }

  const entry = PAGES[pathname];
  if (entry === undefined) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  if (entry.redirect !== undefined) {
    res.writeHead(301, { location: entry.redirect });
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': entry.contentType ?? 'text/html; charset=utf-8' });
  res.end(entry.body ?? entry.html);
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  if (process.send) process.send({ port });
  else process.stdout.write(`${port}\n`);
});
