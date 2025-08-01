// modules/journal.js
const state = {
    entries: {},
    currentCycle: getCurrentCycle(),
    templates: {
        daily: [
            { id: 'work_hours', type: 'number', label: 'Jam Kerja', placeholder: '8' },
            { id: 'learning', type: 'textarea', label: 'Pembelajaran Hari Ini', placeholder: 'Apa yang dipelajari hari ini?' },
            { id: 'mood', type: 'range', label: 'Mood (1-5)', min: 1, max: 5 }
        ],
        weekly: [
            { id: 'achievements', type: 'textarea', label: 'Pencapaian Minggu Ini' },
            { id: 'challenges', type: 'textarea', label: 'Tantangan' }
        ]
    }
};

export function init() {
    loadState();
    setupEventListeners();
    renderJournal();
}

function getCurrentCycle() {
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
        start: cycleStart.toISOString(),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    };
}

function loadState() {
    const savedState = localStorage.getItem('taskify-journal');
    if (savedState) {
        Object.assign(state, JSON.parse(savedState));
        
        // Check if we need to start a new cycle
        const now = new Date();
        const cycleEnd = new Date(state.currentCycle.end);
        if (now > cycleEnd) {
            archiveCurrentCycle();
            state.currentCycle = getCurrentCycle();
            state.entries = {};
        }
    }
}

function saveState() {
    localStorage.setItem('taskify-journal', JSON.stringify({
        entries: state.entries,
        currentCycle: state.currentCycle,
        templates: state.templates
    }));
}

function archiveCurrentCycle() {
    const archives = JSON.parse(localStorage.getItem('taskify-journal-archives') || []);
    archives.push({
        cycle: state.currentCycle,
        entries: state.entries
    });
    localStorage.setItem('taskify-journal-archives', JSON.stringify(archives));
}

function setupEventListeners() {
    document.getElementById('journal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveJournalEntry();
    });

    document.getElementById('journal-date').addEventListener('change', (e) => {
        loadJournalEntry(e.target.value);
    });

    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('journal-mood').value = this.dataset.value;
        });
    });

    document.getElementById('quick-add-journal').addEventListener('click', () => {
        document.getElementById('quick-add-modal').classList.remove('active');
        document.getElementById('journal-modal').classList.add('active');
        document.getElementById('journal-date').value = new Date().toISOString().split('T')[0];
        loadJournalEntry(document.getElementById('journal-date').value);
    });
}

function renderJournal() {
    renderJournalCalendar();
    renderRecentEntries();
    renderJournalStats();
}

function renderJournalCalendar() {
    const calendarEl = document.getElementById('journal-calendar');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Generate calendar days
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    let calendarHTML = '';
    
    // Previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarHTML += `<div class="calendar-day inactive"></div>`;
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasEntry = state.entries[dateStr] !== undefined;
        
        calendarHTML += `
            <div class="calendar-day ${hasEntry ? 'has-entry' : ''} ${day === now.getDate() ? 'today' : ''}"
                 data-date="${dateStr}">
                ${day}
                ${hasEntry ? '<span class="entry-dot"></span>' : ''}
            </div>
        `;
    }
    
    calendarEl.innerHTML = calendarHTML;
    
    // Add click event to calendar days
    document.querySelectorAll('.calendar-day:not(.inactive)').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            document.getElementById('journal-modal').classList.add('active');
            document.getElementById('journal-date').value = date;
            loadJournalEntry(date);
        });
    });
}

function loadJournalEntry(date) {
    const entry = state.entries[date] || {};
    const form = document.getElementById('journal-form');
    
    // Reset form
    form.reset();
    
    // Set values from entry
    for (const [key, value] of Object.entries(entry)) {
        if (form.elements[key]) {
            form.elements[key].value = value;
        }
    }
    
    // Set mood button
    if (entry.mood) {
        const moodBtn = document.querySelector(`.mood-btn[data-value="${entry.mood}"]`);
        if (moodBtn) {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            moodBtn.classList.add('active');
        }
    }
}

function saveJournalEntry() {
    const formData = new FormData(document.getElementById('journal-form'));
    const date = formData.get('date');
    
    const entry = {};
    for (const [key, value] of formData.entries()) {
        if (key !== 'date' && value.trim() !== '') {
            entry[key] = value;
        }
    }
    
    if (Object.keys(entry).length > 0) {
        state.entries[date] = entry;
        saveState();
        renderJournal();
        
        // Show success feedback
        const submitBtn = document.getElementById('journal-submit-btn');
        submitBtn.textContent = 'Tersimpan!';
        submitBtn.classList.add('bg-green-500');
        setTimeout(() => {
            submitBtn.textContent = 'Simpan Entri';
            submitBtn.classList.remove('bg-green-500');
        }, 2000);
    }
    
    document.getElementById('journal-modal').classList.remove('active');
}

function renderRecentEntries() {
    const entriesList = document.getElementById('recent-entries');
    entriesList.innerHTML = '';
    
    const sortedEntries = Object.entries(state.entries)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .slice(0, 5);
    
    if (sortedEntries.length === 0) {
        entriesList.innerHTML = '<p class="text-gray-500">Belum ada entri terbaru</p>';
        return;
    }
    
    sortedEntries.forEach(([date, entry]) => {
        const entryEl = document.createElement('div');
        entryEl.className = 'journal-entry';
        
        const moodEmoji = ['😢', '😞', '😐', '😊', '😁'][parseInt(entry.mood) - 1] || '';
        
        entryEl.innerHTML = `
            <div class="entry-header">
                <h4 class="entry-date">${formatJournalDate(date)}</h4>
                ${entry.mood ? `<span class="entry-mood">${moodEmoji}</span>` : ''}
            </div>
            ${entry.work_hours ? `<p><strong>Jam Kerja:</strong> ${entry.work_hours} jam</p>` : ''}
            ${entry.learning ? `<p class="entry-learning">${truncateText(entry.learning, 100)}</p>` : ''}
            <button class="view-entry" data-date="${date}">Lihat Detail</button>
        `;
        
        entryEl.querySelector('.view-entry').addEventListener('click', () => {
            document.getElementById('journal-modal').classList.add('active');
            document.getElementById('journal-date').value = date;
            loadJournalEntry(date);
        });
        
        entriesList.appendChild(entryEl);
    });
}

function renderJournalStats() {
    const statsEl = document.getElementById('journal-stats');
    const entries = Object.values(state.entries);
    
    if (entries.length === 0) {
        statsEl.innerHTML = '<p class="text-gray-500">Belum ada data statistik</p>';
        return;
    }
    
    // Calculate stats
    const totalWorkHours = entries.reduce((sum, entry) => sum + (parseFloat(entry.work_hours) || 0), 0);
    const avgMood = entries.reduce((sum, entry) => sum + (parseInt(entry.mood) || 0), 0) / entries.length;
    const entryCount = entries.length;
    
    statsEl.innerHTML = `
        <div class="stat-card">
            <h4>Total Entri</h4>
            <p class="stat-value">${entryCount}</p>
        </div>
        <div class="stat-card">
            <h4>Total Jam Kerja</h4>
            <p class="stat-value">${totalWorkHours.toFixed(1)} jam</p>
        </div>
        <div class="stat-card">
            <h4>Rata-rata Mood</h4>
            <p class="stat-value">${avgMood.toFixed(1)}/5</p>
        </div>
    `;
}

function formatJournalDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}