// modules/calendar.js
const state = {
    events: [],
    view: 'month',
    currentDate: new Date()
};

export function init() {
    loadState();
    setupEventListeners();
    renderCalendar();
}

function loadState() {
    const savedState = localStorage.getItem('taskify-calendar');
    if (savedState) {
        Object.assign(state, JSON.parse(savedState));
    }
}

function saveState() {
    localStorage.setItem('taskify-calendar', JSON.stringify({
        events: state.events,
        currentDate: state.currentDate
    }));
}

function setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        saveState();
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        saveState();
        renderCalendar();
    });

    document.getElementById('today-btn').addEventListener('click', () => {
        state.currentDate = new Date();
        saveState();
        renderCalendar();
    });

    document.getElementById('view-selector').addEventListener('change', (e) => {
        state.view = e.target.value;
        renderCalendar();
    });

    document.getElementById('quick-add-event').addEventListener('click', () => {
        document.getElementById('quick-add-modal').classList.remove('active');
        document.getElementById('event-modal').classList.add('active');
    });

    document.getElementById('event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });
}

function renderCalendar() {
    updateCalendarHeader();
    
    if (state.view === 'month') {
        renderMonthView();
    } else {
        renderWeekView();
    }
    
    renderUpcomingEvents();
}

function updateCalendarHeader() {
    const monthYear = state.currentDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
    });
    
    document.getElementById('calendar-month-year').textContent = monthYear;
}

function renderMonthView() {
    const calendarEl = document.getElementById('calendar-grid');
    calendarEl.innerHTML = '';
    
    // Set up date information
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    // Adjust first day to Monday (1) instead of Sunday (0)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    // Add day headers
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    dayNames.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarEl.appendChild(dayHeader);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        calendarEl.appendChild(emptyCell);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const isToday = date.toDateString() === today.toDateString();
        const dayEvents = state.events.filter(event => 
            event.date === dateStr || 
            (event.endDate && dateStr >= event.date && dateStr <= event.endDate)
        );
        
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${isToday ? 'today' : ''}`;
        dayElement.dataset.date = dateStr;
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-events">
                ${dayEvents.slice(0, 2).map(event => `
                    <div class="calendar-event" style="--event-color: var(--color-${event.color || 'indigo'}-500)">
                        ${event.title}
                    </div>
                `).join('')}
                ${dayEvents.length > 2 ? 
                  `<div class="more-events">+${dayEvents.length - 2} lagi</div>` : ''}
            </div>
        `;
        
        dayElement.addEventListener('click', () => {
            showDayDetails(dateStr);
        });
        
        calendarEl.appendChild(dayElement);
    }
}

function renderWeekView() {
    const calendarEl = document.getElementById('calendar-grid');
    calendarEl.innerHTML = '';
    
    // Get current week
    const weekStart = getWeekStartDate(state.currentDate);
    const today = new Date();
    
    // Add time slots
    const timeSlots = [];
    for (let hour = 7; hour < 20; hour++) {
        timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    // Create grid
    calendarEl.style.gridTemplateColumns = '80px repeat(7, 1fr)';
    
    // Add day headers
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-time-header';
    calendarEl.appendChild(dayHeader);
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day-header';
        dayElement.innerHTML = `
            <div>${day.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
            <div class="day-number ${day.toDateString() === today.toDateString() ? 'today' : ''}">
                ${day.getDate()}
            </div>
        `;
        calendarEl.appendChild(dayElement);
    }
    
    // Add time slots and events
    timeSlots.forEach(time => {
        const timeElement = document.createElement('div');
        timeElement.className = 'calendar-time-slot';
        timeElement.textContent = time;
        calendarEl.appendChild(timeElement);
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            const dateStr = day.toISOString().split('T')[0];
            
            const timeSlot = document.createElement('div');
            timeSlot.className = 'calendar-time-cell';
            timeSlot.dataset.time = `${dateStr}T${time}`;
            
            // Find events for this time slot
            const hour = parseInt(time.split(':')[0]);
            const events = state.events.filter(event => {
                if (!event.time) return false;
                
                const eventDate = new Date(`${event.date}T${event.time}`);
                return eventDate.toDateString() === day.toDateString() && 
                       eventDate.getHours() === hour;
            });
            
            if (events.length > 0) {
                timeSlot.innerHTML = events.map(event => `
                    <div class="calendar-event" style="--event-color: var(--color-${event.color || 'indigo'}-500)">
                        ${event.title}
                    </div>
                `).join('');
            }
            
            calendarEl.appendChild(timeSlot);
        }
    });
}

function getWeekStartDate(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(date.setDate(diff));
}

function renderUpcomingEvents() {
    const upcomingEl = document.getElementById('upcoming-events');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const upcoming = state.events
        .filter(event => event.date >= todayStr)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    upcomingEl.innerHTML = '';
    
    if (upcoming.length === 0) {
        upcomingEl.innerHTML = '<p class="text-gray-500">Tidak ada acara mendatang</p>';
        return;
    }
    
    upcoming.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'upcoming-event';
        
        const eventDate = new Date(event.date);
        const isToday = event.date === todayStr;
        
        eventEl.innerHTML = `
            <div class="event-date ${isToday ? 'today' : ''}">
                <div class="event-day">${eventDate.toLocaleDateString('id-ID', { weekday: 'short' })}</div>
                <div class="event-number">${eventDate.getDate()}</div>
            </div>
            <div class="event-details">
                <h4 class="event-title">${event.title}</h4>
                ${event.time ? `<div class="event-time"><i data-lucide="clock"></i> ${event.time}</div>` : ''}
                ${event.location ? `<div class="event-location"><i data-lucide="map-pin"></i> ${event.location}</div>` : ''}
            </div>
        `;
        
        upcomingEl.appendChild(eventEl);
    });
    
    lucide.createIcons();
}

function showDayDetails(dateStr) {
    const date = new Date(dateStr);
    const dayEvents = state.events.filter(event => 
        event.date === dateStr || 
        (event.endDate && dateStr >= event.date && dateStr <= event.endDate)
    );
    
    document.getElementById('day-view-date').textContent = 
        date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const eventsList = document.getElementById('day-view-events');
    eventsList.innerHTML = '';
    
    if (dayEvents.length === 0) {
        eventsList.innerHTML = '<p class="text-gray-500">Tidak ada acara di hari ini</p>';
    } else {
        dayEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'day-event';
            eventEl.innerHTML = `
                <div class="event-color" style="background-color: var(--color-${event.color || 'indigo'}-500)"></div>
                <div class="event-content">
                    <h4 class="event-title">${event.title}</h4>
                    ${event.time ? `<div class="event-time"><i data-lucide="clock"></i> ${event.time}</div>` : ''}
                    ${event.location ? `<div class="event-location"><i data-lucide="map-pin"></i> ${event.location}</div>` : ''}
                    ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                </div>
                <button class="edit-event" data-id="${event.id}"><i data-lucide="edit"></i></button>
            `;
            
            eventEl.querySelector('.edit-event').addEventListener('click', () => {
                editEvent(event.id);
            });
            
            eventsList.appendChild(eventEl);
        });
    }
    
    document.getElementById('day-view').classList.remove('hidden');
    document.getElementById('calendar-view').classList.add('hidden');
    
    lucide.createIcons();
}

function saveEvent() {
    const formData = new FormData(document.getElementById('event-form'));
    const eventData = Object.fromEntries(formData.entries());
    
    if (eventData.id) {
        // Update existing event
        state.events = state.events.map(event => 
            event.id === eventData.id ? { ...event, ...eventData } : event
        );
    } else {
        // Create new event
        const newEvent = {
            ...eventData,
            id: `event-${Date.now()}`,
            color: eventData.color || 'indigo'
        };
        state.events.push(newEvent);
    }
    
    saveState();
    renderCalendar();
    document.getElementById('event-modal').classList.remove('active');
    document.getElementById('event-form').reset();
}

function editEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    
    const form = document.getElementById('event-form');
    form.reset();
    
    for (const [key, value] of Object.entries(event)) {
        if (form.elements[key]) {
            form.elements[key].value = value;
        }
    }
    
    document.getElementById('day-view').classList.add('hidden');
    document.getElementById('calendar-view').classList.remove('hidden');
    document.getElementById('event-modal').classList.add('active');
}