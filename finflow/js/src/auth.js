// finflow/js/src/auth.js
/**
 * Manages JWT token for authentication, including storing, retrieving,
 * removing the token, and checking authentication status.
 * Also handles redirection to login page and demo mode detection.
 */

const TOKEN_KEY = 'jwtToken'; // Key used to store the JWT token in localStorage
const DEMO_TOKEN = 'demo-user-token-guest'; // Specific token value for demo mode

/**
 * Stores the JWT token in localStorage.
 * @param {string} token - The JWT token to store.
 */
export function storeToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieves the JWT token from localStorage.
 * @returns {string|null} The JWT token, or null if not found.
 */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Removes the JWT token from localStorage.
 */
export function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

/**
 * Checks if a user is currently authenticated (i.e., a token exists).
 * @returns {boolean} True if authenticated, false otherwise.
 */
export function isAuthenticated() {
    return !!getToken();
}

/**
 * Redirects the user to the login page.
 * Adjusts the path based on the current location (root or /auth/ directory).
 */
export function redirectToLogin() {
    // Adjust path relative to where this function is called FROM.
    if (window.location.pathname.includes('/auth/')) {
        window.location.href = 'login.html'; // Already in /auth/ folder
    } else {
        window.location.href = 'auth/login.html'; // From root or other locations
    }
}

/**
 * Logs out the current user by removing the token and redirecting to login.
 */
export function logoutUser() {
    removeToken();
    redirectToLogin();
}

/**
 * Checks if the user is authenticated. If not, redirects to the login page.
 * Intended for use on protected pages.
 */
export function checkAuth() {
    if (!isAuthenticated()) {
        redirectToLogin();
    }
}

/**
 * Checks if the application is currently in demo mode.
 * Demo mode is identified by a specific guest token.
 * @returns {boolean} True if in demo mode, false otherwise.
 */
export function isDemoMode() {
    return getToken() === DEMO_TOKEN;
}
