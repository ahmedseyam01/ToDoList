// Selectors
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const addBtn = document.getElementById('addBtn');
const updateBtn = document.getElementById('updateBtn');
const searchInput = document.getElementById('searchInput');
const remainingCount = document.getElementById('remainingCount');
const miniProgressRing = document.getElementById('miniProgressRing');
const miniProgressPercent = document.getElementById('miniProgressPercent');
const greeting = document.getElementById('greeting');
const currentDate = document.getElementById('currentDate');
const categorySelector = document.getElementById('categorySelector');
const priorityBtns = document.querySelectorAll('.p-pill');
const navItems = document.querySelectorAll('.nav-item');
const catItems = document.querySelectorAll('.cat-item');
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const listTitle = document.getElementById('listTitle');

// Progress Ring Config
const circumference = 16 * 2 * Math.PI; // radius 16
miniProgressRing.style.strokeDasharray = `${circumference} ${circumference}`;

// State
let allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentPriority = 'medium';
let editingIndex = null;
let isDark = JSON.parse(localStorage.getItem('isDark')) || false;

// Initialize
function init() {
    updateGreeting();
    updateDate();
    applyTheme();
    setupEventListeners();
    display();
}

function setupEventListeners() {
    // Priority pills
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPriority = btn.dataset.priority;
        });
    });

    // Navigation filters (All, Active, Completed)
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            updateListTitle();
            display();
        });
    });

    // Category filters (General, Work, Personal, Shopping)
    catItems.forEach(btn => {
        btn.addEventListener('click', () => {
            catItems.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            display();
        });
    });

    themeToggleBtn.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', display);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            editingIndex === null ? addTask() : updateElement();
        }
    });
}

function addTask() {
    const text = todoInput.value.trim();
    if (text === "") {
        showError('What are we planning to do?');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: text,
        priority: currentPriority,
        category: categorySelector.value,
        completed: false,
        createdAt: new Date().getTime()
    };

    allTasks.unshift(newTask);
    saveTasks();
    clearInput();
    display();
    showToast('Task launched! 🚀', 'success');
}

function display() {
    let filteredTasks = allTasks;

    // Apply Status Filter
    if (currentFilter === 'active') {
        filteredTasks = allTasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = allTasks.filter(t => t.completed);
    }

    // Apply Category Filter
    if (currentCategory !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.category === currentCategory);
    }

    // Apply Search Filter
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(t => 
            t.text.toLowerCase().includes(searchTerm) || 
            t.category.toLowerCase().includes(searchTerm)
        );
    }

    renderTasks(filteredTasks);
    updateStats();
}

function renderTasks(tasks) {
    if (tasks.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="empty-state-icon">🔭</span>
                <p>No tasks found in this orbit.</p>
            </div>
        `;
        return;
    }

    todoList.innerHTML = tasks.map((task) => {
        const index = allTasks.findIndex(t => t.id === task.id);
        const categoryIcon = getCategoryIcon(task.category);
        
        return `
            <li class="task-card ${task.completed ? 'completed' : ''}" style="animation-delay: ${tasks.indexOf(task) * 0.05}s">
                <div class="task-card-header">
                    <span class="task-category-tag">${categoryIcon} ${task.category}</span>
                    <div class="task-priority-indicator ${task.priority}" title="${task.priority} priority"></div>
                </div>
                <div class="task-card-body" onclick="toggleComplete(${index})">
                    <p class="task-card-text">${task.text}</p>
                </div>
                <div class="task-card-footer">
                    <span class="task-date">🕒 ${getRelativeTime(task.createdAt)}</span>
                    <div class="task-actions-mini">
                        <button onclick="setUpUpdate(${index})" class="btn-mini edit" title="Edit">✏️</button>
                        <button onclick="deleteElement(${index})" class="btn-mini delete" title="Delete">🗑️</button>
                    </div>
                </div>
            </li>
        `;
    }).join('');
}

function toggleComplete(index) {
    allTasks[index].completed = !allTasks[index].completed;
    saveTasks();
    display();
}

function deleteElement(index) {
    Swal.fire({
        title: 'Archive task?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f43f5e',
        confirmButtonText: 'Yes, remove it',
        background: isDark ? '#0f172a' : '#fff',
        color: isDark ? '#fff' : '#000'
    }).then((result) => {
        if (result.isConfirmed) {
            allTasks.splice(index, 1);
            saveTasks();
            display();
            showToast('Task removed.', 'info');
        }
    });
}

function setUpUpdate(index) {
    const task = allTasks[index];
    todoInput.value = task.text;
    categorySelector.value = task.category;
    currentPriority = task.priority;
    
    priorityBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === currentPriority);
    });

    addBtn.classList.add('d-none');
    updateBtn.classList.remove('d-none');
    editingIndex = index;
    todoInput.focus();
}

function updateElement() {
    const text = todoInput.value.trim();
    if (text === "") return;

    allTasks[editingIndex].text = text;
    allTasks[editingIndex].priority = currentPriority;
    allTasks[editingIndex].category = categorySelector.value;
    
    saveTasks();
    resetForm();
    display();
    showToast('Task updated!', 'success');
}

function clearAllTasks() {
    const completedTasks = allTasks.filter(t => t.completed);
    if (completedTasks.length === 0) return;

    Swal.fire({
        title: 'Clear completed?',
        text: `You're about to remove ${completedTasks.length} tasks.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#f43f5e',
        confirmButtonText: 'Clear All',
        background: isDark ? '#0f172a' : '#fff',
        color: isDark ? '#fff' : '#000'
    }).then((result) => {
        if (result.isConfirmed) {
            allTasks = allTasks.filter(t => !t.completed);
            saveTasks();
            display();
            showToast('Cleared!', 'success');
        }
    });
}

// Helpers
function updateGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) greeting.innerText = "Good morning! 🌅";
    else if (hour < 18) greeting.innerText = "Good afternoon! ☀️";
    else greeting.innerText = "Good evening! 🌙";
}

function updateDate() {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    currentDate.innerText = new Date().toLocaleDateString('en-US', options);
}

function updateListTitle() {
    listTitle.innerText = currentFilter === 'all' ? "All Tasks" : 
                         currentFilter === 'active' ? "Active Tasks" : "Completed Tasks";
}

function getCategoryIcon(cat) {
    const icons = { general: '📁', work: '💼', personal: '👤', shopping: '🛒' };
    return icons[cat] || '📁';
}

function getRelativeTime(timestamp) {
    const diff = new Date().getTime() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function updateStats() {
    const active = allTasks.filter(t => !t.completed).length;
    const total = allTasks.length;
    const percent = total === 0 ? 0 : Math.round(((total - active) / total) * 100);

    remainingCount.innerText = active;
    miniProgressPercent.innerText = `${percent}%`;
    
    const offset = circumference - (percent / 100) * circumference;
    miniProgressRing.style.strokeDashoffset = offset;
}

function saveTasks() { localStorage.setItem('tasks', JSON.stringify(allTasks)); }
function clearInput() { todoInput.value = ""; }
function resetForm() {
    clearInput();
    addBtn.classList.remove('d-none');
    updateBtn.classList.add('d-none');
    editingIndex = null;
}

function showToast(title, icon) {
    Swal.fire({
        icon: icon, title: title, toast: true, position: 'top-end',
        showConfirmButton: false, timer: 2000, timerProgressBar: true,
        background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000'
    });
}

function showError(text) {
    Swal.fire({
        icon: 'error', title: 'Wait...', text: text,
        confirmButtonColor: '#6366f1', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000'
    });
}

function toggleTheme() {
    isDark = !isDark;
    applyTheme();
    localStorage.setItem('isDark', JSON.stringify(isDark));
    display();
}

function applyTheme() {
    document.body.classList.toggle('dark', isDark);
    themeIcon.innerHTML = isDark ? '☀️' : '🌑';
}

init();
