// finflow/js/src/main.js
/**
 * Main entry point for the FinFlow application's client-side JavaScript.
 * This script is loaded on the main application page (`index.html`).
 * It handles:
 *  - Checking user authentication status for protected pages.
 *  - Initializing the main layout and navigation.
 *  - Dynamically importing and initializing modules for specific sections (Dashboard, Budget, etc.)
 *    based on their presence in the DOM. This allows for code splitting and on-demand loading.
 */
import { checkAuth } from './auth.js';
import { initLayout } from './layout.js';
// Static import for Dashboard as it's the default view and likely always needed immediately.
import { initDashboard } from './dashboard.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // Ensure the user is authenticated before proceeding if not on an auth page.
    // `index.html` is considered a protected page.
    if (!window.location.pathname.includes('/auth/')) {
        checkAuth(); 
    }

    // Initialize the main layout (sidebar, mobile nav, section switching logic).
    initLayout();

    // Initialize the Dashboard section by default.
    // `initDashboard` should internally check if its specific elements are present.
    if (document.getElementById('dashboard-section')) {
        initDashboard();
    }
    
    // Dynamically import and initialize other sections.
    // This approach helps with code splitting, loading code only when needed.
    // These `init<PageName>` functions are expected to handle their own setup,
    // including attaching event listeners and potentially fetching initial data
    // if their section is visible (often managed via MutationObserver within the module).

    if (document.getElementById('budget-section')) {
        import('./budget.js')
            .then(module => module.initBudgetPage())
            .catch(err => console.error("Failed to load budget module:", err));
    }

    if (document.getElementById('stats-section')) {
        import('./statistics.js')
            .then(module => module.initStatisticsPage())
            .catch(err => console.error("Failed to load statistics module:", err));
    }

    if (document.getElementById('add-expense-section')) {
        import('./addExpense.js')
            .then(module => module.initAddExpenseForm())
            .catch(err => console.error("Failed to load addExpense module:", err));
    }
});
