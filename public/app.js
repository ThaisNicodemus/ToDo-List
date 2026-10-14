'use strict';

const taskForm = document.querySelector('#task-form');
const taskTitleInput = document.querySelector('#task-title');
const addButton = document.querySelector('#add-button');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const loadingState = document.querySelector('#loading-state');
const emptyState = document.querySelector('#empty-state');
const formMessage = document.querySelector('#form-message');

let tasks = [];

function updateTaskCount() {
  const count = tasks.length;
  taskCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
  emptyState.hidden = count !== 0;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue));
}

function createTaskElement(task) {
  const item = document.createElement('li');
  const copy = document.createElement('div');
  const title = document.createElement('span');
  const date = document.createElement('time');
  const removeButton = document.createElement('button');

  item.className = 'task-item';
  item.dataset.taskId = task.id;
  copy.className = 'task-copy';
  title.className = 'task-title';
  title.textContent = task.tittle;
  date.className = 'task-date';
  date.dateTime = task.ratedAt;
  date.textContent = `Added ${formatDate(task.ratedAt)}`;
  removeButton.className = 'remove-button';
  removeButton.type = 'button';
  removeButton.textContent = 'Remove';
  removeButton.setAttribute('aria-label', `Remove ${task.tittle}`);

  removeButton.addEventListener('click', () => removeTask(task, removeButton));

  copy.append(title, date);
  item.append(copy, removeButton);
  return item;
}

function renderTasks() {
  taskList.replaceChildren(...tasks.map(createTaskElement));
  updateTaskCount();
}

function setMessage(message = '') {
  formMessage.textContent = message;
}

async function loadTasks() {
  try {
    const response = await fetch('/api/tasks');
    if (!response.ok) throw new Error('Could not load your tasks.');

    const payload = await response.json();
    tasks = payload.tasks;
    renderTasks();
  } catch (error) {
    setMessage(error.message);
  } finally {
    loadingState.hidden = true;
  }
}

async function addTask(event) {
  event.preventDefault();
  setMessage();

  const tittle = taskTitleInput.value.trim();
  if (!tittle) {
    setMessage('The task title cannot be empty.');
    taskTitleInput.focus();
    return;
  }

  addButton.disabled = true;
  addButton.textContent = 'Adding…';

  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tittle }),
    });
    const payload = await response.json();

    if (!response.ok) throw new Error(payload.error || 'Could not add the task.');

    tasks.push(payload);
    renderTasks();
    taskForm.reset();
    taskTitleInput.focus();
  } catch (error) {
    setMessage(error.message);
  } finally {
    addButton.disabled = false;
    addButton.textContent = 'Add task';
  }
}

async function removeTask(task, button) {
  setMessage();
  button.disabled = true;
  button.textContent = 'Removing…';

  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || 'Could not remove the task.');
    }

    tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
    renderTasks();
  } catch (error) {
    setMessage(error.message);
    button.disabled = false;
    button.textContent = 'Remove';
  }
}

taskForm.addEventListener('submit', addTask);
loadTasks();
