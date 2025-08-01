// modules/tasks.js
const state = {
    tasks: [],
    projects: [],
    filters: {
        status: 'all',
        priority: 'all',
        project: 'all',
        search: ''
    },
    sort: {
        field: 'dueDate',
        order: 'asc'
    }
};

export function init() {
    loadState();
    setupEventListeners();
    renderTasks();
    renderProjects();
}

function loadState() {
    const savedState = localStorage.getItem('taskify-tasks');
    if (savedState) {
        Object.assign(state, JSON.parse(savedState));
    } else {
        // Default projects
        state.projects = [
            { id: 'work', name: 'Kerja', color: 'indigo' },
            { id: 'study', name: 'Belajar', color: 'blue' },
            { id: 'personal', name: 'Pribadi', color: 'green' }
        ];
    }
}

function saveState() {
    localStorage.setItem('taskify-tasks', JSON.stringify({
        tasks: state.tasks,
        projects: state.projects
    }));
}

function setupEventListeners() {
    // Task form submission
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskData = Object.fromEntries(formData.entries());
        
        if (taskData.id) {
            // Update existing task
            state.tasks = state.tasks.map(task => 
                task.id === taskData.id ? { ...task, ...taskData } : task
            );
        } else {
            // Create new task
            const newTask = {
                ...taskData,
                id: `task-${Date.now()}`,
                createdAt: new Date().toISOString(),
                completed: false
            };
            state.tasks.push(newTask);
        }
        
        saveState();
        renderTasks();
        document.getElementById('task-modal').classList.remove('active');
        e.target.reset();
    });

    // Task filtering
    document.getElementById('filter-status').addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        renderTasks();
    });

    // Task sorting
    document.getElementById('sort-tasks').addEventListener('change', (e) => {
        const [field, order] = e.target.value.split('-');
        state.sort = { field, order };
        renderTasks();
    });

    // Quick add task
    document.getElementById('quick-add-task').addEventListener('click', () => {
        document.getElementById('quick-add-modal').classList.remove('active');
        document.getElementById('task-modal').classList.add('active');
    });
}

function renderTasks() {
    const filteredTasks = filterTasks();
    const sortedTasks = sortTasks(filteredTasks);
    
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    if (sortedTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="inbox" class="h-12 w-12 text-gray-400"></i>
                <p>Tidak ada tugas yang sesuai dengan filter</p>
            </div>
        `;
        return;
    }
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
    
    lucide.createIcons();
}

function filterTasks() {
    return state.tasks.filter(task => {
        const matchesStatus = state.filters.status === 'all' || 
            (state.filters.status === 'completed' && task.completed) ||
            (state.filters.status === 'pending' && !task.completed);
            
        const matchesProject = state.filters.project === 'all' || 
            task.project === state.filters.project;
            
        const matchesSearch = !state.filters.search || 
            task.title.toLowerCase().includes(state.filters.search.toLowerCase()) ||
            task.description.toLowerCase().includes(state.filters.search.toLowerCase());
            
        return matchesStatus && matchesProject && matchesSearch;
    });
}

function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        let comparison = 0;
        
        switch (state.sort.field) {
            case 'priority':
                comparison = parseInt(b.priority) - parseInt(a.priority);
                break;
            case 'dueDate':
                comparison = new Date(a.dueDate) - new Date(b.dueDate);
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'createdAt':
                comparison = new Date(a.createdAt) - new Date(b.createdAt);
                break;
        }
        
        return state.sort.order === 'asc' ? comparison : -comparison;
    });
}

function createTaskElement(task) {
    const element = document.createElement('div');
    element.className = `task-item ${task.completed ? 'completed' : ''}`;
    element.dataset.id = task.id;
    
    const priorityColors = {
        '3': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        '2': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        '1': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    };
    
    const project = state.projects.find(p => p.id === task.project) || {};
    
    element.innerHTML = `
        <div class="task-checkbox">
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span class="checkmark"></span>
        </div>
        <div class="task-content">
            <div class="task-header">
                <h3 class="task-title">${task.title}</h3>
                <div class="task-actions">
                    <button class="edit-task"><i data-lucide="edit"></i></button>
                    <button class="delete-task"><i data-lucide="trash"></i></button>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            <div class="task-footer">
                ${task.dueDate ? `
                    <span class="task-due ${isOverdue(task) ? 'overdue' : ''}">
                        <i data-lucide="calendar"></i>
                        ${formatDate(task.dueDate)}
                    </span>
                ` : ''}
                <span class="task-priority ${priorityColors[task.priority]}">
                    ${getPriorityLabel(task.priority)}
                </span>
                ${project.name ? `
                    <span class="task-project" style="--project-color: var(--color-${project.color})">
                        ${project.name}
                    </span>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add event listeners
    element.querySelector('.task-checkbox input').addEventListener('change', (e) => {
        task.completed = e.target.checked;
        saveState();
        renderTasks();
    });
    
    element.querySelector('.edit-task').addEventListener('click', () => {
        openTaskEditor(task);
    });
    
    element.querySelector('.delete-task').addEventListener('click', () => {
        if (confirm('Hapus tugas ini?')) {
            state.tasks = state.tasks.filter(t => t.id !== task.id);
            saveState();
            renderTasks();
        }
    });
    
    return element;
}

function openTaskEditor(task) {
    const form = document.getElementById('task-form');
    form.reset();
    
    for (const [key, value] of Object.entries(task)) {
        if (form.elements[key]) {
            form.elements[key].value = value;
        }
    }
    
    document.getElementById('task-modal').classList.add('active');
}

function getPriorityLabel(priority) {
    const labels = {
        '3': 'Tinggi',
        '2': 'Sedang',
        '1': 'Rendah'
    };
    return labels[priority] || '';
}

function formatDate(dateString) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function isOverdue(task) {
    return !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
}