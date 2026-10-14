'use strict';

const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createServer } = require('../server');

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('GET /api/tasks starts with an empty task list', async () => {
  const response = await fetch(`${baseUrl}/api/tasks`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { tasks: [] });
});

test('POST /api/tasks validates an empty title', async () => {
  const response = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tittle: '   ' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'The task title cannot be empty.',
  });
});

test('a task can be created, listed, and removed', async () => {
  const createResponse = await fetch(`${baseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tittle: '  Write tests  ' }),
  });

  assert.equal(createResponse.status, 201);
  const task = await createResponse.json();
  assert.equal(task.tittle, 'Write tests');
  assert.ok(task.id);
  assert.ok(task.ratedAt);

  const listResponse = await fetch(`${baseUrl}/api/tasks`);
  assert.deepEqual(await listResponse.json(), { tasks: [task] });

  const deleteResponse = await fetch(`${baseUrl}/api/tasks/${task.id}`, {
    method: 'DELETE',
  });
  assert.equal(deleteResponse.status, 204);

  const finalListResponse = await fetch(`${baseUrl}/api/tasks`);
  assert.deepEqual(await finalListResponse.json(), { tasks: [] });
});

test('DELETE /api/tasks/:id returns 404 for an unknown task', async () => {
  const response = await fetch(`${baseUrl}/api/tasks/does-not-exist`, {
    method: 'DELETE',
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'Task not found.' });
});

test('GET / serves the application page', async () => {
  const response = await fetch(baseUrl);
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/html/);
  assert.match(body, /What needs doing\?/);
});
