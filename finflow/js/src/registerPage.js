// finflow/js/src/registerPage.js
import { apiRequest } from './api.js';
import { displayError, clearError } from './ui.js';
// Import storeToken if your API auto-logs in user and returns a token upon registration
// import { storeToken } from './auth.js'; 

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorDisplayElement = 'register-error'; // ID of the error display div

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError(errorDisplayElement);

            const emailInput = registerForm.querySelector('#email');
            const passwordInput = registerForm.querySelector('#password');
            const confirmPasswordInput = registerForm.querySelector('#confirm-password');

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // Client-side validation
            if (!email || !password || !confirmPassword) {
                displayError('Please fill in all fields.', errorDisplayElement);
                return;
            }
            if (!/\S+@\S+\.\S+/.test(email)) {
                displayError('Please enter a valid email address.', errorDisplayElement);
                return;
            }
            if (password !== confirmPassword) {
                displayError('Passwords do not match.', errorDisplayElement);
                return;
            }
            if (password.length < 6) { // Basic password length check
                displayError('Password must be at least 6 characters long.', errorDisplayElement);
                return;
            }

            try {
                // Assuming API expects {email: email, password: password} for /register
                const responseData = await apiRequest('/register', 'POST', { email: email, password: password }, false);

                // Assuming successful registration returns a message and doesn't auto-login
                // If it auto-logins and returns a token:
                // if (responseData && responseData.token) {
                //     storeToken(responseData.token);
                //     window.location.href = '../index.html';
                // } else { ... }
                
                // For now, assume success means redirect to login with a success message (or display it here)
                // To display a success message on the login page, we can use query parameters or localStorage.
                // Simplest for now: alert and redirect.
                alert('Registration successful! Please login.'); // Replace with a nicer UI element if available
                window.location.href = 'login.html';

            } catch (error) {
                console.error('Registration error:', error);
                if (error && error.data && error.data.message) {
                    displayError(`Registration failed: ${error.data.message}`, errorDisplayElement);
                } else if (error && error.data && error.data.detail) { // Symfony validation errors often in detail
                    displayError(`Registration failed: ${error.data.detail}`, errorDisplayElement);
                } else if (error && error.data && Array.isArray(error.data.violations)) { // Symfony validation bundle
                    const messages = error.data.violations.map(v => v.title || v.message).join(' ');
                    displayError(`Registration failed: ${messages}`, errorDisplayElement);
                } else if (error && error.message) {
                     displayError(`Registration failed: ${error.message}`, errorDisplayElement);
                }
                else {
                    displayError('Registration failed. Please try again.', errorDisplayElement);
                }
            }
        });
    }
});
