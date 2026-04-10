import http from 'http';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      response.end('Internal Server Error');
      return;
    }

    response.writeHead(200, {'Content-Type': contentType});
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  const requestPath = request.url === '/' ? '/index.html' : request.url;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(rootDir, safePath);

  if (!filePath.startsWith(rootDir)) {
    response.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Forbidden');
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(filePath, response);
      return;
    }

    response.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    response.end('Not Found');
  });
});

server.listen(port, () => {
  console.log(`Close Triangle is running at http://localhost:${port}`);
});
