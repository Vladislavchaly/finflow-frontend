// finflow/js/src/budget.js
/**
 * Manages the functionality for the Monthly Budget Planning page.
 * This includes:
 *  - Displaying and navigating between months.
 *  - Fetching/displaying budget categories with budgeted, spent, and remaining amounts.
 *  - Allowing users to edit budgeted amounts for categories.
 *  - Calculating and displaying progress bars for each category.
 *  - Showing overall budget summary (total budgeted, total remaining).
 *  - Supporting demo mode with mock data and API calls otherwise.
 *  - Refreshing data when the section becomes visible or when demo data changes.
 */
import { apiRequest } from './api.js';
import { isDemoMode } from './auth.js';
import { displayError, clearError, showLoading, hideLoading } from './ui.js'; // UI helpers
import dayjs from 'dayjs'; // For date manipulations
import { getDemoBudgetDataForMonth, getDemoTransactionsForMonth, updateDemoBudget } from './demoData.js'; // Centralized demo data

// Ensure Day.js is available globally if loaded via <script> tag, or it's handled by module system.
const Dayjs = window.dayjs;

// Module-level state variables
let currentSelectedMonth = Dayjs(); // Holds the currently viewed month, initialized to current month.
let localBudgetData = {};           // Stores budget settings { "CategoryName": budgetedAmount } for the current month.
let localTransactionsData = [];     // Stores transactions [{ category: "Name", amount: 123.45 }, ...] for the current month.

/**
 * Predefined list of budget categories. Ensures all categories are displayed
 * even if they have no budget or transactions yet.
 * @type {Array<string>}
 */
const PREDEFINED_CATEGORIES = [
    "Food", "Rent", "Transport", "Entertainment", "Utilities", 
    "Shopping", "Health", "Education", "Other"
];

/**
 * Formats a numerical amount into a currency string (USD).
 * @param {number} amount - The amount to format.
 * @param {boolean} [withSign=false] - Whether to prepend a '+' or '-' sign.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount, withSign = false) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    let formattedAmount = formatter.format(Math.abs(amount));
    if (withSign && amount !== 0) { // Only add sign if not zero
        formattedAmount = (amount < 0 ? "-" : "+") + formattedAmount;
    }
    return formattedAmount;
}

function displayMonth() {
    const monthDisplay = document.getElementById('current-month-display');
    if (monthDisplay) {
        monthDisplay.textContent = currentSelectedMonth.format("MMMM YYYY");
    }
}

/**
 * Changes the currently selected month by the given offset and reloads data.
 * @param {number} offset - The number of months to move (e.g., 1 for next, -1 for previous).
 */
function changeMonth(offset) {
    currentSelectedMonth = currentSelectedMonth.add(offset, 'month');
    displayMonth(); // Update UI for month name
    loadBudgetDataForCurrentMonth(); // Fetch and render data for the new month
}

/**
 * Fetches budget settings and transactions for the `currentSelectedMonth`.
 * Handles both demo mode and API calls. Updates `localBudgetData` and `localTransactionsData`.
 * Then calls functions to re-render the UI.
 */
async function loadBudgetDataForCurrentMonth() {
    const monthYearStr = currentSelectedMonth.format("YYYY-MM"); // Format for API requests or demo data keys
    // showLoading('budget-loader'); // Placeholder for potential loading indicator UI

    if (isDemoMode()) {
        console.log(`Budget: Using demo data for ${monthYearStr}`);
        localBudgetData = getDemoBudgetDataForMonth(monthYearStr);
        localTransactionsData = getDemoTransactionsForMonth(monthYearStr);
        
        renderBudgetCategories();
        updateBudgetSummary();
        // hideLoading('budget-loader');
        return;
    }

    // API Mode
    try {
        const [budgetSettings, transactions] = await Promise.all([
            apiRequest(`/budget?month=${monthYearStr}`, 'GET'),      // Fetch budget allocations
            apiRequest(`/transactions?month=${monthYearStr}`, 'GET') // Fetch transactions for this month
        ]);

        localBudgetData = {}; // Reset local store for API data
        if (budgetSettings && Array.isArray(budgetSettings)) {
            budgetSettings.forEach(item => {
                localBudgetData[item.category] = item.budgetedAmount;
            });
        }
        localTransactionsData = transactions || []; // Store transactions or empty array

    } catch (error) {
        console.error(`Budget: Failed to load data for ${monthYearStr}:`, error);
        displayError(`Could not load budget data. Error: ${error.message || 'Unknown error'}`, 'budget-page-error'); // Ensure 'budget-page-error' div exists
        // Fallback to empty data to prevent breaking the page on API errors
        localBudgetData = {}; 
        localTransactionsData = []; 
    } finally {
        renderBudgetCategories(); // Re-render categories list
        updateBudgetSummary();    // Re-calculate and display overall summary
        // hideLoading('budget-loader');
    }
}

/**
 * Calculates the total amount spent per category from `localTransactionsData`.
 * @returns {Object.<string, number>} An object mapping category names to total spent amounts.
 */
function calculateSpentAmounts() {
    const currentTransactions = localTransactionsData; 
    const spentAmounts = {};
    PREDEFINED_CATEGORIES.forEach(cat => spentAmounts[cat] = 0); // Initialize all categories to 0

    currentTransactions.forEach(transaction => {
        // Only sum up expenses (negative amounts)
        if (transaction.amount < 0 && PREDEFINED_CATEGORIES.includes(transaction.category)) {
            spentAmounts[transaction.category] += Math.abs(transaction.amount);
        }
    });
    return spentAmounts;
}

/**
 * Renders the list of budget categories with their details (budgeted, spent, remaining, progress bar).
 * Attaches event listeners to the 'budgeted' amount input fields.
 */
function renderBudgetCategories() {
    const listElement = document.getElementById('budget-categories-list');
    if (!listElement) {
        console.error("Budget: Categories list element not found.");
        return;
    }

    listElement.innerHTML = ''; // Clear previous category items
    const spentAmounts = calculateSpentAmounts();
    const currentBudgets = localBudgetData; 

    PREDEFINED_CATEGORIES.forEach(categoryName => {
        const budgetedAmount = parseFloat(currentBudgets[categoryName]) || 0;
        const spentAmount = parseFloat(spentAmounts[categoryName]) || 0;
        const remainingAmount = budgetedAmount - spentAmount;
        
        let progressPercent = 0;
        if (budgetedAmount > 0) {
            progressPercent = Math.min((spentAmount / budgetedAmount) * 100, 100); // Cap at 100% for normal display
        }
        if (spentAmount > budgetedAmount && budgetedAmount >= 0) { // If overspent
             progressPercent = 100; // Show bar as full red/peach
        }


        const item = document.createElement('div');
        item.className = 'budget-category-item bg-white-surface rounded-xl shadow-lg p-4 md:p-6';
        item.dataset.categoryName = categoryName;

        item.innerHTML = `
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="w-full md:w-1/4">
                    <h4 class="category-name text-lg font-semibold text-dark-gray-text">${categoryName}</h4>
                </div>
                <div class="w-full md:w-3/4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                        <p class="text-xs text-medium-gray-text mb-0.5">Budgeted</p>
                        <input type="number" class="budget-category-budgeted-input w-24 p-1 border rounded-md neumorphic-inset text-sm" data-category-name="${categoryName}" value="${budgetedAmount.toFixed(0)}" step="10">
                    </div>
                    <div>
                        <p class="text-xs text-medium-gray-text mb-0.5">Spent</p>
                        <p class="text-md font-medium text-medium-gray-text"><span class="budget-category-spent">${formatCurrency(spentAmount)}</span></p>
                    </div>
                    <div>
                        <p class="text-xs text-medium-gray-text mb-0.5">${remainingAmount < 0 ? 'Overspent' : 'Remaining'}</p>
                        <p class="text-md font-medium ${remainingAmount < 0 ? 'text-secondary-peach' : 'text-primary-green'}"><span class="budget-category-remaining">${formatCurrency(remainingAmount, true)}</span></p>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <div class="bg-gray-200 rounded-full h-2.5 w-full">
                    <div class="budget-category-progress-bar h-2.5 rounded-full ${spentAmount > budgetedAmount && budgetedAmount >=0 ? 'bg-secondary-peach' : 'bg-accent-blue'}" style="width: ${progressPercent.toFixed(2)}%;"></div>
                </div>
                ${spentAmount > budgetedAmount && budgetedAmount >=0 ? `<p class="text-xs text-secondary-peach mt-1 text-right">${((spentAmount/budgetedAmount)*100).toFixed(0)}% spent</p>` : ''}
            </div>
        `;
        listElement.appendChild(item);

        const inputElement = item.querySelector('.budget-category-budgeted-input');
        inputElement.addEventListener('change', handleBudgetAmountChange);
        inputElement.addEventListener('blur', handleBudgetAmountChange); // Also handle blur in case user clicks away
    });
    updateBudgetSummary(); // Call after rendering all categories
}

async function handleBudgetAmountChange(event) {
    const inputElement = event.target;
    const categoryName = inputElement.dataset.categoryName;
    let newBudgetValue = parseFloat(inputElement.value); // Get new value from input
    const monthYearStr = currentSelectedMonth.format("YYYY-MM");

    // Validate and sanitize the input value
    if (isNaN(newBudgetValue) || newBudgetValue < 0) {
        newBudgetValue = 0; 
        inputElement.value = newBudgetValue.toFixed(0); // Correct display in input field
    }

    if (isDemoMode()) {
        // In demo mode, update the shared demo data store
        updateDemoBudget(categoryName, newBudgetValue, monthYearStr); 
        alert(`Demo Mode: Budget for ${categoryName} updated to ${formatCurrency(newBudgetValue)}. This change is temporary and only for this session.`);
        // Re-sync local view of budget data after shared demo data is updated
        localBudgetData = getDemoBudgetDataForMonth(monthYearStr); 
    } else {
        // API Mode: Optimistically update local data first
        localBudgetData[categoryName] = newBudgetValue; 
        try {
            // Send update to the backend
            await apiRequest(`/budget`, 'PUT', { 
                month: monthYearStr,
                category: categoryName, 
                budgetedAmount: newBudgetValue 
            });
            // If API call is successful, local data is already consistent.
        } catch (error) {
            console.error(`Budget: Failed to update budget for ${categoryName}:`, error);
            displayError(`Could not update budget for ${categoryName}. Error: ${error.message || 'Unknown error'}`, 'budget-page-error');
            // TODO: Consider reverting localBudgetData[categoryName] here or re-fetching all data
            // for robust error handling. For now, the optimistic update remains.
        }
    }
    
    // Re-render the categories list and update the summary to reflect the change.
    // This ensures the UI (spent, remaining, progress bar for this category, and totals) is updated.
    renderBudgetCategories(); 
    updateBudgetSummary(); 
}

/**
 * Calculates and displays the overall budget summary (Total Budgeted, Remaining Budget).
 * Uses data from `localBudgetData` and calculated spent amounts.
 */
function updateBudgetSummary() {
    const currentBudgets = localBudgetData; 
    let totalBudgeted = 0;
    // Sum all budgeted amounts from the local data store
    Object.values(currentBudgets).forEach(amount => totalBudgeted += parseFloat(amount) || 0);

    const spentAmounts = calculateSpentAmounts(); // Get total spent per category
    let totalSpent = 0;
    // Sum all spent amounts
    Object.values(spentAmounts).forEach(amount => totalSpent += parseFloat(amount) || 0);
    
    const totalRemaining = totalBudgeted - totalSpent;

    const totalBudgetedEl = document.getElementById('total-budgeted-amount');
    const remainingBudgetEl = document.getElementById('remaining-budget-amount');
    const remainingBudgetTextEl = remainingBudgetEl ? remainingBudgetEl.closest('p').previousElementSibling : null;


    if (totalBudgetedEl) totalBudgetedEl.textContent = formatCurrency(totalBudgeted);
    if (remainingBudgetEl) {
        remainingBudgetEl.textContent = formatCurrency(totalRemaining, true); // Show sign
        remainingBudgetEl.classList.toggle('text-secondary-peach', totalRemaining < 0);
        remainingBudgetEl.classList.toggle('text-primary-green', totalRemaining >= 0);
        if(remainingBudgetTextEl) {
            remainingBudgetTextEl.textContent = totalRemaining < 0 ? "Total Overspent" : "Remaining Budget";
        }
    }
}


export function initBudgetPage() {
/**
 * Initializes the Budget Planning page.
 * Sets up event listeners for month navigation and observes section visibility
 * to refresh data. Also listens for `demoDataChanged` events.
 */
export function initBudgetPage() {
    const budgetSection = document.getElementById('budget-section');
    if (!budgetSection) {
        console.warn("Budget: Section element not found. Skipping initialization.");
        return;
    }

    /**
     * Helper function to refresh the entire budget display.
     * Checks if the section is visible before proceeding.
     */
    function refreshBudgetDisplay() {
        if (budgetSection.classList.contains('hidden')) return; // Don't refresh if not visible

        console.log("Budget: Refreshing display...");
        displayMonth(); 
        loadBudgetDataForCurrentMonth(); // This fetches data and triggers re-renders
    }
    
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    // Attach event listeners to month navigation buttons
    if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));
    
    // Initial display setup when the module is loaded and section is potentially visible.
    refreshBudgetDisplay();

    // Listen for 'demoDataChanged' event (e.g., from adding an expense in demo mode).
    // If in demo mode and the budget section is active, refresh its data.
    document.addEventListener('demoDataChanged', (event) => {
        if (isDemoMode() && !budgetSection.classList.contains('hidden')) {
            console.log('Budget: Detected demoDataChanged event, refreshing transactions.', event.detail);
            // Re-fetch transactions for the current month as they might have changed
            localTransactionsData = getDemoTransactionsForMonth(currentSelectedMonth.format("YYYY-MM"));
            // Budgets could also be affected if another part of the app could change them in demoData.js
            localBudgetData = getDemoBudgetDataForMonth(currentSelectedMonth.format("YYYY-MM"));
            renderBudgetCategories(); // Re-render categories with new transaction data
            updateBudgetSummary();    // Update overall summary
        }
    });

    // Use MutationObserver to detect when the budget section becomes visible
    // (e.g., due to navigation via layout.js). Refresh data upon becoming visible.
    const observer = new MutationObserver((mutationsList) => {
        for(const mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (!budgetSection.classList.contains('hidden')) {
                    console.log("Budget: Section is now visible, refreshing data.");
                    refreshBudgetDisplay();
                }
            }
        }
    });
    observer.observe(budgetSection, { attributes: true });
}
