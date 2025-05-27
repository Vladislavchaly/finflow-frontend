// finflow/js/src/addExpense.js
/**
 * Manages the "Add New Expense" form functionality.
 * This includes:
 *  - Handling form submission to add a new expense.
 *  - Client-side validation of form inputs.
 *  - Supporting demo mode by adding to a local demo data store.
 *  - Making API calls to persist the expense for real users.
 *  - Displaying success or error messages.
 *  - Resetting the form and handling cancellation.
 *  - Initializing the form with the current date.
 */
import { apiRequest } from './api.js';
import { isDemoMode } from './auth.js';
import { displayError, clearError } from './ui.js'; // UI helpers (though message display is custom here)
import dayjs from 'dayjs'; // For date handling
import { addDemoTransaction } from './demoData.js'; // For demo mode

// Ensure Day.js is available globally if loaded via <script> tag
const Dayjs = window.dayjs;

/**
 * Predefined categories for the expense form dropdown.
 * Should ideally match categories used elsewhere (e.g., budget, stats).
 * @type {Array<string>}
 */
const PREDEFINED_CATEGORIES = [
    "Food", "Rent", "Transport", "Entertainment", "Utilities", 
    "Shopping", "Health", "Education", "Other"
];

const formId = 'add-expense-form'; // ID of the expense form
const messageAreaId = 'add-expense-message'; // ID of the div for displaying messages

/**
 * Resets the "Add Expense" form to its initial state.
 * Clears all input fields, sets the date to today, and clears any messages.
 */
function resetForm() {
    const form = document.getElementById(formId);
    if (form) {
        form.reset(); // Resets all form fields to their initial values
        const dateInput = form.querySelector('#expense-date');
        if (dateInput) {
            dateInput.value = Dayjs().format('YYYY-MM-DD'); // Set date to today
        }
    }
    // Clear any success/error messages specifically for this form
    const messageArea = document.getElementById(messageAreaId);
    if (messageArea) {
        messageArea.textContent = '';
        messageArea.className = 'mt-4 text-sm'; // Reset classes
    }
}

function handleCancel() {
    resetForm();
    // Optional: Navigate to dashboard
    // This could be done by finding the dashboard link and simulating a click
    const dashboardLink = document.querySelector('a[data-section="dashboard-section"]');
    if (dashboardLink) {
        dashboardLink.click(); // This will use the existing layout.js logic
    }
}

async function handleAddExpenseSubmit(event) {
    event.preventDefault();
    
    const form = event.target; // The submitted form element
    const amountInput = form.querySelector('#expense-amount');
    const categoryInput = form.querySelector('#expense-category');
    const dateInput = form.querySelector('#expense-date');
    const noteInput = form.querySelector('#expense-note');
    const messageArea = document.getElementById(messageAreaId); // Element to display feedback

    // Clear previous messages and reset styling
    messageArea.textContent = '';
    messageArea.className = 'mt-4 text-sm'; // Default styling

    // Retrieve and trim/parse form values
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const dateValue = dateInput.value; // Date as string from input
    const note = noteInput.value.trim();

    // Client-side validation
    if (isNaN(amount) || amount <= 0) {
        messageArea.textContent = 'Please enter a valid positive amount.';
        messageArea.classList.add('text-secondary-peach'); // Error text color
        return;
    }
    if (!category) { // Check if a category is selected
        messageArea.textContent = 'Please select a category.';
        messageArea.classList.add('text-secondary-peach');
        return;
    }
    if (!dateValue || !Dayjs(dateValue).isValid()) { // Check for valid date
        messageArea.textContent = 'Please enter a valid date.';
        messageArea.classList.add('text-secondary-peach');
        return;
    }
    const formattedDate = Dayjs(dateValue).format("YYYY-MM-DD"); // Standardize date format for API/demo

    // Handle Demo Mode
    if (isDemoMode()) {
        const newExpense = {
            // id will be set by addDemoTransaction in demoData.js
            description: note || category, // Default description to category if note is empty
            category: category,
            amount: -Math.abs(amount), // Ensure expense amounts are stored as negative values
            date: formattedDate,
            type: "expense" // Explicitly set type
        };
        addDemoTransaction(newExpense); // Add to shared demo data store
        
        messageArea.textContent = 'Expense added in demo mode. Data is updated for this session only and not saved permanently. Other sections will update.';
        messageArea.classList.add('text-primary-green'); // Success text color
        resetForm(); // Clear the form for the next entry
        // Clear the success message after a delay
        setTimeout(() => {
             if (messageArea.textContent.includes('Expense added in demo mode')) { 
                messageArea.textContent = '';
                messageArea.className = 'mt-4 text-sm'; // Reset styling
             }
        }, 5000); 
        return; // Stop further execution for demo mode
    }

    // API Call for real users
    try {
        // The API expects 'description' not 'note' for the transaction text.
        // And it might expect 'type' ('expense' or 'income'). Amount should be positive for expense, API handles direction.
        // Or, API expects negative amount for expense. Current API spec for /transactions is POST {amount, category, date, description}
        // Let's assume positive amount for expense, and type is inferred or not needed for POST.
        // If API expects negative for expense, send -amount.
        await apiRequest('/transactions', 'POST', { 
            amount: amount, // Send positive amount
            category: category, 
            date: formattedDate, 
            description: note,
            type: "expense" // Explicitly set type if API supports/requires it
        });

        messageArea.textContent = 'Expense added successfully!';
        messageArea.classList.add('text-primary-green');
        resetForm();
        
        setTimeout(() => { // Clear message after a few seconds
            if (messageArea.textContent === 'Expense added successfully!') {
               messageArea.textContent = '';
               messageArea.className = 'mt-4 text-sm';
            }
       }, 3000);

        // Optional: Trigger data refresh for other components
        // This could be done via custom events or by directly calling re-init functions
        // if they are made accessible (e.g., exported and then re-imported or called via a global event bus)
        // Example: document.dispatchEvent(new CustomEvent('transactionAdded'));

    } catch (error) {
        console.error("Add expense error:", error);
        let errorMessage = 'Failed to add expense. Please try again.';
        if (error && error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error && error.message) {
            errorMessage = error.message;
        }
        messageArea.textContent = errorMessage;
        messageArea.classList.add('text-secondary-peach');
    }
}

export function initAddExpenseForm() {
    const form = document.getElementById(formId);
    const cancelBtn = document.getElementById('cancel-expense-button');
    const addExpenseSection = document.getElementById('add-expense-section'); // The main section container

    if (form && addExpenseSection) { 
        // Function to initialize or reset the form, particularly the date
        const initializeFormState = () => {
            console.log("Add Expense form is visible or just became visible, initializing/resetting date.");
            resetForm(); // Sets date to today and clears other fields
        };

        // If the section is already visible when this script runs, initialize form state.
        if (!addExpenseSection.classList.contains('hidden')) {
            initializeFormState();
        }

        // Observe the 'add-expense-section' for changes in its 'class' attribute (visibility).
        // This ensures the date is set to today when the user navigates to this section.
        const observer = new MutationObserver((mutationsList) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!addExpenseSection.classList.contains('hidden')) {
                        initializeFormState();
                        // It's generally fine to leave the observer active if initAddExpenseForm
                        // might be called multiple times by main.js and we want to ensure this always runs.
                        // If initAddExpenseForm is guaranteed to run only once per page load,
                        // then obs.disconnect() could be used after first successful initialization.
                    }
                }
            }
        });
        observer.observe(addExpenseSection, { attributes: true });

        // Attach event listeners
        form.addEventListener('submit', handleAddExpenseSubmit);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', handleCancel);
        }
    } else {
        if (!form) console.warn("Add Expense: Form element not found.");
        if (!addExpenseSection) console.warn("Add Expense: Section element not found.");
    }
}
