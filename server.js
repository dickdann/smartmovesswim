const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.pdf':  'application/pdf',
};

function serve404(res) {
  const page404 = path.join(PUBLIC_DIR, '404.html');
  fs.readFile(page404, (err, data) => {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(err ? '<h1>404 — Not Found</h1>' : data);
  });
}

const server = http.createServer((req, res) => {
  // Parse URL and strip query string
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Default to index.html
  if (urlPath === '/') urlPath = '/index.html';

  // Prevent directory traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Only serve files inside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    serve404(res);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If it's a directory, try index.html inside it
      if (stats && stats.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        fs.access(indexPath, fs.constants.R_OK, (e) => {
          if (e) { serve404(res); return; }
          serveFile(indexPath, res);
        });
        return;
      }
      serve404(res);
      return;
    }
    serveFile(filePath, res);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      serve404(res);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`\n  SmartMoves Swim — Dev Server`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Serving: ${PUBLIC_DIR}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
