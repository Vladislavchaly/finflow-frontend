// finflow/js/src/loginPage.js
import { apiRequest } from './api.js';
import { storeToken } from './auth.js';
import { displayError, clearError } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const guestLoginButton = document.getElementById('guest-login-button');
    const errorDisplayElement = 'login-error'; // ID of the error display div

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError(errorDisplayElement);

            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                displayError('Please enter both email and password.', errorDisplayElement);
                return;
            }

            // Basic email format validation (optional, as server should validate)
            if (!/\S+@\S+\.\S+/.test(email)) {
                displayError('Please enter a valid email address.', errorDisplayElement);
                return;
            }

            try {
                // Assuming API expects {username: email, password: password} for /login_check
                // Based on Symfony's lexik_jwt_authentication bundle defaults.
                // If your API expects {email: email, ...}, change the payload.
                const responseData = await apiRequest('/login_check', 'POST', { username: email, password: password }, false);
                
                if (responseData && responseData.token) {
                    storeToken(responseData.token);
                    window.location.href = '../index.html';
                } else {
                    // This case might not be reached if apiRequest throws for non-OK responses
                    // or if the token is missing in a 200 OK response.
                    displayError('Login failed: No token received.', errorDisplayElement);
                }
            } catch (error) {
                console.error('Login error:', error);
                if (error && error.data && error.data.message) {
                    displayError(`Login failed: ${error.data.message}`, errorDisplayElement);
                } else if (error && error.message) { // For network errors or other non-API errors
                    displayError(`Login failed: ${error.message}`, errorDisplayElement);
                } else {
                    displayError('Login failed. Please try again.', errorDisplayElement);
                }
            }
        });
    }

    if (guestLoginButton) {
        guestLoginButton.addEventListener('click', () => {
            clearError(errorDisplayElement);
            console.log('Guest login clicked');
            // Simulate successful login with a demo token
            storeToken('demo-user-token-guest'); 
            window.location.href = '../index.html';
        });
    }
});
