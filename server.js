'use strict';

const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const publicDirectory = path.join(__dirname, 'public');
const maximumRequestSize = 1_000_000;

const staticFiles = new Map([
  ['/', { file: 'index.html', contentType: 'text/html; charset=utf-8' }],
  ['/index.html', { file: 'index.html', contentType: 'text/html; charset=utf-8' }],
  ['/styles.css', { file: 'styles.css', contentType: 'text/css; charset=utf-8' }],
  ['/app.js', { file: 'app.js', contentType: 'text/javascript; charset=utf-8' }],
]);

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);

  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  response.end(body);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body) > maximumRequestSize) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        request.destroy();
      }
    });

    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        const error = new Error('The request body must contain valid JSON.');
        error.statusCode = 400;
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function createRequestHandler(tasks = new Map()) {
  return async function requestHandler(request, response) {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const { pathname } = url;

    if (request.method === 'GET' && pathname === '/api/tasks') {
      sendJson(response, 200, { tasks: [...tasks.values()] });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/tasks') {
      try {
        const body = await readJsonBody(request);

        if (typeof body.tittle !== 'string' || body.tittle.trim() === '') {
          sendJson(response, 400, { error: 'The task title cannot be empty.' });
          return;
        }

        const task = {
          id: randomUUID(),
          tittle: body.tittle.trim(),
          ratedAt: new Date().toISOString(),
        };

        tasks.set(task.id, task);
        sendJson(response, 201, task);
      } catch (error) {
        if (!response.headersSent) {
          sendJson(response, error.statusCode || 400, {
            error: error.message || 'Invalid request.',
          });
        }
      }
      return;
    }

    const deleteMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (request.method === 'DELETE' && deleteMatch) {
      const taskId = decodeURIComponent(deleteMatch[1]);

      if (!tasks.delete(taskId)) {
        sendJson(response, 404, { error: 'Task not found.' });
        return;
      }

      response.writeHead(204, { 'Cache-Control': 'no-store' });
      response.end();
      return;
    }

    if (pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'Route not found.' });
      return;
    }

    const staticFile = staticFiles.get(pathname);
    if (request.method === 'GET' && staticFile) {
      try {
        const fileContents = await readFile(path.join(publicDirectory, staticFile.file));
        response.writeHead(200, {
          'Content-Type': staticFile.contentType,
          'Content-Length': fileContents.length,
        });
        response.end(fileContents);
      } catch {
        sendJson(response, 500, { error: 'Unable to load the application.' });
      }
      return;
    }

    sendJson(response, 404, { error: 'Not found.' });
  };
}

function createServer(tasks) {
  return http.createServer(createRequestHandler(tasks));
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = createServer();

  server.listen(port, () => {
    console.log(`To Do App is running at http://localhost:${port}`);
  });
}

module.exports = { createRequestHandler, createServer };
