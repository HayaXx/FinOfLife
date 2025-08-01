// script.js - Main application controller
import { init as initTasks } from './modules/tasks.js';
import { init as initJournal } from './modules/journal.js';
import { init as initFinance } from './modules/finance.js';
import { init as initTimeTracker } from './modules/time-tracker.js';
import { init as initCalendar } from './modules/calendar.js';
import { init as initAnalytics } from './modules/analytics.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initTasks();
    initJournal();
    initFinance();
    initTimeTracker();
    initCalendar();
    initAnalytics();

    // Theme management
    const applyTheme = () => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    document.getElementById('theme-toggle').addEventListener('click', () => {
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme();
        lucide.createIcons();
    });

    // Navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            
            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove(
                'bg-indigo-50', 'dark:bg-indigo-900/50', 'text-indigo-600', 'dark:text-indigo-300'
            ));
            button.classList.add(
                'bg-indigo-50', 'dark:bg-indigo-900/50', 'text-indigo-600', 'dark:text-indigo-300'
            );

            // Show selected section
            sections.forEach(sec => sec.classList.add('hidden'));
            document.getElementById(`${section}-section`).classList.remove('hidden');
        });
    });

    // Initialize with dashboard visible
    document.querySelector('[data-section="dashboard"]').click();

    // Quick add modal
    const quickAddModal = document.getElementById('quick-add-modal');
    document.getElementById('quick-add-btn').addEventListener('click', () => {
        quickAddModal.classList.add('active');
    });

    document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Initialize
    applyTheme();
    lucide.createIcons();
});