// modules/analytics.js
export function init() {
    loadData();
    setupEventListeners();
    renderAllCharts();
}

function loadData() {
    // In a real app, this would aggregate data from other modules
    // For now we'll use mock data
    this.data = {
        productivity: {
            labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
            datasets: [
                {
                    label: 'Produktivitas',
                    data: [7.2, 6.8, 8.1, 7.5, 6.3, 4.2, 2.5],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        taskCompletion: {
            labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
            datasets: [
                {
                    label: 'Tugas Selesai',
                    data: [12, 15, 8, 17],
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Tugas Terlewat',
                    data: [2, 1, 5, 0],
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2
                }
            ]
        },
        timeAllocation: {
            labels: ['Kerja', 'Belajar', 'Meeting', 'Istirahat', 'Lainnya'],
            datasets: [
                {
                    data: [35, 25, 15, 10, 15],
                    backgroundColor: [
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(156, 163, 175, 0.7)'
                    ]
                }
            ]
        },
        moodTrend: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'],
            datasets: [
                {
                    label: 'Rata-rata Mood',
                    data: [3.8, 4.2, 3.5, 4.0, 4.5, 4.1, 4.3],
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        }
    };
}

function setupEventListeners() {
    document.getElementById('time-period-select').addEventListener('change', (e) => {
        updateChartsForTimePeriod(e.target.value);
    });
}

function renderAllCharts() {
    renderProductivityChart();
    renderTaskCompletionChart();
    renderTimeAllocationChart();
    renderMoodTrendChart();
}

function renderProductivityChart() {
    const ctx = document.getElementById('productivity-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: this.data.productivity,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Produktivitas Harian (jam)'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw} jam`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jam Produktif'
                    }
                }
            }
        }
    });
}

function renderTaskCompletionChart() {
    const ctx = document.getElementById('task-completion-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: this.data.taskCompletion,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Penyelesaian Tugas Mingguan'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Tugas'
                    }
                }
            }
        }
    });
}

function renderTimeAllocationChart() {
    const ctx = document.getElementById('time-allocation-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: this.data.timeAllocation,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Alokasi Waktu'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} jam (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderMoodTrendChart() {
    const ctx = document.getElementById('mood-trend-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: this.data.moodTrend,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tren Mood Bulanan'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Mood: ${context.raw}/5`
                    }
                }
            },
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    },
                    title: {
                        display: true,
                        text: 'Rating Mood'
                    }
                }
            }
        }
    });
}

function updateChartsForTimePeriod(period) {
    // In a real app, this would fetch/calculate data for the selected period
    console.log(`Updating charts for period: ${period}`);
    // For now, we'll just reload the same data
    renderAllCharts();
}