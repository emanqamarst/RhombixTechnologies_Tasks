const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

window.addEventListener('load', loadTasks);

taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const text = taskInput.value.trim();
    if (!text) return;

    addTask(text);
    saveTask(text);

    taskInput.value = '';
});

function addTask(text, completed = false) {
    const li = document.createElement('li');
    li.classList.add('task-item');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;

    const span = document.createElement('span');
    span.textContent = text;
    span.classList.add('task-text');

    if (completed) span.classList.add('completed');

    checkbox.addEventListener('change', () => {
        span.classList.toggle('completed');
        updateLocalStorage();
    });

    const actions = document.createElement('div');
    actions.classList.add('task-actions');

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.classList.add('edit-btn');

    editBtn.addEventListener('click', () => {
        const newText = prompt('Edit task:', span.textContent);
        if (newText && newText.trim()) {
            span.textContent = newText.trim();
            updateLocalStorage();
        }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.classList.add('delete-btn');

    deleteBtn.addEventListener('click', () => {
        li.remove();
        updateLocalStorage();
        checkEmptyState();
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    taskList.appendChild(li);
    checkEmptyState();
}

function saveTask(text) {
    const tasks = getTasks();
    tasks.push({ text, completed: false });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getTasks() {
    return JSON.parse(localStorage.getItem('tasks')) || [];
}

function loadTasks() {
    const tasks = getTasks();
    tasks.forEach(task => addTask(task.text, task.completed));
    checkEmptyState();
}

function updateLocalStorage() {
    const items = document.querySelectorAll('.task-item');
    const tasks = [];

    items.forEach(item => {
        const text = item.querySelector('.task-text').textContent;
        const completed = item.querySelector('input').checked;
        tasks.push({ text, completed });
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function checkEmptyState() {
    const emptyMsg = document.querySelector('.empty');

    if (taskList.children.length === 0) {
        if (!emptyMsg) {
            const p = document.createElement('p');
            p.classList.add('empty');
            p.textContent = 'No tasks yet';
            taskList.appendChild(p);
        }
    } else {
        if (emptyMsg) emptyMsg.remove();
    }
}