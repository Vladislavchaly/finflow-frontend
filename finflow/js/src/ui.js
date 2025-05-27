// finflow/js/src/ui.js
/**
 * UI helper functions for common tasks like displaying errors,
 * clearing errors, and managing loading indicators.
 */

/**
 * Displays an error message in a specified HTML element.
 * @param {string} message - The error message to display.
 * @param {string} elementId - The ID of the HTML element where the error should be shown.
 *                             This element is expected to exist in the DOM.
 */
export function displayError(message, elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        // Assumes 'hidden' class controls visibility. Error messages are often styled with text color (e.g., text-red-500).
        // For styling, it's better to add a specific error class if not done via Tailwind directly on the element.
        errorElement.classList.remove('hidden'); 
    } else {
        console.warn(`UI Info: Element with ID '${elementId}' not found to display error message: "${message}"`);
    }
}

/**
 * Clears an error message from a specified HTML element and hides it.
 * @param {string} elementId - The ID of the HTML element where the error is shown.
 */
export function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.add('hidden'); // Hide the element
    }
}

/**
 * Shows a loading indicator element.
 * @param {string} elementId - The ID of the loading indicator element.
 */
export function showLoading(elementId) {
    const loadingElement = document.getElementById(elementId);
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    } else {
        console.warn(`UI Info: Element with ID '${elementId}' not found to show loading indicator.`);
    }
}

/**
 * Hides a loading indicator element.
 * @param {string} elementId - The ID of the loading indicator element.
 */
export function hideLoading(elementId) {
    const loadingElement = document.getElementById(elementId);
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    } else {
        console.warn(`UI Info: Element with ID '${elementId}' not found to hide loading indicator.`);
    }
}

// Further UI helper functions can be added below as the application grows.
// Examples:
// - Functions for creating and appending common DOM elements (e.g., list items, cards)
// - Functions for managing modals or pop-up notifications
// - More sophisticated generic list rendering functions (though often better handled by component-specific logic)

/*
// Example of a more complex UI function that might be added later:
// (This specific one is partially implemented in dashboard.js for transactions)
export function renderTransactionList(transactions, listElementId) {
    const listElement = document.getElementById(listElementId);
    if (!listElement) {
        console.error(`UI Error: Element with ID '${listElementId}' not found for rendering transaction list.`);
        return;
    }

    listElement.innerHTML = ''; // Clear previous items

    if (!transactions || transactions.length === 0) {
        listElement.innerHTML = '<p class="text-center text-medium-gray-text py-4">No transactions to display.</p>';
        return;
    }

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        // Example: item.className = 'flex items-center justify-between py-3 border-b border-gray-200';
        // ... build the transaction item's inner HTML using transaction data ...
        // item.innerHTML = `<span>${transaction.description}</span><span>${transaction.amount}</span>`;
        listElement.appendChild(item);
    });
}
*/
