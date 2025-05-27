// finflow/js/src/main.js
import { checkAuth } from './auth.js';
import { initLayout } from './layout.js';

document.addEventListener('DOMContentLoaded', () => {
    // For index.html, which is a protected page
    if (!window.location.pathname.includes('/auth/')) {
        checkAuth(); 
    }
    initLayout();

    // Other initializations for dashboard, budget, stats will go here later
    // For example:
    // if (document.getElementById('dashboard-section')) {
    //     import('./dashboard.js').then(module => module.initDashboard());
    // }
    // if (document.getElementById('budget-section')) {
    //     import('./budget.js').then(module => module.initBudget());
    // }
    // if (document.getElementById('stats-section')) {
    //     import('./stats.js').then(module => module.initStats());
    // }
    // if (document.getElementById('add-expense-section')) {
    //     import('./addExpense.js').then(module => module.initAddExpenseForm());
    // }
});
