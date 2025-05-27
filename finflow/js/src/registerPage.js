// finflow/js/src/registerPage.js
/**
 * Handles the logic for the registration page (`auth/register.html`).
 * This includes:
 *  - Processing registration form submissions.
 *  - Validating user input (email, password, confirm password).
 *  - Making API requests to the registration endpoint.
 *  - Displaying error messages or handling success (e.g., redirecting to login).
 */
import { apiRequest } from './api.js';
import { displayError, clearError } from './ui.js';
// Import storeToken if your API auto-logins user and returns a token upon registration
// import { storeToken } from './auth.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form'); // The main registration form
    const errorDisplayElementId = 'register-error'; // ID of the div to display registration errors

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            clearError(errorDisplayElementId); // Clear previous errors

            const emailInput = registerForm.querySelector('#email');
            const passwordInput = registerForm.querySelector('#password');
            const confirmPasswordInput = registerForm.querySelector('#confirm-password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // Client-side validation
            if (!email || !password || !confirmPassword) {
                displayError('Please fill in all fields.', errorDisplayElementId);
                return;
            }
            if (!/\S+@\S+\.\S+/.test(email)) { // Basic email format check
                displayError('Please enter a valid email address.', errorDisplayElementId);
                return;
            }
            if (password !== confirmPassword) {
                displayError('Passwords do not match.', errorDisplayElementId);
                return;
            }
            if (password.length < 6) { // Example: Basic password length check
                displayError('Password must be at least 6 characters long.', errorDisplayElementId);
                return;
            }

            try {
                // API request to register.
                // Assuming API expects {email: email, password: password} for the registration endpoint.
                const responseData = await apiRequest('/register', 'POST', { email: email, password: password }, false);

                // Handle successful registration.
                // Typically, the user is redirected to the login page with a success message.
                // If the API auto-logs in and returns a token, that should be handled here (see commented-out storeToken example).
                
                alert('Registration successful! Please login.'); // User-friendly success indication
                window.location.href = 'login.html'; // Redirect to login page

            } catch (error) {
                console.error('Registration error:', error);
                // Display specific error message from API if available, otherwise a generic one.
                if (error && error.data && error.data.message) {
                    displayError(`Registration failed: ${error.data.message}`, errorDisplayElementId);
                } else if (error && error.data && error.data.detail) { // Common for Symfony validation errors
                    displayError(`Registration failed: ${error.data.detail}`, errorDisplayElementId);
                } else if (error && error.data && Array.isArray(error.data.violations)) { // Symfony validation bundle format
                    const messages = error.data.violations.map(v => v.title || v.message).join(' ');
                    displayError(`Registration failed: ${messages}`, errorDisplayElementId);
                } else if (error && error.message) { // Network or other non-API errors
                     displayError(`Registration failed: ${error.message}`, errorDisplayElementId);
                }
                else { // Fallback generic error
                    displayError('Registration failed. Please try again later.', errorDisplayElementId);
                }
            }
        });
    }
});
