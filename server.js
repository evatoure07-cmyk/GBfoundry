'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const allowed = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/logo.png': ['logo.png', 'image/png'],
  '/favicon.ico': ['logo.png', 'image/png']
};
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD'});
    return res.end('Method Not Allowed');
  }
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; }
  catch { res.writeHead(400); return res.end('Bad Request'); }
  const asset = allowed[pathname];
  if (!asset) { res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}); return res.end('Not Found'); }
  fs.readFile(path.join(__dirname, asset[0]), (error, content) => {
    if (error) { res.writeHead(500); return res.end('Unable to load application'); }
    res.writeHead(200, {
      'Content-Type': asset[1],
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': pathname === '/' || pathname === '/index.html' ? 'no-cache' : 'public, max-age=600'
    });
    return res.end(req.method === 'HEAD' ? undefined : content);
  });
});
const port = Number(process.env.PORT) || 10000;
server.listen(port, '0.0.0.0', () => console.log(`GB Foundry listening on port ${port}`));
