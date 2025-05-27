// finflow/js/src/ui.js
export function displayError(message, elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden'); // Assuming 'hidden' class controls visibility
    } else {
        console.warn(`Element with ID ${elementId} not found to display error.`);
    }
}

export function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.add('hidden');
    }
}

export function showLoading(elementId) {
    const loadingElement = document.getElementById(elementId);
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
}

export function hideLoading(elementId) {
    const loadingElement = document.getElementById(elementId);
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

// Add other UI helper functions as needed, for example:
// - Creating and appending elements
// - Handling modals
// - Generic list rendering (though often better handled by component-specific functions)

// Example of a more complex UI function that might be added later:
/*
export function renderTransactionList(transactions, listElementId) {
    const listElement = document.getElementById(listElementId);
    if (!listElement) return;

    listElement.innerHTML = ''; // Clear previous items

    if (transactions.length === 0) {
        listElement.innerHTML = '<p class="text-center text-medium-gray-text py-4">No transactions to display.</p>';
        return;
    }

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'flex items-center py-3 border-b border-gray-100 last:border-b-0';
        // ... build transaction item HTML using transaction data ...
        listElement.appendChild(item);
    });
}
*/
