# To Do App

A small single-page task manager built with Node.js and vanilla HTML, CSS, and JavaScript. Tasks are stored in memory and can be added, viewed, and removed from the browser.

## Features

- Add tasks without reloading the page.
- View all tasks currently stored by the server.
- Remove individual tasks.
- Validate empty task titles in the browser and on the server.
- Responsive and accessible interface.
- No external runtime dependencies.
- Automated API integration tests.

## Requirements

- Node.js 18 or later.
- npm, included with Node.js.

The project was tested with Node.js 24 and npm 11.

## Installation

Clone or download the project, open a terminal in its root directory, and run:

```bash
npm install
```

The application has no external dependencies, but this command validates the project configuration and prepares the standard npm workflow.

## Running the application

Start the server with:

```bash
npm start
```

Then open the following address in a browser:

```text
http://localhost:3000
```

The server uses port `3000` by default. To use another port in PowerShell:

```powershell
$env:PORT = 4000
npm start
```

## Running the tests

Execute the automated tests with:

```bash
npm test
```

The test suite covers:

- loading an empty task list;
- rejecting an empty title;
- creating, listing, and removing a task;
- returning `404` for an unknown task;
- serving the application page.

## API

### List tasks

```http
GET /api/tasks
```

Successful response:

```json
{
  "tasks": []
}
```

### Create a task

```http
POST /api/tasks
Content-Type: application/json
```

Request body:

```json
{
  "tittle": "Study Node.js"
}
```

Successful response: `201 Created`.

```json
{
  "id": "generated-uuid",
  "tittle": "Study Node.js",
  "ratedAt": "2026-10-14T15:30:00.000Z"
}
```

The field names `tittle` and `ratedAt` intentionally follow the project specification.

### Remove a task

```http
DELETE /api/tasks/:id
```

Successful response: `204 No Content`.

If the task does not exist, the API returns `404 Not Found`:

```json
{
  "error": "Task not found."
}
```

## Project structure

```text
.
├── package.json
├── server.js
├── spec.md
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── test/
    └── server.test.js
```

## Data storage

Tasks are stored in a `Map` inside the Node.js process. They remain available only while the server is running and are permanently removed when the server restarts.

## Specification

Detailed functional requirements, API contracts, and acceptance criteria are available in [spec.md](./spec.md).
