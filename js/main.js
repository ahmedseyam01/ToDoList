// Selectors
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const addBtn = document.getElementById('addBtn');
const updateBtn = document.getElementById('updateBtn');
const searchInput = document.getElementById('searchInput');
const taskStats = document.getElementById('taskStats');
const priorityBtns = document.querySelectorAll('.priority-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const progressBar = document.getElementById('progressBar');
const progressPercentage = document.getElementById('progressPercentage');
const progressCircle = document.getElementById('progressCircle');

// Progress Circle Config
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

// State
let allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentPriority = 'medium';
let editingIndex = null;
let isDark = JSON.parse(localStorage.getItem('isDark')) || false;

// Initialize
function init() {
    applyTheme();
    setupEventListeners();
    display();
}

function setupEventListeners() {
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPriority = btn.dataset.priority;
        });
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            display();
        });
    });

    themeToggleBtn.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', display);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            editingIndex === null ? addTask() : updateElement();
        }
    });
}

function addTask() {
    const text = todoInput.value.trim();
    if (text === "") {
        showError('Please enter a task name!');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        priority: currentPriority,
        completed: false,
        createdAt: new Date().getTime()
    };

    allTasks.unshift(newTask);
    saveTasks();
    clearInput();
    display();
    showToast('Task Added!', 'success');
}

function display() {
    let filteredTasks = allTasks;

    if (currentFilter === 'active') {
        filteredTasks = allTasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = allTasks.filter(t => t.completed);
    }

    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(t => 
            t.text.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredTasks.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">${searchTerm ? '🔍' : '✨'}</span>
                <p>${searchTerm ? 'No matching tasks found.' : 'Your list is clear. Time to relax!'}</p>
            </div>
        `;
    } else {
        todoList.innerHTML = filteredTasks.map((task) => {
            const index = allTasks.findIndex(t => t.id === task.id);
            return `
                <li class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="todo-left" onclick="toggleComplete(${index})">
                        <div class="checkbox-custom"></div>
                        <div class="todo-info">
                            <span class="todo-text">${task.text}</span>
                            <div class="todo-meta">
                                <span class="todo-badge ${task.priority}">${task.priority}</span>
                                <span class="todo-time">🕒 ${getRelativeTime(task.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="todo-actions">
                        <button onclick="setUpUpdate(${index})" class="action-btn edit" title="Edit">✏️</button>
                        <button onclick="deleteElement(${index})" class="action-btn delete" title="Delete">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');
    }

    updateStats();
    updateProgress();
}

function toggleComplete(index) {
    allTasks[index].completed = !allTasks[index].completed;
    saveTasks();
    display();
}

function deleteElement(index) {
    Swal.fire({
        title: 'Delete task?',
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Delete',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    }).then((result) => {
        if (result.isConfirmed) {
            allTasks.splice(index, 1);
            saveTasks();
            display();
            showToast('Deleted', 'info');
        }
    });
}

function setUpUpdate(index) {
    const task = allTasks[index];
    todoInput.value = task.text;
    currentPriority = task.priority;
    priorityBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === currentPriority);
    });

    addBtn.classList.add('d-none');
    updateBtn.classList.remove('d-none');
    editingIndex = index;
    todoInput.focus();
    
    // Scroll to top to see input
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateElement() {
    const text = todoInput.value.trim();
    if (text === "") return;

    allTasks[editingIndex].text = text;
    allTasks[editingIndex].priority = currentPriority;
    
    saveTasks();
    resetForm();
    display();
    showToast('Updated!', 'success');
}

function clearAllTasks() {
    if (allTasks.length === 0) return;

    Swal.fire({
        title: 'Clear all tasks?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Clear All',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    }).then((result) => {
        if (result.isConfirmed) {
            allTasks = [];
            saveTasks();
            display();
            showToast('All cleared', 'info');
        }
    });
}

// Helpers
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(allTasks));
}

function clearInput() {
    todoInput.value = "";
}

function resetForm() {
    clearInput();
    addBtn.classList.remove('d-none');
    updateBtn.classList.add('d-none');
    editingIndex = null;
}

function updateStats() {
    const activeCount = allTasks.filter(t => !t.completed).length;
    taskStats.innerText = activeCount === 0 
        ? "You're all done! 🚀" 
        : `${activeCount} task${activeCount === 1 ? '' : 's'} to go`;
}

function updateProgress() {
    if (allTasks.length === 0) {
        setProgress(0);
        return;
    }
    const completedCount = allTasks.filter(t => t.completed).length;
    const percentage = Math.round((completedCount / allTasks.length) * 100);
    setProgress(percentage);
}

function setProgress(percent) {
    // Linear bar
    progressBar.style.width = `${percent}%`;
    
    // Circle
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
    
    // Text
    progressPercentage.innerText = `${percent}%`;
}

function getRelativeTime(timestamp) {
    const now = new Date().getTime();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function showToast(title, icon) {
    Swal.fire({
        icon: icon,
        title: title,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    });
}

function showError(text) {
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: text,
        confirmButtonColor: '#6366f1',
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#fff' : '#000'
    });
}

// Theme
function toggleTheme() {
    isDark = !isDark;
    applyTheme();
    localStorage.setItem('isDark', JSON.stringify(isDark));
    display(); // Refresh to update sweetalert colors
}

function applyTheme() {
    document.body.classList.toggle('dark', isDark);
    themeIcon.innerHTML = isDark ? '☀️' : '🌑';
}

// Run init
init();
