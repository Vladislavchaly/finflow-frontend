// finflow/js/src/loginPage.js
/**
 * Handles the logic for the login page (`auth/login.html`).
 * This includes:
 *  - Processing login form submissions.
 *  - Validating user input (email, password).
 *  - Making API requests to the login endpoint.
 *  - Storing the JWT on successful login and redirecting to the main app.
 *  - Displaying error messages.
 *  - Handling guest/demo mode login.
 */
import { apiRequest } from './api.js';
import { storeToken } from './auth.js';
import { displayError, clearError } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form'); // The main login form
    const guestLoginButton = document.getElementById('guest-login-button'); // Button for demo mode
    const errorDisplayElementId = 'login-error'; // ID of the div to display login errors

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            clearError(errorDisplayElementId); // Clear any previous errors

            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // Client-side validation
            if (!email || !password) {
                displayError('Please enter both email and password.', errorDisplayElementId);
                return;
            }
            if (!/\S+@\S+\.\S+/.test(email)) { // Basic email format check
                displayError('Please enter a valid email address.', errorDisplayElementId);
                return;
            }

            try {
                // API request to login.
                // The backend (e.g., Symfony with lexik_jwt_authentication) typically expects 'username' and 'password'.
                // Here, 'email' is used as the 'username'.
                const responseData = await apiRequest('/login_check', 'POST', { username: email, password: password }, false);
                
                if (responseData && responseData.token) {
                    storeToken(responseData.token); // Store the received JWT
                    window.location.href = '../index.html'; // Redirect to the main application page
                } else {
                    // This case might not be reached if apiRequest already throws for non-OK responses
                    // or if the token is unexpectedly missing in a successful (e.g., 200 OK) response.
                    displayError('Login failed: No token received from server.', errorDisplayElementId);
                }
            } catch (error) {
                console.error('Login error:', error);
                // Display specific error message from API if available, otherwise a generic one.
                if (error && error.data && error.data.message) {
                    displayError(`Login failed: ${error.data.message}`, errorDisplayElementId);
                } else if (error && error.message) { // For network errors or other issues not from API structure
                    displayError(`Login failed: ${error.message}`, errorDisplayElementId);
                } else {
                    displayError('Login failed. Please check your credentials or try again later.', errorDisplayElementId);
                }
            }
        });
    }

    // Event listener for the guest/demo login button
    if (guestLoginButton) {
        guestLoginButton.addEventListener('click', () => {
            clearError(errorDisplayElementId);
            console.log('Guest login button clicked - entering demo mode.');
            // Store a predefined demo token to simulate a logged-in demo user
            storeToken('demo-user-token-guest'); 
            window.location.href = '../index.html'; // Redirect to main application page
        });
    }
});
