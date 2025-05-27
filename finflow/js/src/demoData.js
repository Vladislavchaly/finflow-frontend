// finflow/js/src/demoData.js
/**
 * Manages in-memory data for the application's demo mode.
 * This includes initial data, accessor functions to get the data,
 * and mutator functions to modify the data (e.g., adding a transaction).
 * Changes to this data are intended for the current session only and are not persisted.
 * Dispatches a 'demoDataChanged' event when data is modified to allow UI components to refresh.
 */
import dayjs from 'dayjs';
const Dayjs = window.dayjs; // Assuming dayjs is loaded globally via script tag

// --- Initial Demo Data State ---

/**
 * Stores summary financial data for the dashboard in demo mode.
 * @type {Object}
 */
export let demoSummaryDataStore = {
  currentBalance: 12345.67,
  totalIncomeThisMonth: 6000.00,
  totalExpensesThisMonth: 2345.67, // Will be recalculated from demoMonthlyTransactions for current month
};

/**
 * Stores budget allocations for various categories in demo mode.
 * Initially set for the current month, but for simplicity in this demo,
 * this same budget is often reused across different months unless specific logic is added
 * to vary it per month in `getDemoBudgetDataForMonth`.
 * @type {Object.<string, number>}
 */
export let demoBudgetDataStore = { // For current month initially
  "Food": 500, "Rent": 1200, "Transport": 150, "Entertainment": 100, "Utilities": 80, "Shopping": 70, "Health": 50, "Education": 0, "Other": 60
};

/**
 * Central store for all transactions in demo mode.
 * This array serves as the source of truth for transactions across different features (dashboard, budget, statistics).
 * @type {Array<Object>}
 */
export let demoMonthlyTransactionsStore = [
  // Initial set of transactions spanning a few months for demo purposes
  // Dashboard typically shows last 5-7 transactions
  // Budget shows transactions for the selected month
  // Statistics can filter by various periods
  { id: 1, description: "Coffee Shop (Yesterday)", category: "Food", amount: -5.75, date: Dayjs().subtract(1, 'day').format('YYYY-MM-DD'), type: "expense" },
  { id: 2, description: "Freelance Payment (2 days ago)", category: "Income", amount: 750.00, date: Dayjs().subtract(2, 'day').format('YYYY-MM-DD'), type: "income" },
  { id: 3, description: "Book Store (3 days ago)", category: "Entertainment", amount: -25.00, date: Dayjs().subtract(3, 'day').format('YYYY-MM-DD'), type: "expense" },
  { id: 4, description: "Salary (Current Month)", category: "Income", amount: 5250.00, date: Dayjs().startOf('month').add(1, 'day').format('YYYY-MM-DD'), type: "income" },

  // Last month's transactions
  { id: 5, description: "Utilities Bill (Last Month)", category: "Utilities", amount: -120.00, date: Dayjs().subtract(1, 'month').date(15).format('YYYY-MM-DD'), type: "expense" },
  { id: 6, description: "Gym Membership (Last Month)", category: "Health", amount: -40.00, date: Dayjs().subtract(1, 'month').date(10).format('YYYY-MM-DD'), type: "expense" },
  
  // Two months ago
  { id: 7, description: "Old Food Expense", category: "Food", amount: -30.00, date: Dayjs().subtract(2, 'month').date(5).format('YYYY-MM-DD'), type: "expense" },
  { id: 8, description: "Client Project (2 Months Ago)", category: "Income", amount: 1200.00, date: Dayjs().subtract(2, 'month').date(12).format('YYYY-MM-DD'), type: "income" },

  // Three months ago
  { id: 9, description: "Concert Tickets (3 Months Ago)", category: "Entertainment", amount: -150.00, date: Dayjs().subtract(3, 'month').date(20).format('YYYY-MM-DD'), type: "expense" },
  { id: 10, description: "Shopping Spree (3 Months Ago)", category: "Shopping", amount: -200.00, date: Dayjs().subtract(3, 'month').date(5).format('YYYY-MM-DD'), type: "expense" },
];

// --- Helper Function ---

/**
 * Recalculates the `demoSummaryDataStore` based on the current `demoMonthlyTransactionsStore`.
 * This ensures that summary figures (balance, monthly income/expenses) are consistent
 * with the transaction list.
 */
function recalculateDemoSummary() {
    const currentMonth = Dayjs().format("YYYY-MM");
    let incomeThisMonth = 0;
    let expensesThisMonth = 0;
    let balance = 0; // Start balance from all transactions

    demoMonthlyTransactionsStore.forEach(t => {
        balance += t.amount; // Assumes income is positive, expense is negative
        if (Dayjs(t.date).format("YYYY-MM") === currentMonth) {
            if (t.amount > 0) {
                incomeThisMonth += t.amount;
            } else {
                expensesThisMonth += Math.abs(t.amount);
            }
        }
    });
    demoSummaryDataStore.currentBalance = balance;
    demoSummaryDataStore.totalIncomeThisMonth = incomeThisMonth;
    demoSummaryDataStore.totalExpensesThisMonth = expensesThisMonth;
}
recalculateDemoSummary(); // Initial calculation


// --- Accessor and Mutator Functions ---
// These functions provide controlled access to the demo data stores,
// ensuring that data is returned as a copy (to prevent direct modification)
// and that mutations trigger necessary recalculations and events.

// == Summary Data ==
/**
 * Retrieves a copy of the current demo summary data.
 * Recalculates summary data before returning to ensure it's up-to-date.
 * @returns {Object} A copy of `demoSummaryDataStore`.
 */
export function getDemoSummary() {
    recalculateDemoSummary(); 
    return JSON.parse(JSON.stringify(demoSummaryDataStore));
}

// == Transactions ==
/**
 * Retrieves a copy of the most recent demo transactions, sorted by date descending.
 * @param {number} [limit=7] - The maximum number of recent transactions to return.
 * @returns {Array<Object>} A copy of the recent transactions.
 */
export function getDemoRecentTransactions(limit = 7) {
    const sorted = [...demoMonthlyTransactionsStore].sort((a, b) => Dayjs(b.date).diff(Dayjs(a.date)));
    return JSON.parse(JSON.stringify(sorted.slice(0, limit)));
}

/**
 * Retrieves a copy of demo transactions for a specific month and year.
 * @param {string} monthYear - The month and year in "YYYY-MM" format.
 * @returns {Array<Object>} A copy of transactions for the specified month.
 */
export function getDemoTransactionsForMonth(monthYear) { 
    return JSON.parse(JSON.stringify(demoMonthlyTransactionsStore.filter(t => Dayjs(t.date).format("YYYY-MM") === monthYear)));
}

/**
 * Retrieves a copy of demo transactions within a specified date range.
 * @param {string|null} startDate - The start date in "YYYY-MM-DD" format, or null for no start limit.
 * @param {string|null} endDate - The end date in "YYYY-MM-DD" format, or null for no end limit.
 * @returns {Array<Object>} A copy of transactions within the period.
 */
export function getDemoTransactionsForPeriod(startDate, endDate) { 
    const filtered = demoMonthlyTransactionsStore.filter(t => {
        const tDate = Dayjs(t.date);
        const isAfterStart = startDate ? tDate.isSameOrAfter(Dayjs(startDate), 'day') : true;
        const isBeforeEnd = endDate ? tDate.isSameOrBefore(Dayjs(endDate), 'day') : true;
        return isAfterStart && isBeforeEnd;
    });
    return JSON.parse(JSON.stringify(filtered));
}

/**
 * Adds a new transaction to the demo data store.
 * Assigns a unique ID, ensures expenses are negative, recalculates summary data,
 * and dispatches a 'demoDataChanged' event.
 * @param {Object} transaction - The transaction object to add.
 * Expected properties: description, category, amount, date, type ('expense' or 'income').
 */
export function addDemoTransaction(transaction) {
    const newId = demoMonthlyTransactionsStore.length > 0 ? Math.max(...demoMonthlyTransactionsStore.map(t => t.id)) + 1 : 1;
    const newTransaction = { ...transaction, id: newId };

    if (newTransaction.type && newTransaction.type.toLowerCase() === 'expense' && newTransaction.amount > 0) {
        newTransaction.amount = -newTransaction.amount; // Ensure expenses are stored as negative
    }
    
    demoMonthlyTransactionsStore.unshift(newTransaction); // Add to the beginning for recency in some views
    recalculateDemoSummary(); 
    console.log("Demo transaction added, store updated:", newTransaction);
    console.log("New summary:", demoSummaryDataStore);

    document.dispatchEvent(new CustomEvent('demoDataChanged', { detail: { type: 'transactionAdded' } }));
}


// == Budget Data ==
/**
 * Retrieves a copy of the demo budget data for a specific month.
 * In this simple demo, the budget is the same for all months.
 * @param {string} monthYear - The month and year in "YYYY-MM" format (currently unused for retrieval logic).
 * @returns {Object} A copy of `demoBudgetDataStore`.
 */
export function getDemoBudgetDataForMonth(monthYear) { 
    // NOTE: For a more complex demo, this could return month-specific budgets:
    // return JSON.parse(JSON.stringify(demoBudgetDataStore[monthYear] || {}));
    return JSON.parse(JSON.stringify(demoBudgetDataStore));
}

/**
 * Updates the budgeted amount for a specific category in the demo data.
 * Currently updates a single shared budget object. Dispatches a 'demoDataChanged' event.
 * @param {string} category - The name of the category to update.
 * @param {number} newAmount - The new budgeted amount.
 * @param {string} monthYear - The month and year in "YYYY-MM" format (for logging, not for data structure key in this simple version).
 */
export function updateDemoBudget(category, newAmount, monthYear) { 
    demoBudgetDataStore[category] = newAmount;
    console.log(`Demo budget for ${category} (month ${monthYear}) updated to ${newAmount}`);
    document.dispatchEvent(new CustomEvent('demoDataChanged', { detail: { type: 'budgetUpdated', category, monthYear } }));
}
