// finflow/js/src/statistics.js
/**
 * Manages the Statistics page functionality.
 * This includes:
 *  - Allowing users to select a period for viewing statistics.
 *  - Fetching transaction data for the selected period (from API or demo store).
 *  - Rendering two charts using Chart.js:
 *    1. Spending by Category (Pie Chart).
 *    2. Monthly Spending Trend (Bar Chart).
 *  - Handling chart updates when the period changes or demo data is modified.
 *  - Displaying loading/error/no-data messages.
 */
import { apiRequest } from './api.js';
import { isDemoMode } from './auth.js';
import dayjs from 'dayjs'; // For date manipulations
import Chart from 'chart.js/auto'; // Chart.js library
import { getDemoTransactionsForPeriod } from './demoData.js'; // Centralized demo data

// Ensure Day.js and Chart.js are available globally if loaded via <script> tags
const Dayjs = window.dayjs;
const ChartJS = window.Chart;

// Module-level variables to hold chart instances for later destruction/update
let spendingPieChartInstance = null;
let monthlyTrendBarChartInstance = null;

const statsMessageAreaId = 'stats-message-area'; // ID for displaying messages

/**
 * Predefined colors for the pie chart segments.
 * @type {Array<string>}
 */
const pieChartColors = ['#FFAB91', '#FFCDD2', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#F0F4C3', '#FFE0B2'];


function setMessage(message, isError = false) {
    const messageArea = document.getElementById(statsMessageAreaId);
    if (messageArea) {
        messageArea.textContent = message;
        messageArea.className = `mb-4 text-center ${isError ? 'text-secondary-peach' : 'text-medium-gray-text'}`;
    } else {
        console.warn(`Statistics: Message area element with ID '${statsMessageAreaId}' not found.`);
    }
}

/**
 * Clears any message displayed in the statistics message area.
 */
function clearMessage() {
    setMessage('');
}

/**
 * Calculates start and end dates based on a selected period string.
 * @param {string} periodValue - The selected period (e.g., "This Month", "Last 3 Months").
 * @returns {Object} An object containing `startDate` and `endDate` as "YYYY-MM-DD" strings or null.
 */
function getPeriodDates(periodValue) {
    let startDate, endDate;
    const today = Dayjs();

    switch (periodValue) {
        case "This Month":
            startDate = today.startOf('month');
            endDate = today.endOf('month');
            break;
        case "Last Month":
            startDate = today.subtract(1, 'month').startOf('month');
            endDate = today.subtract(1, 'month').endOf('month');
            break;
        case "Last 3 Months": // current month + last 2 full months
            startDate = today.subtract(2, 'month').startOf('month');
            endDate = today.endOf('month');
            break;
        case "This Year":
            startDate = today.startOf('year');
            endDate = today.endOf('year');
            break;
        case "All Time":
        default:
            startDate = null; // Or a very old date like Dayjs('1970-01-01')
            endDate = null;   // Or today
            break;
    }
    return { 
        startDate: startDate ? startDate.format('YYYY-MM-DD') : null, 
        endDate: endDate ? endDate.format('YYYY-MM-DD') : null 
    };
}

async function loadStatisticsData() {
    clearMessage();
    const periodSelect = document.getElementById('stats-period-select');
    if (!periodSelect) {
        console.error("Statistics: Period select dropdown not found.");
        return;
    }
    const selectedPeriodValue = periodSelect.value;
    const { startDate, endDate } = getPeriodDates(selectedPeriodValue);

    let transactions = []; // To store fetched/demo transactions

    if (isDemoMode()) {
        setMessage('Loading demo statistics data...'); // Inform user
        transactions = getDemoTransactionsForPeriod(startDate, endDate); // Use centralized demo data
        
        console.log(`Statistics (Demo): Fetched ${transactions.length} transactions for period: ${selectedPeriodValue}`);
        if (transactions.length === 0) {
             setMessage('No demo transactions found for this period.');
        } else {
            clearMessage(); // Clear loading message
        }
        processAndRenderCharts(transactions); // Update charts with demo data
        return; // Exit for demo mode
    }

    // API Mode
    setMessage('Loading statistics data...'); // Inform user
    let apiEndpoint = '/transactions'; // Base endpoint for transactions
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    // Append query params if any exist
    if (queryParams.toString()) apiEndpoint += `?${queryParams.toString()}`;

    try {
        transactions = await apiRequest(apiEndpoint, 'GET'); // Fetch data from API
        if (transactions && transactions.length > 0) {
            clearMessage(); // Clear loading message
        } else {
            setMessage('No transactions found for this period.');
        }
        processAndRenderCharts(transactions || []); // Update charts (use empty array if transactions is null/undefined)
    } catch (error) {
        console.error("Statistics: Failed to load data from API:", error);
        setMessage(`Error loading data: ${error.data?.message || error.message || 'Unknown error'}`, true);
        processAndRenderCharts([]); // Clear charts or show empty state on error
    }
}

/**
 * Processes the transaction data and calls functions to render/update the charts.
 * @param {Array<Object>} transactions - The list of transactions to visualize.
 */
function processAndRenderCharts(transactions) {
    renderSpendingByCategoryChart(transactions);
    renderMonthlySpendingTrendChart(transactions);
}

/**
 * Renders or updates the "Spending by Category" pie chart.
 * @param {Array<Object>} transactions - Transactions to be aggregated for the chart.
 */
function renderSpendingByCategoryChart(transactions) {
    const ctx = document.getElementById('spendingByCategoryChart')?.getContext('2d');
    if (!ctx) {
        console.error("Statistics: Pie chart canvas context not found.");
        return;
    }

    // Destroy previous chart instance if it exists, to prevent conflicts/memory leaks
    if (spendingPieChartInstance) {
        spendingPieChartInstance.destroy();
    }

    // Aggregate spending by category (only expenses)
    const spendingByCategory = {};
    transactions.forEach(t => {
        if (t.amount < 0) { // Consider only expenses (negative amounts)
            spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + Math.abs(t.amount);
        }
    });

    const labels = Object.keys(spendingByCategory);
    const data = Object.values(spendingByCategory);

    if (labels.length === 0) {
        console.log("Statistics: No data for 'Spending by Category' chart for the selected period.");
        // Optionally, display a "no data" message on the canvas or hide it.
        // Chart.js might render an empty state by default.
        return;
    }
    
    spendingPieChartInstance = new ChartJS(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spending by Category',
                data: data,
                backgroundColor: pieChartColors.slice(0, labels.length), // Use dynamic slice
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Important for aspect-w-1 aspect-h-1
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Spending by Category'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function renderMonthlySpendingTrendChart(transactions) {
    const ctx = document.getElementById('monthlySpendingTrendChart')?.getContext('2d');
    if (!ctx) {
        console.error("Statistics: Bar chart canvas context not found.");
        return;
    }

    // Destroy previous instance
    if (monthlyTrendBarChartInstance) {
        monthlyTrendBarChartInstance.destroy();
    }

    const monthlySpending = {}; // Stores total expenses per month (YYYY-MM)

    // Determine the date range for the chart (labels)
    // This ensures even months with no transactions are shown within the range.
    let chartStartDate = Dayjs().startOf('month');
    let chartEndDate = Dayjs().endOf('month');

    if (transactions.length > 0) {
        // If there are transactions, base the range on min/max transaction dates
        const dates = transactions.map(t => Dayjs(t.date));
        chartStartDate = dates.reduce((min, d) => d.isBefore(min) ? d : min, dates[0]).startOf('month');
        chartEndDate = dates.reduce((max, d) => d.isAfter(max) ? d : max, dates[0]).endOf('month');
    } else {
        // If no transactions, use the selected period from the dropdown to define the range
        const periodSelect = document.getElementById('stats-period-select');
        const { startDate: periodStart, endDate: periodEnd } = getPeriodDates(periodSelect.value);
        if(periodStart && periodEnd) {
            chartStartDate = Dayjs(periodStart).startOf('month');
            chartEndDate = Dayjs(periodEnd).endOf('month');
        } else if (periodStart) { // For "All Time" if it has a defined start
            chartStartDate = Dayjs(periodStart).startOf('month');
        }
        // Ensure endDate is not before startDate
        if (chartEndDate.isBefore(chartStartDate)) chartEndDate = chartStartDate.clone().endOf('month');
    }
    
    // Populate months in the range with 0 spending initially
    let currentMonthIter = chartStartDate.clone();
    while (currentMonthIter.isSameOrBefore(chartEndDate, 'month')) {
        monthlySpending[currentMonthIter.format('YYYY-MM')] = 0;
        currentMonthIter = currentMonthIter.add(1, 'month');
    }

    // Aggregate expenses into their respective months
    transactions.forEach(t => {
        if (t.amount < 0) { // Only expenses
            const monthYear = Dayjs(t.date).format('YYYY-MM');
            if (monthlySpending.hasOwnProperty(monthYear)) { // Check if month is within our chart's range
                 monthlySpending[monthYear] += Math.abs(t.amount);
            }
        }
    });
    
    const labels = Object.keys(monthlySpending).map(my => Dayjs(my + '-01').format('MMM YYYY')); // Format for display
    const data = Object.values(monthlySpending);

    if (labels.length === 0) { // Or check if data contains only zeros
        console.log("Statistics: No data for 'Monthly Spending Trend' chart for the selected period.");
        return;
    }

    monthlyTrendBarChartInstance = new ChartJS(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Monthly Expenses',
                data: data,
                backgroundColor: '#90CAF9', // Accent Blue
                borderColor: '#64B5F6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Important for aspect-w-16 aspect-h-9
            plugins: {
                legend: {
                    display: false, // Typically not needed for single dataset bar charts
                },
                title: {
                    display: true,
                    text: 'Monthly Spending Trend'
                },
                tooltip: {
                     callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

export function initStatisticsPage() {
/**
 * Initializes the Statistics page.
 * Sets up event listeners for the period selector and MutationObserver for section visibility.
 * Also listens for `demoDataChanged` events to refresh charts in demo mode.
 */
export function initStatisticsPage() {
    const statsSection = document.getElementById('stats-section');
    const periodSelect = document.getElementById('stats-period-select');

    if (statsSection && periodSelect) {
        /**
         * Helper function to refresh the statistics display.
         * Checks if the section is visible before loading data.
         */
        function refreshStatisticsDisplay() {
            if (statsSection.classList.contains('hidden')) return; // Don't refresh if not visible
            console.log("Statistics: Refreshing display...");
            loadStatisticsData(); // This fetches data and re-renders charts
        }

        // Observe changes to section visibility.
        const observer = new MutationObserver((mutationsList) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!statsSection.classList.contains('hidden')) {
                        console.log("Statistics: Section is now visible, loading initial data.");
                        refreshStatisticsDisplay();
                    } else {
                        // If section becomes hidden, destroy charts to free resources and prevent errors
                        if (spendingPieChartInstance) spendingPieChartInstance.destroy();
                        if (monthlyTrendBarChartInstance) monthlyTrendBarChartInstance.destroy();
                        spendingPieChartInstance = null;
                        monthlyTrendBarChartInstance = null;
                        console.log("Statistics: Section hidden, charts destroyed.");
                    }
                }
            }
        });
        observer.observe(statsSection, { attributes: true });

        // Event listener for period selector changes
        periodSelect.addEventListener('change', loadStatisticsData);

        // Listen for 'demoDataChanged' event (e.g., from adding an expense in demo mode).
        // If in demo mode and this section is active, refresh the data.
        document.addEventListener('demoDataChanged', (event) => {
            if (isDemoMode() && !statsSection.classList.contains('hidden')) {
                console.log('Statistics: Detected demoDataChanged event, refreshing view.', event.detail);
                refreshStatisticsDisplay(); 
            }
        });
        
        // Initial data load if the section is already visible when the script runs.
        if (!statsSection.classList.contains('hidden')) {
            refreshStatisticsDisplay();
        }
    } else {
        if (!statsSection) console.warn("Statistics: Section element not found.");
        if (!periodSelect) console.warn("Statistics: Period select element not found.");
    }
}
