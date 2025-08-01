// modules/time-tracker.js
const state = {
    activities: [],
    currentActivity: null,
    activityTypes: [
        { id: 'work', name: 'Kerja', color: 'indigo', icon: 'briefcase' },
        { id: 'study', name: 'Belajar', color: 'blue', icon: 'book' },
        { id: 'meeting', name: 'Meeting', color: 'purple', icon: 'users' },
        { id: 'break', name: 'Istirahat', color: 'green', icon: 'coffee' }
    ],
    history: []
};

export function init() {
    loadState();
    setupEventListeners();
    renderActivityTypes();
    renderCurrentActivity();
    renderActivityHistory();
    renderWeeklyReport();
}

function loadState() {
    const savedState = localStorage.getItem('taskify-time-tracker');
    if (savedState) {
        Object.assign(state, JSON.parse(savedState));
    }
}

function saveState() {
    localStorage.setItem('taskify-time-tracker', JSON.stringify({
        activities: state.activities,
        currentActivity: state.currentActivity,
        activityTypes: state.activityTypes,
        history: state.history
    }));
}

function setupEventListeners() {
    document.getElementById('start-activity-btn').addEventListener('click', startNewActivity);
    document.getElementById('stop-activity-btn').addEventListener('click', stopCurrentActivity);
    document.getElementById('add-activity-type-btn').addEventListener('click', showAddActivityTypeForm);
    document.getElementById('activity-type-form').addEventListener('submit', addNewActivityType);
}

function startNewActivity() {
    const activityType = document.getElementById('activity-type-select').value;
    const description = document.getElementById('activity-description').value;
    
    if (state.currentActivity) {
        stopCurrentActivity();
    }
    
    state.currentActivity = {
        id: `activity-${Date.now()}`,
        type: activityType,
        description,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null
    };
    
    saveState();
    renderCurrentActivity();
    
    // Update UI
    document.getElementById('tracker-status').textContent = 'Sedang Melacak';
    document.getElementById('tracker-status').className = 'tracker-status active';
}

function stopCurrentActivity() {
    if (!state.currentActivity) return;
    
    const endTime = new Date();
    const startTime = new Date(state.currentActivity.startTime);
    const duration = (endTime - startTime) / (1000 * 60); // in minutes
    
    state.currentActivity.endTime = endTime.toISOString();
    state.currentActivity.duration = duration;
    
    // Add to activities history
    state.activities.push({ ...state.currentActivity });
    
    // Update weekly totals
    updateWeeklyTotals(state.currentActivity.type, duration);
    
    state.currentActivity = null;
    saveState();
    
    // Update UI
    document.getElementById('tracker-status').textContent = 'Tidak Aktif';
    document.getElementById('tracker-status').className = 'tracker-status';
    document.getElementById('activity-description').value = '';
    
    renderCurrentActivity();
    renderActivityHistory();
    renderWeeklyReport();
}

function updateWeeklyTotals(activityType, duration) {
    const now = new Date();
    const weekStart = getWeekStartDate(now);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    let weekData = state.history.find(item => item.week === weekKey);
    if (!weekData) {
        weekData = {
            week: weekKey,
            totals: {}
        };
        state.history.push(weekData);
    }
    
    if (!weekData.totals[activityType]) {
        weekData.totals[activityType] = 0;
    }
    
    weekData.totals[activityType] += duration;
}

function getWeekStartDate(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
}

function renderActivityTypes() {
    const selectEl = document.getElementById('activity-type-select');
    selectEl.innerHTML = '';
    
    state.activityTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        selectEl.appendChild(option);
    });
}

function renderCurrentActivity() {
    const currentActivityEl = document.getElementById('current-activity');
    
    if (state.currentActivity) {
        const activityType = state.activityTypes.find(type => type.id === state.currentActivity.type);
        const startTime = new Date(state.currentActivity.startTime);
        const duration = calculateCurrentDuration();
        
        currentActivityEl.innerHTML = `
            <div class="current-activity-header">
                <div class="activity-icon" style="background-color: var(--color-${activityType.color}-100)">
                    <i data-lucide="${activityType.icon}"></i>
                </div>
                <div class="activity-info">
                    <h3 class="activity-type">${activityType.name}</h3>
                    ${state.currentActivity.description ? 
                      `<p class="activity-description">${state.currentActivity.description}</p>` : ''}
                </div>
            </div>
            <div class="activity-timer">
                <span class="timer-label">Durasi:</span>
                <span class="timer-value">${formatDuration(duration)}</span>
            </div>
        `;
        
        // Update timer every minute
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }
        
        state.timerInterval = setInterval(() => {
            const duration = calculateCurrentDuration();
            document.querySelector('.timer-value').textContent = formatDuration(duration);
        }, 60000);
    } else {
        currentActivityEl.innerHTML = `
            <div class="no-activity">
                <i data-lucide="clock" class="h-12 w-12 text-gray-400"></i>
                <p>Tidak ada aktivitas yang sedang dilacak</p>
            </div>
        `;
    }
    
    lucide.createIcons();
}

function calculateCurrentDuration() {
    if (!state.currentActivity) return 0;
    
    const startTime = new Date(state.currentActivity.startTime);
    const now = new Date();
    return (now - startTime) / (1000 * 60); // in minutes
}

function renderActivityHistory() {
    const historyEl = document.getElementById('activity-history');
    historyEl.innerHTML = '';
    
    const recentActivities = [...state.activities]
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 10);
    
    if (recentActivities.length === 0) {
        historyEl.innerHTML = '<p class="text-gray-500">Belum ada aktivitas tercatat</p>';
        return;
    }
    
    recentActivities.forEach(activity => {
        const activityType = state.activityTypes.find(type => type.id === activity.type);
        const startTime = new Date(activity.startTime);
        const endTime = activity.endTime ? new Date(activity.endTime) : null;
        
        const activityEl = document.createElement('div');
        activityEl.className = 'activity-history-item';
        activityEl.innerHTML = `
            <div class="activity-icon" style="background-color: var(--color-${activityType.color}-100)">
                <i data-lucide="${activityType.icon}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-header">
                    <h4 class="activity-type">${activityType.name}</h4>
                    <span class="activity-duration">${formatDuration(activity.duration)}</span>
                </div>
                <div class="activity-footer">
                    <span class="activity-time">
                        ${formatTime(startTime)} - ${endTime ? formatTime(endTime) : 'Sekarang'}
                    </span>
                    ${activity.description ? 
                      `<span class="activity-description">${activity.description}</span>` : ''}
                </div>
            </div>
        `;
        
        historyEl.appendChild(activityEl);
    });
    
    lucide.createIcons();
}

function renderWeeklyReport() {
    const reportEl = document.getElementById('weekly-report');
    const now = new Date();
    const weekStart = getWeekStartDate(now);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    const weekData = state.history.find(item => item.week === weekKey) || { totals: {} };
    
    // Calculate total hours per activity type
    const activityTotals = state.activityTypes.map(type => {
        const minutes = weekData.totals[type.id] || 0;
        return {
            ...type,
            hours: minutes / 60,
            percentage: calculatePercentage(minutes, Object.values(weekData.totals).reduce((a, b) => a + b, 0))
        };
    });
    
    // Total work hours this week
    const totalHours = activityTotals.reduce((sum, activity) => sum + activity.hours, 0);
    
    reportEl.innerHTML = `
        <div class="weekly-total">
            <h4>Total Jam Minggu Ini</h4>
            <p class="total-hours">${totalHours.toFixed(1)} jam</p>
        </div>
        <div class="activity-distribution">
            ${activityTotals.map(activity => `
                <div class="activity-dist-item">
                    <div class="dist-header">
                        <div class="activity-icon" style="background-color: var(--color-${activity.color}-100)">
                            <i data-lucide="${activity.icon}"></i>
                        </div>
                        <span class="activity-name">${activity.name}</span>
                    </div>
                    <div class="dist-bar">
                        <div class="bar-fill" style="width: ${activity.percentage}%; background-color: var(--color-${activity.color}-500)"></div>
                    </div>
                    <span class="dist-hours">${activity.hours.toFixed(1)} jam</span>
                </div>
            `).join('')}
        </div>
    `;
    
    lucide.createIcons();
}

function calculatePercentage(value, total) {
    return total > 0 ? (value / total) * 100 : 0;
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours > 0 ? `${hours}j ` : ''}${mins}m`;
}

function formatTime(date) {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showAddActivityTypeForm() {
    document.getElementById('activity-type-form').classList.remove('hidden');
}

function addNewActivityType(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newType = {
        id: `type-${Date.now()}`,
        name: formData.get('activity-name'),
        color: formData.get('activity-color'),
        icon: formData.get('activity-icon')
    };
    
    state.activityTypes.push(newType);
    saveState();
    
    e.target.reset();
    e.target.classList.add('hidden');
    renderActivityTypes();
}