// modules/finance.js
const state = {
    transactions: [],
    categories: [
        { id: 'food', name: 'Makanan', color: 'red', icon: 'utensils' },
        { id: 'transport', name: 'Transportasi', color: 'blue', icon: 'bus' },
        { id: 'housing', name: 'Perumahan', color: 'green', icon: 'home' },
        { id: 'entertainment', name: 'Hiburan', color: 'purple', icon: 'film' }
    ],
    budgets: {
        monthly: 5000000,
        categories: {
            food: 1500000,
            transport: 500000,
            housing: 2000000,
            entertainment: 1000000
        }
    }
};

export function init() {
    loadState();
    setupEventListeners();
    renderTransactions();
    renderBudgetOverview();
    renderCategorySpending();
}

function loadState() {
    const savedState = localStorage.getItem('taskify-finance');
    if (savedState) {
        Object.assign(state, JSON.parse(savedState));
    }
}

function saveState() {
    localStorage.setItem('taskify-finance', JSON.stringify({
        transactions: state.transactions,
        categories: state.categories,
        budgets: state.budgets
    }));
}

function setupEventListeners() {
    document.getElementById('finance-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addTransaction();
    });

    document.getElementById('quick-add-expense').addEventListener('click', () => {
        document.getElementById('quick-add-modal').classList.remove('active');
        document.getElementById('finance-modal').classList.add('active');
    });

    document.getElementById('budget-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateBudgets();
    });
}

function addTransaction() {
    const formData = new FormData(document.getElementById('finance-form'));
    const transaction = {
        id: `trans-${Date.now()}`,
        date: formData.get('date') || new Date().toISOString().split('T')[0],
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        description: formData.get('description'),
        type: formData.get('type') || 'expense'
    };

    state.transactions.push(transaction);
    saveState();
    renderTransactions();
    renderBudgetOverview();
    renderCategorySpending();

    document.getElementById('finance-modal').classList.remove('active');
    document.getElementById('finance-form').reset();
}

function updateBudgets() {
    const formData = new FormData(document.getElementById('budget-form'));
    
    state.budgets.monthly = parseFloat(formData.get('monthly-budget'));
    
    for (const category of state.categories) {
        const budget = formData.get(`budget-${category.id}`);
        if (budget) {
            state.budgets.categories[category.id] = parseFloat(budget);
        }
    }
    
    saveState();
    renderBudgetOverview();
    renderCategorySpending();
}

function renderTransactions() {
    const transactionsEl = document.getElementById('transactions-list');
    transactionsEl.innerHTML = '';

    const sortedTransactions = [...state.transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedTransactions.length === 0) {
        transactionsEl.innerHTML = '<p class="text-gray-500">Belum ada transaksi</p>';
        return;
    }

    sortedTransactions.forEach(trans => {
        const category = state.categories.find(c => c.id === trans.category) || {};
        const isExpense = trans.type === 'expense';
        
        const transEl = document.createElement('div');
        transEl.className = `transaction ${isExpense ? 'expense' : 'income'}`;
        transEl.innerHTML = `
            <div class="transaction-icon" style="background-color: var(--color-${category.color || 'gray'}-100)">
                <i data-lucide="${category.icon || 'dollar-sign'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-header">
                    <h4 class="transaction-category">${category.name || 'Lainnya'}</h4>
                    <span class="transaction-amount ${isExpense ? 'text-red-500' : 'text-green-500'}">
                        ${isExpense ? '-' : '+'}${formatCurrency(trans.amount)}
                    </span>
                </div>
                <div class="transaction-footer">
                    <span class="transaction-date">${formatDate(trans.date)}</span>
                    ${trans.description ? `<span class="transaction-desc">${trans.description}</span>` : ''}
                </div>
            </div>
        `;

        transactionsEl.appendChild(transEl);
    });

    lucide.createIcons();
}

function renderBudgetOverview() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyExpenses = state.transactions
        .filter(trans => trans.type === 'expense' && 
               new Date(trans.date).getMonth() === currentMonth &&
               new Date(trans.date).getFullYear() === currentYear)
        .reduce((sum, trans) => sum + trans.amount, 0);
    
    const remainingBudget = state.budgets.monthly - monthlyExpenses;
    const percentageUsed = (monthlyExpenses / state.budgets.monthly) * 100;
    
    const budgetEl = document.getElementById('budget-overview');
    budgetEl.innerHTML = `
        <div class="budget-progress">
            <div class="progress-bar" style="width: ${Math.min(percentageUsed, 100)}%"></div>
        </div>
        <div class="budget-stats">
            <div class="budget-stat">
                <span class="stat-label">Total Anggaran</span>
                <span class="stat-value">${formatCurrency(state.budgets.monthly)}</span>
            </div>
            <div class="budget-stat">
                <span class="stat-label">Pengeluaran</span>
                <span class="stat-value">${formatCurrency(monthlyExpenses)}</span>
            </div>
            <div class="budget-stat">
                <span class="stat-label">Sisa</span>
                <span class="stat-value ${remainingBudget < 0 ? 'text-red-500' : 'text-green-500'}">
                    ${formatCurrency(remainingBudget)}
                </span>
            </div>
        </div>
    `;
}

function renderCategorySpending() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const categorySpending = state.categories.map(category => {
        const spent = state.transactions
            .filter(trans => 
                trans.type === 'expense' && 
                trans.category === category.id &&
                new Date(trans.date).getMonth() === currentMonth &&
                new Date(trans.date).getFullYear() === currentYear)
            .reduce((sum, trans) => sum + trans.amount, 0);
            
        const budget = state.budgets.categories[category.id] || 0;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        
        return {
            ...category,
            spent,
            budget,
            percentage
        };
    });
    
    const spendingEl = document.getElementById('category-spending');
    spendingEl.innerHTML = '';
    
    categorySpending.forEach(category => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category-spending-item';
        categoryEl.innerHTML = `
            <div class="category-header">
                <div class="category-icon" style="background-color: var(--color-${category.color}-100)">
                    <i data-lucide="${category.icon}"></i>
                </div>
                <div class="category-name">${category.name}</div>
            </div>
            <div class="spending-progress">
                <div class="progress-bar" style="width: ${Math.min(category.percentage, 100)}%"></div>
            </div>
            <div class="spending-amounts">
                <span class="spent">${formatCurrency(category.spent)}</span>
                <span class="budget">${formatCurrency(category.budget)}</span>
            </div>
        `;
        
        spendingEl.appendChild(categoryEl);
    });
    
    lucide.createIcons();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
}