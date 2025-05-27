// finflow/js/src/dashboard.js
/**
 * Handles the functionality for the Dashboard section.
 * This includes:
 *  - Fetching and displaying summary financial data (balance, income, expenses).
 *  - Fetching and displaying a list of recent transactions.
 *  - Formatting currency and dates for display.
 *  - Supporting demo mode with mock data and real API calls otherwise.
 *  - Refreshing data when the section becomes visible or when demo data changes.
 */
import { apiRequest } from './api.js';
import { isDemoMode } from './auth.js';
import { displayError, showLoading, hideLoading } from './ui.js'; // UI helpers for messages/loaders (if used)
import { getDemoSummary, getDemoRecentTransactions } from './demoData.js'; // Centralized demo data functions

// CATEGORY_COLORS remains as it's specific to dashboard's transaction display styling
const CATEGORY_COLORS = {
    "Food": "bg-red-200",
    "Income": "bg-green-200",
    "Entertainment": "bg-purple-200",
    "Utilities": "bg-yellow-200",
    "Health": "bg-blue-200",
    "Transport": "bg-indigo-200",
    "Shopping": "bg-pink-200",
    "Other": "bg-gray-200",
};

function formatCurrency(amount, withSign = false) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', // Consider making this configurable
    });
    let formattedAmount = formatter.format(Math.abs(amount));
    if (withSign) {
        formattedAmount = (amount < 0 ? "-" : "+") + formattedAmount;
    }
    return formattedAmount;
}

function formatDate(dateString) {
    // Assuming dateString is "YYYY-MM-DD"
    // For more complex formatting, Day.js is available (but not explicitly imported here yet)
    const date = new Date(dateString + 'T00:00:00'); // Ensure it's parsed as local date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Fetches summary and recent transaction data for the dashboard.
 * Uses demo data if in demo mode, otherwise makes API calls.
 * @returns {Promise<Object>} An object containing `summary` and `transactions` data.
 */
async function fetchDashboardData() {
    if (isDemoMode()) {
        console.log("Dashboard: Using demo data.");
        return { summary: getDemoSummary(), transactions: getDemoRecentTransactions(7) };
    }
    try {
        // showLoading('dashboard-loader'); 
        const summary = await apiRequest('/dashboard-summary', 'GET');
        const transactions = await apiRequest('/transactions?limit=7&sort=date_desc', 'GET');
        // hideLoading('dashboard-loader');
        return { summary, transactions };
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // In a real app, more sophisticated error handling (e.g., specific UI update) would be here.
        alert("API Error: Could not load dashboard data. Displaying demo data instead.");
        return { summary: getDemoSummary(), transactions: getDemoRecentTransactions(7) };
    }
}

/**
 * Displays the summary financial data on the dashboard.
 * @param {Object} data - The summary data object from `fetchDashboardData`.
 *                        Expected properties: currentBalance, totalIncomeThisMonth, totalExpensesThisMonth.
 */
function displaySummaryData(data) {
    const balanceEl = document.getElementById('dashboard-balance');
    const incomeEl = document.getElementById('dashboard-income');
    const expensesEl = document.getElementById('dashboard-expenses');

    if (balanceEl) balanceEl.textContent = formatCurrency(data.currentBalance);
    if (incomeEl) incomeEl.textContent = formatCurrency(data.totalIncomeThisMonth);
    if (expensesEl) {
        expensesEl.textContent = formatCurrency(data.totalExpensesThisMonth);
        // Tailwind classes handle text color, but JS can ensure it if needed, especially if classes might be dynamic.
        expensesEl.classList.remove('text-primary-green'); // Ensure it's not green if it was before
        expensesEl.classList.add('text-secondary-peach');  // Expenses are styled with secondary-peach
    }
}

/**
 * Displays the list of recent transactions on the dashboard.
 * @param {Array<Object>} transactions - An array of transaction objects from `fetchDashboardData`.
 */
function displayRecentTransactions(transactions) {
    const listElement = document.getElementById('recent-transactions-list');
    if (!listElement) {
        console.error("Dashboard: Recent transactions list element not found.");
        return;
    }

    listElement.innerHTML = ''; // Clear "Loading..." message or previous items

    if (!transactions || transactions.length === 0) {
        listElement.innerHTML = '<p class="text-center text-medium-gray-text py-4">No recent transactions.</p>';
        return;
    }

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        // Styling for each transaction item
        item.className = 'flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0';

        const categoryColor = CATEGORY_COLORS[transaction.category] || CATEGORY_COLORS["Other"];
        const amountColor = transaction.amount < 0 ? 'text-secondary-peach' : 'text-primary-green';
        // For income, explicitly add a '+', formatCurrency handles '-' for expenses via Math.abs
        const sign = transaction.amount > 0 ? '+' : ''; 

        item.innerHTML = `
            <div class="flex items-center">
                <span class="w-8 h-8 rounded-full ${categoryColor} mr-3"></span> <!-- Category color icon -->
                <div>
                    <p class="text-sm font-medium text-dark-gray-text">${transaction.description}</p>
                    <p class="text-xs text-medium-gray-text">${formatDate(transaction.date)}</p>
                </div>
            </div>
            <p class="text-sm font-medium ${amountColor}">${sign}${formatCurrency(transaction.amount)}</p>
        `;
        listElement.appendChild(item);
    });
}

/**
 * Initializes the dashboard functionality.
 * Sets up data loading and event listeners for dynamic updates.
 */
export async function initDashboard() {
    const dashboardSection = document.getElementById('dashboard-section');
    if (!dashboardSection) {
        console.warn("Dashboard: Section element not found. Skipping initialization.");
        return; 
    }

    /**
     * Fetches and displays all dashboard data (summary and transactions).
     * Checks if the dashboard section is visible before proceeding.
     */
    async function loadAndDisplayDashboard() {
        // Do not proceed if the dashboard section is currently hidden
        if (dashboardSection.classList.contains('hidden')) {
            // console.log("Dashboard: Section is hidden, skipping data load/display.");
            return; 
        }
        
        console.log("Dashboard: Initializing or refreshing data...");
        // Show a general loading state perhaps, if one exists for the whole section
        // showLoading('dashboard-section-loader'); 
        const data = await fetchDashboardData();
        if (data.summary) {
            displaySummaryData(data.summary);
        }
        if (data.transactions) {
            displayRecentTransactions(data.transactions);
        }
        // hideLoading('dashboard-section-loader');
    }

    // Initial load of dashboard data when the function is first called
    loadAndDisplayDashboard();

    // Listen for the custom 'demoDataChanged' event. If in demo mode, refresh the dashboard.
    // This allows the dashboard to reflect changes made in other sections (e.g., new demo expense).
    document.addEventListener('demoDataChanged', (event) => {
        if (isDemoMode() && !dashboardSection.classList.contains('hidden')) { 
            console.log('Dashboard: Detected demoDataChanged event, refreshing view.', event.detail);
            loadAndDisplayDashboard();
        }
    });

    // Observe changes to the dashboard section's visibility (e.g., when navigated to/from).
    // If it becomes visible, refresh its data.
    const observer = new MutationObserver((mutationsList) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!dashboardSection.classList.contains('hidden')) {
                    console.log("Dashboard: Section is now visible, refreshing data.");
                    loadAndDisplayDashboard();
                }
            }
        }
    });
    observer.observe(dashboardSection, { attributes: true });
}
